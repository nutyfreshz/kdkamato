create table if not exists private.workout_exercise_logs (
  log_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(program_id) on delete cascade,
  item_id uuid not null references public.training_program_items(item_id) on delete cascade,
  exercise_key text not null,
  entry_date date not null,
  set_entries jsonb not null,
  control_status text null,
  issue_status text not null default 'NONE',
  optional_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_exercise_logs_unique unique (user_id, program_id, item_id, entry_date),
  constraint workout_exercise_logs_sets_array check (jsonb_typeof(set_entries) = 'array'),
  constraint workout_exercise_logs_control check (control_status is null or control_status in ('GOOD','OK','POOR')),
  constraint workout_exercise_logs_issue check (issue_status in ('NONE','DISCOMFORT','PAIN')),
  constraint workout_exercise_logs_note_len check (length(coalesce(optional_note,'')) <= 500)
);

create index if not exists workout_exercise_logs_user_program_date_idx
  on private.workout_exercise_logs (user_id, program_id, entry_date desc);
create index if not exists workout_exercise_logs_user_item_date_idx
  on private.workout_exercise_logs (user_id, item_id, entry_date desc);

revoke all on private.workout_exercise_logs from public, anon, authenticated;

create or replace function public.save_my_workout_exercise_log(
  p_item_id uuid,
  p_set_entries jsonb,
  p_control_status text default null,
  p_issue_status text default 'NONE',
  p_optional_note text default null,
  p_entry_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_program_id uuid;
  v_exercise_key text;
  v_planned_sets integer;
  v_date date := coalesce(p_entry_date, timezone('Asia/Bangkok', now())::date);
  v_log_id uuid;
  v_set jsonb;
  v_clean jsonb := '[]'::jsonb;
  v_index integer := 0;
  v_reps integer;
  v_load numeric;
  v_rir numeric;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_item_id is null then raise exception 'ITEM_REQUIRED'; end if;

  select ti.program_id, ti.exercise_key, ti.sets
    into v_program_id, v_exercise_key, v_planned_sets
  from public.training_program_items ti
  join public.programs p on p.program_id = ti.program_id
  where ti.item_id = p_item_id
    and p.user_id = v_uid
    and p.status = 'ACTIVE'
  limit 1;

  if v_program_id is null then raise exception 'ACTIVE_PROGRAM_ITEM_REQUIRED'; end if;
  if v_date > timezone('Asia/Bangkok', now())::date
     or v_date < timezone('Asia/Bangkok', now())::date - 30 then
    raise exception 'WORKOUT_LOG_DATE_OUT_OF_RANGE';
  end if;
  if p_control_status is not null and p_control_status not in ('GOOD','OK','POOR') then
    raise exception 'INVALID_CONTROL_STATUS';
  end if;
  if coalesce(p_issue_status,'NONE') not in ('NONE','DISCOMFORT','PAIN') then
    raise exception 'INVALID_ISSUE_STATUS';
  end if;
  if length(coalesce(p_optional_note,'')) > 500 then raise exception 'WORKOUT_LOG_NOTE_TOO_LONG'; end if;
  if p_set_entries is null or jsonb_typeof(p_set_entries) <> 'array' then raise exception 'SET_ENTRIES_ARRAY_REQUIRED'; end if;
  if jsonb_array_length(p_set_entries) < 1 or jsonb_array_length(p_set_entries) > v_planned_sets then
    raise exception 'SET_ENTRIES_COUNT_INVALID';
  end if;

  for v_set in select value from jsonb_array_elements(p_set_entries)
  loop
    v_index := v_index + 1;
    if jsonb_typeof(v_set) <> 'object' then raise exception 'SET_ENTRY_OBJECT_REQUIRED'; end if;
    begin
      v_reps := nullif(v_set->>'reps','')::integer;
      v_load := nullif(v_set->>'load_kg','')::numeric;
      v_rir := nullif(v_set->>'rir','')::numeric;
    exception when others then
      raise exception 'SET_ENTRY_NUMBER_INVALID';
    end;
    if v_reps is null or v_reps < 1 or v_reps > 100 then raise exception 'SET_REPS_INVALID'; end if;
    if v_load is not null and (v_load < 0 or v_load > 1000) then raise exception 'SET_LOAD_INVALID'; end if;
    if v_rir is not null and (v_rir < 0 or v_rir > 10) then raise exception 'SET_RIR_INVALID'; end if;

    v_clean := v_clean || jsonb_build_array(jsonb_build_object(
      'set', v_index,
      'reps', v_reps,
      'load_kg', v_load,
      'rir', v_rir
    ));
  end loop;

  insert into private.workout_exercise_logs(
    user_id, program_id, item_id, exercise_key, entry_date,
    set_entries, control_status, issue_status, optional_note
  ) values (
    v_uid, v_program_id, p_item_id, v_exercise_key, v_date,
    v_clean, p_control_status, coalesce(p_issue_status,'NONE'), nullif(btrim(coalesce(p_optional_note,'')),'')
  )
  on conflict (user_id, program_id, item_id, entry_date) do update set
    set_entries = excluded.set_entries,
    control_status = excluded.control_status,
    issue_status = excluded.issue_status,
    optional_note = excluded.optional_note,
    updated_at = now()
  returning log_id into v_log_id;

  return v_log_id;
end;
$$;

revoke execute on function public.save_my_workout_exercise_log(uuid,jsonb,text,text,text,date) from public, anon;
grant execute on function public.save_my_workout_exercise_log(uuid,jsonb,text,text,text,date) to authenticated;

create or replace function private.build_free_training_guidance(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_program record;
  v_item record;
  v_latest record;
  v_today record;
  v_items jsonb := '[]'::jsonb;
  v_recovery text[] := array[]::text[];
  v_latest_issue boolean := false;
  v_global_code text := 'KEEP';
  v_action text;
  v_set_count integer;
  v_min_reps integer;
  v_last_rir numeric;
  v_today_date date := timezone('Asia/Bangkok', now())::date;
  v_weight_count integer := 0;
  v_span_days integer := 0;
  v_first_avg numeric;
  v_last_avg numeric;
  v_first_count integer := 0;
  v_last_count integer := 0;
  v_weekly_pct numeric;
  v_nutrition_code text := 'INSUFFICIENT_DATA';
  v_nutrition_delta integer := 0;
  v_goal text;
  v_nt record;
begin
  select p.program_id, p.program_version, p.program_tier, p.goal_snapshot
    into v_program
  from public.programs p
  where p.user_id = p_user_id and p.status = 'ACTIVE'
  order by p.program_version desc
  limit 1;

  if v_program.program_id is null then
    return jsonb_build_object(
      'has_active_program', false,
      'global_code', 'NO_ACTIVE_PROGRAM',
      'items', '[]'::jsonb,
      'nutrition', jsonb_build_object('code','NO_ACTIVE_PROGRAM')
    );
  end if;

  select coalesce(array_agg(x.recovery_status order by x.entry_date desc), array[]::text[])
    into v_recovery
  from (
    select pe.entry_date, pe.recovery_status
    from public.progress_entries pe
    where pe.user_id = p_user_id and pe.recovery_status is not null
    order by pe.entry_date desc
    limit 2
  ) x;

  select coalesce(pe.new_issue,false)
    into v_latest_issue
  from public.progress_entries pe
  where pe.user_id = p_user_id
  order by pe.entry_date desc
  limit 1;

  if coalesce(array_length(v_recovery,1),0) >= 2 and v_recovery[1] = 'POOR' and v_recovery[2] = 'POOR' then
    v_global_code := 'REVIEW_RECOVERY';
  elsif coalesce(array_length(v_recovery,1),0) >= 1 and v_recovery[1] = 'POOR' then
    v_global_code := 'HOLD_RECOVERY';
  elsif v_latest_issue then
    v_global_code := 'REVIEW_ISSUE';
  end if;

  for v_item in
    select ti.item_id, ti.exercise_key, ti.sets, ti.rep_min, ti.rep_max, ti.target_rir, ti.metadata
    from public.training_program_items ti
    where ti.program_id = v_program.program_id
    order by ti.training_day, ti.display_order
  loop
    select l.* into v_latest
    from private.workout_exercise_logs l
    where l.user_id = p_user_id
      and l.program_id = v_program.program_id
      and l.item_id = v_item.item_id
    order by l.entry_date desc, l.updated_at desc
    limit 1;

    select l.* into v_today
    from private.workout_exercise_logs l
    where l.user_id = p_user_id
      and l.program_id = v_program.program_id
      and l.item_id = v_item.item_id
      and l.entry_date = v_today_date
    limit 1;

    v_set_count := 0;
    v_min_reps := null;
    v_last_rir := null;

    if v_latest.log_id is not null then
      select count(*), min((e.value->>'reps')::integer)
        into v_set_count, v_min_reps
      from jsonb_array_elements(v_latest.set_entries) e(value);
      begin
        v_last_rir := nullif(v_latest.set_entries->-1->>'rir','')::numeric;
      exception when others then
        v_last_rir := null;
      end;
    end if;

    if v_latest.log_id is null then
      v_action := 'FOLLOW_PLAN';
    elsif v_latest.issue_status in ('DISCOMFORT','PAIN') then
      v_action := 'REVIEW_EXERCISE';
    elsif v_global_code in ('REVIEW_RECOVERY','REVIEW_ISSUE') then
      v_action := 'REVIEW_PROGRAM';
    elsif v_global_code = 'HOLD_RECOVERY' then
      v_action := 'HOLD_RECOVERY';
    elsif v_latest.control_status = 'POOR' then
      v_action := 'HOLD_CONTROL';
    elsif v_set_count < v_item.sets then
      v_action := 'COMPLETE_TARGET';
    elsif v_min_reps < v_item.rep_min and coalesce(v_last_rir, 2) <= 1 then
      v_action := 'REDUCE_LOAD';
    elsif v_min_reps >= v_item.rep_max then
      if v_latest.control_status = 'GOOD' then
        if v_last_rir is null then
          v_action := 'READY_TO_PROGRESS';
        elsif v_last_rir >= greatest(1::numeric, v_item.target_rir - 1) then
          v_action := 'PROGRESS_LOAD';
        else
          v_action := 'HOLD_EFFORT';
        end if;
      elsif v_latest.control_status in ('OK','POOR') then
        v_action := 'HOLD_CONTROL';
      else
        v_action := 'READY_TO_PROGRESS';
      end if;
    else
      v_action := 'BUILD_REPS';
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'item_id', v_item.item_id,
      'exercise_key', v_item.exercise_key,
      'planned_sets', v_item.sets,
      'rep_min', v_item.rep_min,
      'rep_max', v_item.rep_max,
      'target_rir', v_item.target_rir,
      'progression', v_item.metadata->'progression',
      'action', v_action,
      'latest_log', case when v_latest.log_id is null then null else jsonb_build_object(
        'entry_date', v_latest.entry_date,
        'set_entries', v_latest.set_entries,
        'control_status', v_latest.control_status,
        'issue_status', v_latest.issue_status,
        'optional_note', v_latest.optional_note
      ) end,
      'today_log', case when v_today.log_id is null then null else jsonb_build_object(
        'entry_date', v_today.entry_date,
        'set_entries', v_today.set_entries,
        'control_status', v_today.control_status,
        'issue_status', v_today.issue_status,
        'optional_note', v_today.optional_note
      ) end
    ));
  end loop;

  v_goal := v_program.goal_snapshot->>'goal';
  select * into v_nt from public.nutrition_targets nt where nt.program_id = v_program.program_id limit 1;

  select count(*), (max(pe.entry_date) - min(pe.entry_date))::integer
    into v_weight_count, v_span_days
  from public.progress_entries pe
  where pe.user_id = p_user_id
    and pe.body_weight_kg is not null
    and pe.entry_date >= v_today_date - 28;

  if v_weight_count >= 4 and v_span_days >= 14 then
    with bounds as (
      select min(pe.entry_date) as d0, max(pe.entry_date) as d1
      from public.progress_entries pe
      where pe.user_id = p_user_id
        and pe.body_weight_kg is not null
        and pe.entry_date >= v_today_date - 28
    ), first_window as (
      select avg(pe.body_weight_kg) as avg_w, count(*) as n
      from public.progress_entries pe, bounds b
      where pe.user_id = p_user_id and pe.body_weight_kg is not null
        and pe.entry_date between b.d0 and b.d0 + 6
    ), last_window as (
      select avg(pe.body_weight_kg) as avg_w, count(*) as n
      from public.progress_entries pe, bounds b
      where pe.user_id = p_user_id and pe.body_weight_kg is not null
        and pe.entry_date between b.d1 - 6 and b.d1
    )
    select f.avg_w, l.avg_w, f.n::integer, l.n::integer
      into v_first_avg, v_last_avg, v_first_count, v_last_count
    from first_window f cross join last_window l;

    if v_first_count >= 2 and v_last_count >= 2 and v_first_avg > 0 then
      v_weekly_pct := ((v_last_avg - v_first_avg) / v_first_avg) * (7.0 / greatest(v_span_days,1)) * 100.0;
      v_nutrition_code := 'KEEP';
      if v_goal = 'FAT_LOSS' then
        if v_weekly_pct > -0.20 then
          v_nutrition_code := 'CHECK_INTAKE_DOWN';
          v_nutrition_delta := -100;
        elsif v_weekly_pct < -1.00 then
          v_nutrition_code := 'CHECK_INTAKE_UP';
          v_nutrition_delta := 100;
        end if;
      elsif v_goal = 'MUSCLE_GAIN' then
        if v_weekly_pct <= 0.00 then
          v_nutrition_code := 'CHECK_INTAKE_UP';
          v_nutrition_delta := 100;
        elsif v_weekly_pct > 0.50 then
          v_nutrition_code := 'CHECK_INTAKE_DOWN';
          v_nutrition_delta := -100;
        end if;
      else
        v_nutrition_code := 'KEEP_MONITORING';
        v_nutrition_delta := 0;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'has_active_program', true,
    'program_id', v_program.program_id,
    'program_version', v_program.program_version,
    'program_tier', v_program.program_tier,
    'global_code', v_global_code,
    'items', v_items,
    'nutrition', jsonb_build_object(
      'code', v_nutrition_code,
      'suggested_delta_kcal', v_nutrition_delta,
      'weight_entries', v_weight_count,
      'span_days', v_span_days,
      'weekly_weight_change_pct', case when v_weekly_pct is null then null else round(v_weekly_pct,2) end,
      'calorie_low', v_nt.calorie_low,
      'calorie_high', v_nt.calorie_high,
      'protein_low_g', v_nt.protein_low_g,
      'protein_high_g', v_nt.protein_high_g
    )
  );
end;
$$;

revoke all on function private.build_free_training_guidance(uuid) from public, anon, authenticated;

create or replace function public.get_my_free_training_guidance()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  return private.build_free_training_guidance(v_uid);
end;
$$;

revoke execute on function public.get_my_free_training_guidance() from public, anon;
grant execute on function public.get_my_free_training_guidance() to authenticated;

comment on table private.workout_exercise_logs is 'Free-foundation working-set log. Stores objective set data plus optional control and issue signals without mutating Program versions.';
comment on function public.get_my_free_training_guidance() is 'Returns next-session guidance from working-set logs, control quality, recovery pattern, and body-weight trend. Guidance only; it does not rewrite the active Program.';

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
  v_training text[] := array[]::text[];
  v_latest_issue boolean := false;
  v_latest_training_adherence text := null;
  v_latest_nutrition_adherence text := null;
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

  select coalesce(array_agg(x.training_status order by x.entry_date desc), array[]::text[])
    into v_training
  from (
    select pe.entry_date, pe.training_status
    from public.progress_entries pe
    where pe.user_id = p_user_id and pe.training_status is not null
    order by pe.entry_date desc
    limit 2
  ) x;

  select
    coalesce(pe.new_issue,false),
    coalesce(pe.training_adherence_status, pe.adherence_status),
    pe.nutrition_adherence_status
    into v_latest_issue, v_latest_training_adherence, v_latest_nutrition_adherence
  from public.progress_entries pe
  where pe.user_id = p_user_id
  order by pe.entry_date desc
  limit 1;

  if coalesce(array_length(v_recovery,1),0) >= 2 and v_recovery[1] = 'POOR' and v_recovery[2] = 'POOR' then
    v_global_code := 'REVIEW_RECOVERY';
  elsif v_latest_issue then
    v_global_code := 'REVIEW_ISSUE';
  elsif v_latest_training_adherence = 'LOW' then
    v_global_code := 'REVIEW_ADHERENCE';
  elsif coalesce(array_length(v_training,1),0) >= 2 and v_training[1] = 'WORSE' and v_training[2] = 'WORSE' then
    v_global_code := 'REVIEW_SESSION';
  elsif coalesce(array_length(v_recovery,1),0) >= 1 and v_recovery[1] = 'POOR' then
    v_global_code := 'HOLD_RECOVERY';
  elsif coalesce(array_length(v_training,1),0) >= 1 and v_training[1] = 'WORSE' then
    v_global_code := 'HOLD_SESSION';
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
    elsif v_global_code in ('REVIEW_RECOVERY','REVIEW_ISSUE','REVIEW_ADHERENCE','REVIEW_SESSION') then
      v_action := 'REVIEW_PROGRAM';
    elsif v_global_code = 'HOLD_RECOVERY' then
      v_action := 'HOLD_RECOVERY';
    elsif v_global_code = 'HOLD_SESSION' then
      v_action := 'HOLD_SESSION';
    elsif v_latest.control_status = 'POOR' then
      v_action := 'HOLD_CONTROL';
    elsif v_set_count < v_item.sets then
      v_action := 'COMPLETE_TARGET';
    elsif v_min_reps < v_item.rep_min and coalesce(v_last_rir, 2) <= 1 then
      v_action := 'REDUCE_LOAD';
    elsif v_min_reps >= v_item.rep_max then
      if v_latest.control_status = 'GOOD' then
        if v_last_rir is null then
          v_action := 'CONFIRM_EFFORT';
        elsif v_last_rir >= greatest(1::numeric, v_item.target_rir - 1) then
          v_action := 'PROGRESS_LOAD';
        else
          v_action := 'HOLD_EFFORT';
        end if;
      elsif v_latest.control_status in ('OK','POOR') then
        v_action := 'HOLD_CONTROL';
      else
        v_action := 'CONFIRM_EFFORT';
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
          if v_latest_nutrition_adherence = 'HIGH' then
            v_nutrition_code := 'CHECK_INTAKE_DOWN';
            v_nutrition_delta := -100;
          else
            v_nutrition_code := 'CHECK_ADHERENCE_FIRST';
            v_nutrition_delta := 0;
          end if;
        elsif v_weekly_pct < -1.00 then
          if v_latest_nutrition_adherence = 'HIGH' then
            v_nutrition_code := 'CHECK_INTAKE_UP';
            v_nutrition_delta := 100;
          else
            v_nutrition_code := 'CHECK_ADHERENCE_FIRST';
            v_nutrition_delta := 0;
          end if;
        end if;
      elsif v_goal = 'MUSCLE_GAIN' then
        if v_weekly_pct <= 0.00 then
          if v_latest_nutrition_adherence = 'HIGH' then
            v_nutrition_code := 'CHECK_INTAKE_UP';
            v_nutrition_delta := 100;
          else
            v_nutrition_code := 'CHECK_ADHERENCE_FIRST';
            v_nutrition_delta := 0;
          end if;
        elsif v_weekly_pct > 0.50 then
          if v_latest_nutrition_adherence = 'HIGH' then
            v_nutrition_code := 'CHECK_INTAKE_DOWN';
            v_nutrition_delta := -100;
          else
            v_nutrition_code := 'CHECK_ADHERENCE_FIRST';
            v_nutrition_delta := 0;
          end if;
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
      'nutrition_adherence_status', v_latest_nutrition_adherence,
      'calorie_low', v_nt.calorie_low,
      'calorie_high', v_nt.calorie_high,
      'protein_low_g', v_nt.protein_low_g,
      'protein_high_g', v_nt.protein_high_g
    )
  );
end;
$$;

comment on function private.build_free_training_guidance(uuid) is
  'Free next-session guidance v2. Uses split training/nutrition adherence, keeps HOLD_SESSION distinct from recovery, and requires effort/control evidence before load progression. Guidance only; does not rewrite the active Program.';

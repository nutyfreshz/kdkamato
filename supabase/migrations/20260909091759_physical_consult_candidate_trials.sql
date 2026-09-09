create table if not exists private.physical_consult_exercise_trials (
  trial_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid not null references private.exercise_candidates(candidate_id) on delete cascade,
  exercise_key text not null,
  observed_on date not null,
  performance_status text check (performance_status in ('BETTER','SAME','WORSE')),
  tolerance_status text check (tolerance_status in ('GOOD','OK','POOR')),
  recovery_status text check (recovery_status in ('GOOD','OK','POOR')),
  preference_status text check (preference_status in ('LIKE','NEUTRAL','DISLIKE')),
  optional_note text check (length(coalesce(optional_note,'')) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,candidate_id,observed_on)
);

create index if not exists physical_consult_trial_user_exercise_date_idx
  on private.physical_consult_exercise_trials(user_id,exercise_key,observed_on desc);

revoke all on private.physical_consult_exercise_trials from public, anon, authenticated;

create or replace function private.refresh_exercise_memory(p_user_id uuid, p_exercise_key text)
returns text
language plpgsql
set search_path=''
as $function$
declare
  v_candidate_id uuid;
  v_response_count integer;
  v_positive_count integer;
  v_poor_tolerance_count integer;
  v_dislike_count integer;
  v_physical_trial_count integer;
  v_latest_at timestamptz;
  v_status text;
begin
  select ec.candidate_id into v_candidate_id
  from private.exercise_candidates ec
  where ec.user_id=p_user_id and ec.exercise_key=p_exercise_key
  order by ec.created_at desc limit 1;

  with observations as (
    select er.performance_status,er.tolerance_status,er.recovery_status,er.preference_status,er.updated_at,'PROGRAM'::text as source_kind
    from public.exercise_response_entries er
    where er.user_id=p_user_id and er.exercise_key=p_exercise_key
    union all
    select pt.performance_status,pt.tolerance_status,pt.recovery_status,pt.preference_status,pt.updated_at,'PHYSICAL_CONSULT'::text as source_kind
    from private.physical_consult_exercise_trials pt
    where pt.user_id=p_user_id and pt.exercise_key=p_exercise_key
  ), recent as (
    select * from observations order by updated_at desc limit 6
  )
  select
    count(*),
    count(*) filter (
      where (performance_status is not null or tolerance_status is not null or recovery_status is not null)
        and coalesce(tolerance_status,'OK') in ('GOOD','OK')
        and coalesce(performance_status,'SAME') in ('BETTER','SAME')
        and coalesce(recovery_status,'OK') in ('GOOD','OK')
    ),
    count(*) filter (where tolerance_status='POOR'),
    count(*) filter (where preference_status='DISLIKE'),
    count(*) filter (where source_kind='PHYSICAL_CONSULT'),
    max(updated_at)
  into v_response_count,v_positive_count,v_poor_tolerance_count,v_dislike_count,v_physical_trial_count,v_latest_at
  from recent;

  if v_response_count>=2 and (v_poor_tolerance_count>=2 or v_dislike_count>=2) then
    v_status:='DEPRIORITIZED';
  elsif v_response_count>=2 and v_positive_count>=2 and v_poor_tolerance_count=0 then
    v_status:='CONFIRMED_GOOD_FIT';
  elsif v_candidate_id is not null or v_response_count>0 then
    v_status:='TRY';
  else
    v_status:='UNTESTED';
  end if;

  insert into private.exercise_memory(user_id,exercise_key,memory_status,evidence_summary,source_candidate_id,last_observed_at,updated_at)
  values(
    p_user_id,p_exercise_key,v_status,
    jsonb_build_object(
      'response_window',least(v_response_count,6),
      'positive_response_count',v_positive_count,
      'poor_tolerance_count',v_poor_tolerance_count,
      'dislike_count',v_dislike_count,
      'physical_consult_trial_count',v_physical_trial_count,
      'authority','ACTUAL_RESPONSE_OVER_LAB_CANDIDATE'
    ),
    v_candidate_id,v_latest_at,now()
  )
  on conflict(user_id,exercise_key) do update set
    memory_status=excluded.memory_status,
    evidence_summary=excluded.evidence_summary,
    source_candidate_id=coalesce(excluded.source_candidate_id,private.exercise_memory.source_candidate_id),
    last_observed_at=excluded.last_observed_at,
    updated_at=now();

  return v_status;
end;
$function$;

create or replace function public.save_my_physical_consult_trial(
  p_exercise_key text,
  p_performance_status text default null,
  p_tolerance_status text default null,
  p_recovery_status text default null,
  p_preference_status text default null,
  p_optional_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_user_id uuid;
  v_key text;
  v_candidate_id uuid;
  v_trial_id uuid;
  v_date date;
begin
  v_user_id:=auth.uid();
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;

  perform 1 from public.user_access ua where ua.user_id=v_user_id and ua.tier='PRO';
  if not found then raise exception 'ACTIVE_PRO_REQUIRED'; end if;

  v_key:=upper(btrim(coalesce(p_exercise_key,'')));
  if v_key='' then raise exception 'EXERCISE_KEY_REQUIRED'; end if;

  if exists(
    select 1
    from public.programs p
    join public.training_program_items ti on ti.program_id=p.program_id
    where p.user_id=v_user_id and p.status='ACTIVE' and ti.exercise_key=v_key
  ) then
    raise exception 'ACTIVE_PROGRAM_EXERCISE_USE_PROGRAM_FEEDBACK';
  end if;

  with latest_results as (
    select distinct on (evidence_family) result_id
    from (
      select lr.result_id,lr.measured_at,
        case
          when lr.result_payload->'output'->>'result_code' like 'C1_SQUAT_%' then 'FEMUR_TIBIA'
          when lr.result_payload->'output'->>'result_code' like 'C1_BENCH_%' then 'ARM_SPAN_HEIGHT'
          when lr.result_payload->'output'->>'result_code'='C1_DEADLIFT_CONSERVATIVE_GEOMETRY' then 'DEADLIFT_GEOMETRY'
        end as evidence_family
      from public.lab_results lr
      where lr.user_id=v_user_id
        and lr.result_status='VALID'
        and lr.tool_key='exercise-fit'
        and (lr.result_payload->'output'->>'result_code') in (
          'C1_SQUAT_FEMUR_RELATIVE_LONGER','C1_SQUAT_FEMUR_RELATIVE_SHORTER',
          'C1_BENCH_REACH_NEGATIVE','C1_BENCH_REACH_NONNEGATIVE',
          'C1_DEADLIFT_CONSERVATIVE_GEOMETRY'
        )
    ) x
    where evidence_family is not null
    order by evidence_family,measured_at desc,result_id desc
  )
  select ec.candidate_id into v_candidate_id
  from private.exercise_candidates ec
  join latest_results lr on lr.result_id=ec.source_result_id
  where ec.user_id=v_user_id
    and ec.exercise_key=v_key
    and ec.ruleset_version='EXERCISE_CANDIDATE_RULESET_V2'
  order by ec.priority_order asc,ec.created_at desc
  limit 1;

  if v_candidate_id is null then raise exception 'CURRENT_LAB_CANDIDATE_REQUIRED'; end if;

  if p_performance_status is not null and p_performance_status not in ('BETTER','SAME','WORSE') then raise exception 'INVALID_PERFORMANCE_STATUS'; end if;
  if p_tolerance_status is not null and p_tolerance_status not in ('GOOD','OK','POOR') then raise exception 'INVALID_TOLERANCE_STATUS'; end if;
  if p_recovery_status is not null and p_recovery_status not in ('GOOD','OK','POOR') then raise exception 'INVALID_RECOVERY_STATUS'; end if;
  if p_preference_status is not null and p_preference_status not in ('LIKE','NEUTRAL','DISLIKE') then raise exception 'INVALID_PREFERENCE_STATUS'; end if;
  if p_performance_status is null and p_tolerance_status is null and p_recovery_status is null and p_preference_status is null and nullif(btrim(coalesce(p_optional_note,'')),'') is null then
    raise exception 'EXERCISE_RESPONSE_SIGNAL_REQUIRED';
  end if;
  if length(coalesce(p_optional_note,''))>500 then raise exception 'EXERCISE_RESPONSE_NOTE_TOO_LONG'; end if;

  v_date:=timezone('Asia/Bangkok',now())::date;

  insert into private.physical_consult_exercise_trials(
    user_id,candidate_id,exercise_key,observed_on,performance_status,tolerance_status,recovery_status,preference_status,optional_note
  ) values(
    v_user_id,v_candidate_id,v_key,v_date,p_performance_status,p_tolerance_status,p_recovery_status,p_preference_status,nullif(btrim(coalesce(p_optional_note,'')),'')
  )
  on conflict(user_id,candidate_id,observed_on) do update set
    performance_status=excluded.performance_status,
    tolerance_status=excluded.tolerance_status,
    recovery_status=excluded.recovery_status,
    preference_status=excluded.preference_status,
    optional_note=excluded.optional_note,
    updated_at=now()
  returning trial_id into v_trial_id;

  perform private.refresh_exercise_memory(v_user_id,v_key);
  return v_trial_id;
end;
$function$;

revoke all on function public.save_my_physical_consult_trial(text,text,text,text,text,text) from public, anon;
grant execute on function public.save_my_physical_consult_trial(text,text,text,text,text,text) to authenticated;

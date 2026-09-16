create or replace function private.apply_c1_targeted_program_refresh(p_result_id uuid)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_tool text;
  v_result_code text;
  v_pct numeric;
  v_slot text := 'QUAD_COMPOUND';
  v_old_program_id uuid;
  v_program_tier text;
  v_slot_count integer;
  v_desired text[];
  v_missing text[];
begin
  select lr.user_id, lr.tool_key, lr.result_payload->'output'->>'result_code'
    into v_user_id, v_tool, v_result_code
  from public.lab_results lr
  where lr.result_id = p_result_id and lr.result_status = 'VALID';

  if v_user_id is null then raise exception 'VALID_LAB_RESULT_NOT_FOUND'; end if;
  if v_tool <> 'exercise-fit' then
    return jsonb_build_object('status','NO_ACTION','reason','TOOL_NOT_ELIGIBLE','authority','EVIDENCE_ONLY');
  end if;
  if v_result_code not in ('C1_SQUAT_FEMUR_RELATIVE_LONGER','C1_SQUAT_FEMUR_RELATIVE_SHORTER') then
    return jsonb_build_object('status','NO_ACTION','reason','C1_RESULT_NOT_AUTO_REFRESH_ELIGIBLE','authority','EVIDENCE_ONLY');
  end if;

  select case when coalesce(s.signal_value->>'percent_difference','') ~ '^-?[0-9]+([.][0-9]+)?$'
    then (s.signal_value->>'percent_difference')::numeric else null end
  into v_pct
  from private.lab_signals s
  where s.source_result_id=p_result_id and s.signal_key='FEMUR_TIBIA' and s.signal_confidence='DERIVED'
  order by s.created_at desc limit 1;

  if v_pct is null then
    return jsonb_build_object('status','NO_ACTION','reason','DIRECTIONAL_SIGNAL_REQUIRED','authority','EVIDENCE_ONLY');
  end if;
  if v_result_code='C1_SQUAT_FEMUR_RELATIVE_LONGER' and v_pct<5 then
    return jsonb_build_object('status','NO_ACTION','reason','DIRECTIONAL_MARGIN_BELOW_AUTO_THRESHOLD','percent_difference',v_pct,'authority','EVIDENCE_ONLY');
  end if;
  if v_result_code='C1_SQUAT_FEMUR_RELATIVE_SHORTER' and v_pct>-5 then
    return jsonb_build_object('status','NO_ACTION','reason','DIRECTIONAL_MARGIN_BELOW_AUTO_THRESHOLD','percent_difference',v_pct,'authority','EVIDENCE_ONLY');
  end if;

  select p.program_id,p.program_tier
    into v_old_program_id,v_program_tier
  from public.programs p
  where p.user_id=v_user_id and p.status='ACTIVE'
  order by p.program_version desc
  limit 1;

  if v_old_program_id is null then
    return jsonb_build_object('status','NO_ACTION','reason','ACTIVE_PROGRAM_NOT_FOUND','authority','EVIDENCE_ONLY');
  end if;

  select count(*) into v_slot_count
  from public.training_program_items t
  where t.program_id=v_old_program_id and t.movement_slot=v_slot;

  if v_slot_count=0 then
    return jsonb_build_object('status','NO_ACTION','reason','TARGET_MOVEMENT_SLOT_NOT_IN_PROGRAM','movement_slot',v_slot,'authority','EVIDENCE_ONLY');
  end if;
  if v_slot_count>3 then
    return jsonb_build_object('status','NO_ACTION','reason','TARGET_MOVEMENT_SLOT_TOO_WIDE','movement_slot',v_slot,'authority','EVIDENCE_ONLY');
  end if;

  select array_agg(x.exercise_key order by x.priority_order) into v_desired
  from (
    select r.exercise_key,r.priority_order
    from private.exercise_candidate_rules r
    where r.active=true
      and r.ruleset_version='EXERCISE_CANDIDATE_RULESET_V2'
      and r.source_tool_key='exercise-fit'
      and r.result_code=v_result_code
      and private.exercise_slot_for_candidate(r.exercise_key)=v_slot
    order by r.priority_order
    limit v_slot_count
  ) x;

  if coalesce(cardinality(v_desired),0)<>v_slot_count then
    return jsonb_build_object('status','NO_ACTION','reason','RULESET_CANNOT_FILL_TARGET_SLOT','authority','EVIDENCE_ONLY');
  end if;

  if exists(
    select 1 from unnest(v_desired) d(exercise_key)
    join private.exercise_memory m on m.user_id=v_user_id and m.exercise_key=d.exercise_key
    where m.memory_status='DEPRIORITIZED'
  ) then
    return jsonb_build_object('status','NO_ACTION','reason','ACTUAL_RESPONSE_CONFLICT_TARGET_DEPRIORITIZED','authority','EVIDENCE_ONLY');
  end if;

  if exists(
    select 1 from public.training_program_items t
    join private.exercise_memory m on m.user_id=v_user_id and m.exercise_key=t.exercise_key
    where t.program_id=v_old_program_id and t.movement_slot=v_slot
      and m.memory_status='CONFIRMED_GOOD_FIT' and not(t.exercise_key=any(v_desired))
  ) then
    return jsonb_build_object('status','NO_ACTION','reason','ACTUAL_RESPONSE_CONFLICT_CURRENT_CONFIRMED','authority','EVIDENCE_ONLY');
  end if;

  select array_agg(d.exercise_key order by d.ord) into v_missing
  from unnest(v_desired) with ordinality d(exercise_key,ord)
  where not exists(
    select 1 from public.training_program_items t
    where t.program_id=v_old_program_id and t.movement_slot=v_slot and t.exercise_key=d.exercise_key
  );

  if coalesce(cardinality(v_missing),0)=0 then
    return jsonb_build_object(
      'status','NO_ACTION','reason','PROGRAM_ALREADY_ALIGNED','desired_exercises',to_jsonb(v_desired),
      'percent_difference',v_pct,'authority','EVIDENCE_ONLY','program_tier',v_program_tier
    );
  end if;

  return jsonb_build_object(
    'status','NO_ACTION','reason','CENTRAL_DECISION_REQUIRED',
    'desired_exercises',to_jsonb(v_desired),'candidate_changes',to_jsonb(v_missing),
    'movement_slot',v_slot,'result_code',v_result_code,'percent_difference',v_pct,
    'program_tier',v_program_tier,'authority','EVIDENCE_ONLY'
  );
end;
$function$;

create or replace function private.refresh_exercise_memory(p_user_id uuid, p_exercise_key text)
returns text
language plpgsql
set search_path to ''
as $function$
declare
  v_candidate_id uuid;
  v_response_count integer;
  v_positive_count integer;
  v_poor_tolerance_count integer;
  v_dislike_count integer;
  v_physical_trial_count integer;
  v_workout_count integer;
  v_latest_at timestamptz;
  v_status text;
begin
  select ec.candidate_id into v_candidate_id
  from private.exercise_candidates ec
  where ec.user_id=p_user_id and ec.exercise_key=p_exercise_key
  order by ec.created_at desc limit 1;

  with observations as (
    select er.performance_status,er.tolerance_status,er.recovery_status,er.preference_status,er.updated_at,'PROGRAM_FEEDBACK'::text as source_kind
    from public.exercise_response_entries er
    where er.user_id=p_user_id and er.exercise_key=p_exercise_key
    union all
    select pt.performance_status,pt.tolerance_status,pt.recovery_status,pt.preference_status,pt.updated_at,'PHYSICAL_CONSULT'::text as source_kind
    from private.physical_consult_exercise_trials pt
    where pt.user_id=p_user_id and pt.exercise_key=p_exercise_key
    union all
    select null::text,
      case when wl.issue_status in ('DISCOMFORT','PAIN') then 'POOR'::text
           when wl.issue_status='NONE' and wl.control_status in ('GOOD','OK') then 'OK'::text
           else null::text end,
      null::text,null::text,wl.updated_at,'WORKOUT_LOG'::text
    from private.workout_exercise_logs wl
    where wl.user_id=p_user_id and wl.exercise_key=p_exercise_key
  ), recent as (
    select * from observations order by updated_at desc limit 6
  )
  select count(*),
    count(*) filter (
      where (performance_status is not null or tolerance_status is not null or recovery_status is not null)
        and coalesce(tolerance_status,'OK') in ('GOOD','OK')
        and coalesce(performance_status,'SAME') in ('BETTER','SAME')
        and coalesce(recovery_status,'OK') in ('GOOD','OK')
    ),
    count(*) filter (where tolerance_status='POOR'),
    count(*) filter (where preference_status='DISLIKE'),
    count(*) filter (where source_kind='PHYSICAL_CONSULT'),
    count(*) filter (where source_kind='WORKOUT_LOG'),
    max(updated_at)
  into v_response_count,v_positive_count,v_poor_tolerance_count,v_dislike_count,v_physical_trial_count,v_workout_count,v_latest_at
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
  values(p_user_id,p_exercise_key,v_status,
    jsonb_build_object('response_window',least(v_response_count,6),'positive_response_count',v_positive_count,
      'poor_tolerance_count',v_poor_tolerance_count,'dislike_count',v_dislike_count,
      'physical_consult_trial_count',v_physical_trial_count,'workout_log_count',v_workout_count,
      'authority','ACTUAL_RESPONSE_OVER_LAB_CANDIDATE'),
    v_candidate_id,v_latest_at,now())
  on conflict(user_id,exercise_key) do update set
    memory_status=excluded.memory_status,evidence_summary=excluded.evidence_summary,
    source_candidate_id=coalesce(excluded.source_candidate_id,private.exercise_memory.source_candidate_id),
    last_observed_at=excluded.last_observed_at,updated_at=now();

  return v_status;
end;
$function$;

create or replace function private.enrich_consult_snapshot_training_context()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_recent jsonb;
  v_workouts jsonb;
begin
  select coalesce(jsonb_agg(x.payload order by x.entry_date desc),'[]'::jsonb)
  into v_recent
  from (
    select pe.entry_date,
      jsonb_build_object('entry_date',pe.entry_date,'training_completed',pe.training_completed,
        'training_status',pe.training_status,'recovery_status',pe.recovery_status,
        'adherence_status',pe.adherence_status,'new_issue',pe.new_issue) as payload
    from public.progress_entries pe
    where pe.user_id=new.user_id and pe.entry_date between new.period_start and new.period_end
    order by pe.entry_date desc,pe.created_at desc limit 8
  ) x;

  select coalesce(jsonb_agg(x.payload order by x.entry_date desc,x.exercise_key),'[]'::jsonb)
  into v_workouts
  from (
    select wl.entry_date,wl.exercise_key,
      jsonb_build_object('entry_date',wl.entry_date,'exercise_key',wl.exercise_key,
        'set_count',jsonb_array_length(wl.set_entries),'set_entries',wl.set_entries,
        'control_status',wl.control_status,'issue_status',wl.issue_status) as payload
    from private.workout_exercise_logs wl
    where wl.user_id=new.user_id and wl.entry_date between new.period_start and new.period_end
    order by wl.entry_date desc,wl.updated_at desc limit 30
  ) x;

  new.progress_metrics := coalesce(new.progress_metrics,'{}'::jsonb) || jsonb_build_object(
    'recent_signals',v_recent,'recent_workout_evidence',v_workouts,
    'evidence_schema_version','PRO_TRAINING_CONTEXT_V2');
  return new;
end;
$function$;

drop trigger if exists consult_snapshot_enrich_training_context on private.consult_snapshots;
create trigger consult_snapshot_enrich_training_context
before insert on private.consult_snapshots
for each row execute function private.enrich_consult_snapshot_training_context();

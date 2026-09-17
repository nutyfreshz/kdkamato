create or replace function private.validate_exercise_replacement_v1(p_user_id uuid,p_current_exercise text,p_candidate_exercise text)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_program_id uuid;
  v_current_status text;
  v_current_evidence jsonb := '{}'::jsonb;
  v_candidate_status text;
  v_candidate_evidence jsonb := '{}'::jsonb;
  v_poor_tolerance integer := 0;
  v_dislike integer := 0;
  v_candidate_is_program_alt boolean := false;
  v_candidate_already_active boolean := false;
  v_context_fresh boolean := false;
  v_current_count integer := 0;
  v_current_item_id uuid;
  v_route text;
  v_criteria_passed boolean := false;
begin
  select p.program_id into v_program_id
  from public.programs p
  where p.user_id=p_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1;
  if v_program_id is null then
    return jsonb_build_object('route','BLOCKED_NO_ACTIVE_PROGRAM','criteria_passed',false,'program_change_authorized',false);
  end if;

  select count(*),(array_agg(t.item_id order by t.training_day,t.display_order,t.item_id))[1]
  into v_current_count,v_current_item_id
  from public.training_program_items t
  where t.program_id=v_program_id and t.exercise_key=p_current_exercise;

  if v_current_count=0 then
    return jsonb_build_object('route','BLOCKED_CURRENT_NOT_ACTIVE','criteria_passed',false,'program_change_authorized',false);
  end if;
  if v_current_count<>1 then
    return jsonb_build_object(
      'route','BLOCKED_CURRENT_EXERCISE_MULTIPLE_ACTIVE_OCCURRENCES',
      'current_exercise',p_current_exercise,
      'current_active_count',v_current_count,
      'target_item_id',null,
      'criteria_passed',false,
      'program_change_authorized',false
    );
  end if;
  if p_candidate_exercise is null or p_candidate_exercise=p_current_exercise then
    return jsonb_build_object('route','BLOCKED_INVALID_CANDIDATE','target_item_id',v_current_item_id,'criteria_passed',false,'program_change_authorized',false);
  end if;

  select em.memory_status,coalesce(em.evidence_summary,'{}'::jsonb)
  into v_current_status,v_current_evidence
  from private.exercise_memory em
  where em.user_id=p_user_id and em.exercise_key=p_current_exercise;

  select em.memory_status,coalesce(em.evidence_summary,'{}'::jsonb)
  into v_candidate_status,v_candidate_evidence
  from private.exercise_memory em
  where em.user_id=p_user_id and em.exercise_key=p_candidate_exercise;

  v_poor_tolerance := coalesce((v_current_evidence->>'poor_tolerance_count')::integer,0);
  v_dislike := coalesce((v_current_evidence->>'dislike_count')::integer,0);

  select exists(
    select 1
    from public.training_program_items t
    cross join lateral jsonb_array_elements(coalesce(t.metadata->'alternatives','[]'::jsonb)) a
    where t.item_id=v_current_item_id
      and a->>'key'=p_candidate_exercise
  ) into v_candidate_is_program_alt;

  select exists(
    select 1
    from public.training_program_items t
    where t.program_id=v_program_id
      and t.exercise_key=p_candidate_exercise
  ) into v_candidate_already_active;

  select coalesce((p.goal_snapshot->>'goal')=ub.goal,false)
         and coalesce((p.goal_snapshot->>'equipment_profile')=ub.equipment_profile,false)
         and coalesce((p.goal_snapshot->>'training_days_per_week')::integer=ub.training_days_per_week,false)
  into v_context_fresh
  from public.programs p
  join public.user_baseline ub on ub.user_id=p.user_id
  where p.program_id=v_program_id;

  if v_current_status='CONFIRMED_GOOD_FIT' then
    v_route:='BLOCKED_CURRENT_CONFIRMED_GOOD_FIT';
  elsif v_candidate_status='DEPRIORITIZED' then
    v_route:='BLOCKED_CANDIDATE_DEPRIORITIZED';
  elsif v_candidate_already_active then
    v_route:='BLOCKED_CANDIDATE_ALREADY_ACTIVE';
  elsif not v_candidate_is_program_alt then
    v_route:='BLOCKED_CANDIDATE_NOT_PROGRAM_ALTERNATIVE';
  elsif not v_context_fresh then
    v_route:='BLOCKED_PROGRAM_CONTEXT_STALE';
  elsif v_poor_tolerance<2 and v_dislike>=2 then
    v_route:='REVIEW_ONLY_DISLIKE_WITHOUT_TOLERANCE_FAILURE';
  elsif v_poor_tolerance<2 then
    v_route:='BLOCKED_INSUFFICIENT_REAL_RESPONSE';
  elsif coalesce(v_candidate_status,'UNTESTED')='CONFIRMED_GOOD_FIT' then
    v_route:='REPLACEMENT_CRITERIA_PASSED_SHADOW';
    v_criteria_passed:=true;
  else
    v_route:='TRIAL_ELIGIBLE_BEFORE_REPLACEMENT';
  end if;

  return jsonb_build_object(
    'schema_version','EXERCISE_REPLACEMENT_VALIDATOR_V2',
    'route',v_route,
    'target_item_id',v_current_item_id,
    'current_active_count',v_current_count,
    'current_exercise',p_current_exercise,
    'candidate_exercise',p_candidate_exercise,
    'current_memory_status',coalesce(v_current_status,'UNTESTED'),
    'candidate_memory_status',coalesce(v_candidate_status,'UNTESTED'),
    'poor_tolerance_count',v_poor_tolerance,
    'dislike_count',v_dislike,
    'candidate_is_program_alternative',v_candidate_is_program_alt,
    'candidate_already_active',v_candidate_already_active,
    'program_context_fresh',v_context_fresh,
    'criteria_passed',v_criteria_passed,
    'program_change_authorized',false
  );
end;
$function$;

create or replace function private.validate_nutrition_adjustment_v1(p_snapshot_id uuid,p_delta_kcal integer)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_goal text;
  v_target jsonb;
  v_maintenance_low numeric;
  v_maintenance_high numeric;
  v_calorie_low numeric;
  v_calorie_high numeric;
  v_confidence text;
  v_foundation_low numeric;
  v_foundation_high numeric;
  v_envelope_low numeric;
  v_envelope_high numeric;
  v_proposed_low numeric;
  v_proposed_high numeric;
  v_route text;
  v_pass boolean := false;
begin
  select cs.program_snapshot->'active_program'->'goal_snapshot'->>'goal',
         cs.program_snapshot->'nutrition_target'
  into v_goal,v_target
  from private.consult_snapshots cs
  where cs.snapshot_id=p_snapshot_id;

  if v_target is null then
    return jsonb_build_object('route','BLOCKED_NUTRITION_TARGET_MISSING','criteria_passed',false,'program_change_authorized',false);
  end if;
  if p_delta_kcal not in (-100,100) then
    return jsonb_build_object('route','BLOCKED_DELTA_OUTSIDE_BOUND','delta_kcal_per_day',p_delta_kcal,'criteria_passed',false,'program_change_authorized',false);
  end if;

  begin
    v_maintenance_low := nullif(v_target->>'maintenance_low','')::numeric;
    v_maintenance_high := nullif(v_target->>'maintenance_high','')::numeric;
    v_calorie_low := nullif(v_target->>'calorie_low','')::numeric;
    v_calorie_high := nullif(v_target->>'calorie_high','')::numeric;
  exception when others then
    return jsonb_build_object('route','BLOCKED_INVALID_NUTRITION_TARGET','criteria_passed',false,'program_change_authorized',false);
  end;
  v_confidence := coalesce(v_target->>'estimate_confidence','LIMITED');

  if v_maintenance_low is null or v_maintenance_high is null or v_calorie_low is null or v_calorie_high is null
     or v_maintenance_low<=0 or v_maintenance_high<v_maintenance_low or v_calorie_low<=0 or v_calorie_high<v_calorie_low then
    return jsonb_build_object('route','BLOCKED_INVALID_NUTRITION_TARGET','criteria_passed',false,'program_change_authorized',false);
  end if;
  if v_confidence='LIMITED' then
    return jsonb_build_object('route','BLOCKED_LIMITED_ENERGY_ESTIMATE','criteria_passed',false,'program_change_authorized',false);
  end if;

  if v_goal='FAT_LOSS' then
    v_foundation_low := round((v_maintenance_low*0.85)/50.0)*50;
    v_foundation_high := round((v_maintenance_high*0.90)/50.0)*50;
  elsif v_goal='MUSCLE_GAIN' then
    v_foundation_low := round((v_maintenance_low*1.02)/50.0)*50;
    v_foundation_high := round((v_maintenance_high*1.08)/50.0)*50;
  elsif v_goal='RECOMPOSITION' then
    v_foundation_low := round((v_maintenance_low*0.95)/50.0)*50;
    v_foundation_high := round((v_maintenance_high*1.02)/50.0)*50;
  elsif v_goal='GENERAL_FITNESS' then
    v_foundation_low := round(v_maintenance_low/50.0)*50;
    v_foundation_high := round(v_maintenance_high/50.0)*50;
  else
    return jsonb_build_object('route','BLOCKED_UNSUPPORTED_GOAL','goal',v_goal,'criteria_passed',false,'program_change_authorized',false);
  end if;

  v_envelope_low := greatest(1,v_foundation_low-100);
  v_envelope_high := v_foundation_high+100;
  v_proposed_low := v_calorie_low+p_delta_kcal;
  v_proposed_high := v_calorie_high+p_delta_kcal;

  if v_calorie_low<v_envelope_low or v_calorie_high>v_envelope_high then
    v_route := 'BLOCKED_CURRENT_TARGET_OUTSIDE_AUTO_ENVELOPE';
  elsif v_proposed_low<v_envelope_low or v_proposed_high>v_envelope_high then
    v_route := 'REVIEW_REQUIRED_AUTO_ENVELOPE_EXHAUSTED';
  else
    v_route := 'NUTRITION_ADJUSTMENT_CRITERIA_PASSED_SHADOW';
    v_pass := true;
  end if;

  return jsonb_build_object(
    'schema_version','NUTRITION_ADJUSTMENT_VALIDATOR_V1',
    'route',v_route,
    'goal',v_goal,
    'estimate_confidence',v_confidence,
    'delta_kcal_per_day',p_delta_kcal,
    'foundation_band',jsonb_build_object('calorie_low',v_foundation_low,'calorie_high',v_foundation_high),
    'auto_envelope',jsonb_build_object('calorie_low',v_envelope_low,'calorie_high',v_envelope_high,'rule','FREE_FOUNDATION_BAND_PLUS_ONE_100_KCAL_STEP'),
    'current_target',jsonb_build_object('calorie_low',v_calorie_low,'calorie_high',v_calorie_high),
    'proposed_target',jsonb_build_object('calorie_low',v_proposed_low,'calorie_high',v_proposed_high),
    'criteria_passed',v_pass,
    'program_change_authorized',false
  );
end;
$function$;

create or replace function private.select_volume_target_item_v1(p_snapshot_id uuid,p_muscle text)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_snapshot_program_id uuid;
  v_current_program_id uuid;
  v_period_start date;
  v_period_end date;
  v_item_id uuid;
  v_exercise_key text;
  v_sets integer;
  v_sessions integer;
  v_avg_rir numeric;
  v_control_ratio numeric;
  v_issue_logs integer;
  v_latest_proxy numeric;
  v_previous_proxy numeric;
  v_target_items integer;
  v_under_cap_items integer;
  v_confirmed_under_cap integer;
  v_route text;
begin
  select cs.user_id,
         nullif(cs.program_snapshot->'active_program'->>'program_id','')::uuid,
         cs.period_start,cs.period_end
  into v_user_id,v_snapshot_program_id,v_period_start,v_period_end
  from private.consult_snapshots cs
  where cs.snapshot_id=p_snapshot_id;

  if v_user_id is null or v_snapshot_program_id is null then
    return jsonb_build_object('route','BLOCKED_SNAPSHOT_PROGRAM_MISSING','criteria_passed',false,'program_change_authorized',false);
  end if;

  select p.program_id into v_current_program_id
  from public.programs p
  where p.user_id=v_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1;
  if v_current_program_id is distinct from v_snapshot_program_id then
    return jsonb_build_object('route','BLOCKED_SNAPSHOT_PROGRAM_STALE','criteria_passed',false,'program_change_authorized',false);
  end if;

  select count(*),count(*) filter(where t.sets<4),count(*) filter(where t.sets<4 and em.memory_status='CONFIRMED_GOOD_FIT')
  into v_target_items,v_under_cap_items,v_confirmed_under_cap
  from public.training_program_items t
  left join private.exercise_memory em on em.user_id=v_user_id and em.exercise_key=t.exercise_key
  where t.program_id=v_snapshot_program_id
    and upper(coalesce(t.metadata->>'primary_muscle',''))=upper(p_muscle);

  if v_target_items=0 then
    return jsonb_build_object('route','BLOCKED_MUSCLE_NOT_IN_PROGRAM','muscle',upper(p_muscle),'criteria_passed',false,'program_change_authorized',false);
  end if;
  if v_under_cap_items=0 then
    return jsonb_build_object('route','REVIEW_REQUIRED_PER_EXERCISE_SET_CAP','muscle',upper(p_muscle),'set_cap',4,'criteria_passed',false,'program_change_authorized',false);
  end if;
  if v_confirmed_under_cap=0 then
    return jsonb_build_object('route','BLOCKED_NO_CONFIRMED_GOOD_FIT_ITEM_UNDER_SET_CAP','muscle',upper(p_muscle),'set_cap',4,'criteria_passed',false,'program_change_authorized',false);
  end if;

  with item_base as (
    select t.item_id,t.exercise_key,t.sets,t.training_day,t.display_order
    from public.training_program_items t
    join private.exercise_memory em on em.user_id=v_user_id and em.exercise_key=t.exercise_key and em.memory_status='CONFIRMED_GOOD_FIT'
    where t.program_id=v_snapshot_program_id
      and upper(coalesce(t.metadata->>'primary_muscle',''))=upper(p_muscle)
      and t.sets<4
  ),
  log_stats as (
    select wl.item_id,count(distinct wl.entry_date)::integer as sessions,
      count(*)::integer as logs,
      count(*) filter(where wl.control_status in ('GOOD','OK'))::integer as good_control_logs,
      count(*) filter(where wl.issue_status in ('DISCOMFORT','PAIN'))::integer as issue_logs
    from private.workout_exercise_logs wl
    join item_base ib on ib.item_id=wl.item_id
    where wl.user_id=v_user_id and wl.entry_date between v_period_start and v_period_end
    group by wl.item_id
  ),
  set_rows as (
    select wl.item_id,wl.entry_date,
      nullif(s->>'reps','')::numeric as reps,
      nullif(s->>'load_kg','')::numeric as load_kg,
      nullif(s->>'rir','')::numeric as rir
    from private.workout_exercise_logs wl
    join item_base ib on ib.item_id=wl.item_id
    cross join lateral jsonb_array_elements(wl.set_entries) s
    where wl.user_id=v_user_id and wl.entry_date between v_period_start and v_period_end
  ),
  rir_stats as (
    select item_id,avg(rir) as avg_rir,count(rir)::integer as rir_sets
    from set_rows group by item_id
  ),
  session_perf as (
    select item_id,entry_date,
      max(case when load_kg is not null and load_kg>0 and reps is not null then load_kg*(1+((reps+coalesce(rir,0))/30.0)) end) as capacity_proxy
    from set_rows group by item_id,entry_date
  ),
  ranked as (
    select sp.*,row_number() over(partition by item_id order by entry_date desc) as rn
    from session_perf sp where capacity_proxy is not null
  ),
  perf as (
    select item_id,
      max(capacity_proxy) filter(where rn=1) as latest_proxy,
      max(capacity_proxy) filter(where rn=2) as previous_proxy
    from ranked where rn<=2 group by item_id
  ),
  eligible as (
    select ib.*,ls.sessions,rs.avg_rir,
      case when ls.logs>0 then ls.good_control_logs::numeric/ls.logs else null end as control_ratio,
      ls.issue_logs,p.latest_proxy,p.previous_proxy
    from item_base ib
    join log_stats ls on ls.item_id=ib.item_id
    join rir_stats rs on rs.item_id=ib.item_id
    join perf p on p.item_id=ib.item_id
    where ls.sessions>=2
      and rs.avg_rir between 1 and 3
      and ls.issue_logs=0
      and ls.good_control_logs::numeric/ls.logs>=0.80
      and p.latest_proxy is not null and p.previous_proxy is not null
      and p.previous_proxy>0
      and p.latest_proxy/p.previous_proxy between 0.98 and 1.02
    order by ib.sets asc,ls.sessions desc,ib.training_day asc,ib.display_order asc,ib.item_id asc
    limit 1
  )
  select item_id,exercise_key,sets,sessions,round(avg_rir,2),round(control_ratio,2),issue_logs,latest_proxy,previous_proxy
  into v_item_id,v_exercise_key,v_sets,v_sessions,v_avg_rir,v_control_ratio,v_issue_logs,v_latest_proxy,v_previous_proxy
  from eligible;

  if v_item_id is null then
    v_route := 'BLOCKED_TARGET_ITEM_EVIDENCE_INSUFFICIENT';
    return jsonb_build_object('schema_version','VOLUME_TARGET_ITEM_V1','route',v_route,'muscle',upper(p_muscle),'criteria_passed',false,'program_change_authorized',false);
  end if;

  return jsonb_build_object(
    'schema_version','VOLUME_TARGET_ITEM_V1',
    'route','VOLUME_TARGET_ITEM_CRITERIA_PASSED_SHADOW',
    'muscle',upper(p_muscle),
    'target_item_id',v_item_id,
    'exercise_key',v_exercise_key,
    'current_sets',v_sets,
    'proposed_sets',v_sets+1,
    'set_cap',4,
    'evidence',jsonb_build_object('sessions',v_sessions,'avg_rir',v_avg_rir,'control_good_ok_ratio',v_control_ratio,'issue_logs',v_issue_logs,'latest_capacity_proxy',v_latest_proxy,'previous_capacity_proxy',v_previous_proxy),
    'criteria_passed',true,
    'program_change_authorized',false
  );
end;
$function$;
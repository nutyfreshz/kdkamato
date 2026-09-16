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
  v_route text;
  v_criteria_passed boolean := false;
begin
  select p.program_id into v_program_id
  from public.programs p
  where p.user_id=p_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1;
  if v_program_id is null then return jsonb_build_object('route','BLOCKED_NO_ACTIVE_PROGRAM','criteria_passed',false,'program_change_authorized',false); end if;

  select count(*) into v_current_count
  from public.training_program_items t
  where t.program_id=v_program_id and t.exercise_key=p_current_exercise;
  if v_current_count=0 then return jsonb_build_object('route','BLOCKED_CURRENT_NOT_ACTIVE','criteria_passed',false,'program_change_authorized',false); end if;
  if p_candidate_exercise is null or p_candidate_exercise=p_current_exercise then return jsonb_build_object('route','BLOCKED_INVALID_CANDIDATE','criteria_passed',false,'program_change_authorized',false); end if;

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
    where t.program_id=v_program_id
      and t.exercise_key=p_current_exercise
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
    'schema_version','EXERCISE_REPLACEMENT_VALIDATOR_V1',
    'route',v_route,
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
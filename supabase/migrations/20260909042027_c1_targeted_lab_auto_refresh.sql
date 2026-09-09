-- C1 high-confidence targeted LAB auto-refresh.
-- Policy: only direction-sensitive Squat Exercise Fit can auto-refresh an Active Program.
-- A >=5% directional Femur:Tibia margin is an automation confidence threshold, not a biological cutoff.
-- Actual response / Exercise Memory remains higher authority than LAB prediction.

create or replace function private.apply_c1_targeted_program_refresh(p_result_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $fn$
declare
  v_user_id uuid;
  v_tool text;
  v_result_code text;
  v_pct numeric;
  v_slot text := 'QUAD_COMPOUND';
  v_active_count integer;
  v_old_program_id uuid;
  v_old_version integer;
  v_program_tier text;
  v_goal_snapshot jsonb;
  v_slot_count integer;
  v_distinct_count integer;
  v_desired text[];
  v_missing text[];
  v_replace_ids uuid[];
  v_replace_count integer;
  v_replacement_map jsonb := '{}'::jsonb;
  v_previous_changes jsonb := '[]'::jsonb;
  v_new_changes jsonb := '[]'::jsonb;
  v_new_program_id uuid;
  v_new_version integer;
  v_decision_id uuid;
  v_applied_at timestamptz := now();
  v_old_key text;
  v_new_key text;
  v_i integer;
begin
  select lr.user_id, lr.tool_key, lr.result_payload->'output'->>'result_code'
    into v_user_id, v_tool, v_result_code
  from public.lab_results lr
  where lr.result_id = p_result_id and lr.result_status = 'VALID';
  if v_user_id is null then raise exception 'VALID_LAB_RESULT_NOT_FOUND'; end if;
  if v_tool <> 'exercise-fit' then return jsonb_build_object('status','NO_ACTION','reason','TOOL_NOT_ELIGIBLE'); end if;
  if v_result_code not in ('C1_SQUAT_FEMUR_RELATIVE_LONGER','C1_SQUAT_FEMUR_RELATIVE_SHORTER') then
    return jsonb_build_object('status','NO_ACTION','reason','C1_RESULT_NOT_AUTO_REFRESH_ELIGIBLE');
  end if;

  select case when coalesce(s.signal_value->>'percent_difference','') ~ '^-?[0-9]+([.][0-9]+)?$'
    then (s.signal_value->>'percent_difference')::numeric else null end
  into v_pct
  from private.lab_signals s
  where s.source_result_id=p_result_id and s.signal_key='FEMUR_TIBIA' and s.signal_confidence='DERIVED'
  order by s.created_at desc limit 1;
  if v_pct is null then return jsonb_build_object('status','NO_ACTION','reason','DIRECTIONAL_SIGNAL_REQUIRED'); end if;
  if v_result_code='C1_SQUAT_FEMUR_RELATIVE_LONGER' and v_pct<5 then
    return jsonb_build_object('status','NO_ACTION','reason','DIRECTIONAL_MARGIN_BELOW_AUTO_THRESHOLD','percent_difference',v_pct);
  end if;
  if v_result_code='C1_SQUAT_FEMUR_RELATIVE_SHORTER' and v_pct>-5 then
    return jsonb_build_object('status','NO_ACTION','reason','DIRECTIONAL_MARGIN_BELOW_AUTO_THRESHOLD','percent_difference',v_pct);
  end if;

  perform 1 from public.user_access ua where ua.user_id=v_user_id and ua.tier in ('FREE','PRO') for update;
  if not found then return jsonb_build_object('status','NO_ACTION','reason','USER_ACCESS_NOT_ELIGIBLE'); end if;

  select count(*) into v_active_count from public.programs p where p.user_id=v_user_id and p.status='ACTIVE';
  if v_active_count=0 then return jsonb_build_object('status','NO_ACTION','reason','ACTIVE_PROGRAM_NOT_FOUND'); end if;
  if v_active_count<>1 then return jsonb_build_object('status','NO_ACTION','reason','ACTIVE_PROGRAM_AMBIGUOUS'); end if;

  select p.program_id,p.program_version,p.program_tier,p.goal_snapshot
  into v_old_program_id,v_old_version,v_program_tier,v_goal_snapshot
  from public.programs p where p.user_id=v_user_id and p.status='ACTIVE' for update;

  select count(*),count(distinct t.exercise_key) into v_slot_count,v_distinct_count
  from public.training_program_items t where t.program_id=v_old_program_id and t.movement_slot=v_slot;
  if v_slot_count=0 then return jsonb_build_object('status','NO_ACTION','reason','TARGET_MOVEMENT_SLOT_NOT_IN_PROGRAM','movement_slot',v_slot); end if;
  if v_slot_count>3 then return jsonb_build_object('status','NO_ACTION','reason','TARGET_MOVEMENT_SLOT_TOO_WIDE','movement_slot',v_slot); end if;
  if v_distinct_count<>v_slot_count then return jsonb_build_object('status','NO_ACTION','reason','DUPLICATE_EXERCISE_IN_TARGET_SLOT'); end if;

  select array_agg(x.exercise_key order by x.priority_order) into v_desired
  from (
    select r.exercise_key,r.priority_order
    from private.exercise_candidate_rules r
    where r.active=true and r.ruleset_version='EXERCISE_CANDIDATE_RULESET_V2'
      and r.source_tool_key='exercise-fit' and r.result_code=v_result_code
      and private.exercise_slot_for_candidate(r.exercise_key)=v_slot
    order by r.priority_order limit v_slot_count
  ) x;
  if coalesce(cardinality(v_desired),0)<>v_slot_count then return jsonb_build_object('status','NO_ACTION','reason','RULESET_CANNOT_FILL_TARGET_SLOT'); end if;

  if exists(select 1 from unnest(v_desired) d(exercise_key)
    join private.exercise_memory m on m.user_id=v_user_id and m.exercise_key=d.exercise_key
    where m.memory_status='DEPRIORITIZED') then
    return jsonb_build_object('status','NO_ACTION','reason','ACTUAL_RESPONSE_CONFLICT_TARGET_DEPRIORITIZED');
  end if;

  if exists(select 1 from public.training_program_items t
    join private.exercise_memory m on m.user_id=v_user_id and m.exercise_key=t.exercise_key
    where t.program_id=v_old_program_id and t.movement_slot=v_slot
      and m.memory_status='CONFIRMED_GOOD_FIT' and not(t.exercise_key=any(v_desired))) then
    return jsonb_build_object('status','NO_ACTION','reason','ACTUAL_RESPONSE_CONFLICT_CURRENT_CONFIRMED');
  end if;

  select array_agg(d.exercise_key order by d.ord) into v_missing
  from unnest(v_desired) with ordinality d(exercise_key,ord)
  where not exists(select 1 from public.training_program_items t
    where t.program_id=v_old_program_id and t.movement_slot=v_slot and t.exercise_key=d.exercise_key);
  if coalesce(cardinality(v_missing),0)=0 then
    return jsonb_build_object('status','NO_ACTION','reason','PROGRAM_ALREADY_ALIGNED','desired_exercises',to_jsonb(v_desired));
  end if;

  select array_agg(x.item_id order by x.current_priority desc nulls first,x.display_order desc,x.item_id) into v_replace_ids
  from (
    select t.item_id,t.display_order,(select min(r.priority_order) from private.exercise_candidate_rules r
      where r.active=true and r.ruleset_version='EXERCISE_CANDIDATE_RULESET_V2'
        and r.source_tool_key='exercise-fit' and r.result_code=v_result_code and r.exercise_key=t.exercise_key) current_priority
    from public.training_program_items t
    where t.program_id=v_old_program_id and t.movement_slot=v_slot and not(t.exercise_key=any(v_desired))
  ) x;
  v_replace_count:=coalesce(cardinality(v_replace_ids),0);
  if v_replace_count<>cardinality(v_missing) then return jsonb_build_object('status','NO_ACTION','reason','TARGETED_REPLACEMENT_AMBIGUOUS'); end if;

  for v_i in 1..v_replace_count loop
    select t.exercise_key into v_old_key from public.training_program_items t where t.item_id=v_replace_ids[v_i];
    v_new_key:=v_missing[v_i];
    v_replacement_map:=v_replacement_map||jsonb_build_object(v_replace_ids[v_i]::text,v_new_key);
    v_previous_changes:=v_previous_changes||jsonb_build_array(jsonb_build_object('item_id',v_replace_ids[v_i],'exercise_key',v_old_key,'exercise_name',private.exercise_name_for_candidate(v_old_key)));
    v_new_changes:=v_new_changes||jsonb_build_array(jsonb_build_object('item_id',v_replace_ids[v_i],'exercise_key',v_new_key,'exercise_name',private.exercise_name_for_candidate(v_new_key)));
  end loop;

  select coalesce(max(p.program_version),0)+1 into v_new_version from public.programs p where p.user_id=v_user_id;
  update public.programs set status='ARCHIVED',archived_at=v_applied_at where program_id=v_old_program_id;
  insert into public.programs(user_id,program_version,program_tier,goal_snapshot,status,activated_at)
  values(v_user_id,v_new_version,v_program_tier,coalesce(v_goal_snapshot,'{}'::jsonb)||jsonb_build_object('auto_update',jsonb_build_object(
    'kind','LAB_C1_TARGETED_REFRESH','source_result_id',p_result_id,'result_code',v_result_code,'evidence_family','FEMUR_TIBIA',
    'percent_difference',v_pct,'movement_slot',v_slot,'previous_program_id',v_old_program_id,'previous_program_version',v_old_version,
    'applied_at',v_applied_at,'changes',v_new_changes)),'ACTIVE',v_applied_at)
  returning program_id into v_new_program_id;

  insert into public.training_program_items(program_id,training_day,movement_slot,exercise_key,sets,rep_min,rep_max,target_rir,display_order,metadata)
  select v_new_program_id,t.training_day,t.movement_slot,c.new_exercise_key,t.sets,t.rep_min,t.rep_max,t.target_rir,t.display_order,
    case when c.changed then
      (coalesce(t.metadata,'{}'::jsonb)-'alternatives'-'alternative_name'-'visual_key'-'exercise_attributes')||jsonb_build_object(
        'display_name',private.exercise_name_for_candidate(c.new_exercise_key),'visual_key',lower(replace(c.new_exercise_key,'_','-')),
        'alternatives',coalesce((select jsonb_agg(jsonb_build_object('key',r.exercise_key,'name',private.exercise_name_for_candidate(r.exercise_key)) order by r.priority_order)
          from private.exercise_candidate_rules r where r.active=true and r.ruleset_version='EXERCISE_CANDIDATE_RULESET_V2'
            and r.source_tool_key='exercise-fit' and r.result_code=v_result_code and r.exercise_key<>c.new_exercise_key),'[]'::jsonb),
        'alternative_name',(select private.exercise_name_for_candidate(r.exercise_key) from private.exercise_candidate_rules r
          where r.active=true and r.ruleset_version='EXERCISE_CANDIDATE_RULESET_V2' and r.source_tool_key='exercise-fit'
            and r.result_code=v_result_code and r.exercise_key<>c.new_exercise_key order by r.priority_order limit 1),
        'exercise_attributes',case c.new_exercise_key when 'HACK_SQUAT' then jsonb_build_object('pattern','KNEE_DOMINANT','support','HIGH')
          when 'LEG_PRESS' then jsonb_build_object('pattern','KNEE_DOMINANT','support','HIGH')
          when 'SMITH_SQUAT' then jsonb_build_object('pattern','KNEE_DOMINANT','support','MODERATE') else jsonb_build_object('pattern','KNEE_DOMINANT') end,
        'auto_update',jsonb_build_object('kind','LAB_C1_TARGETED_REFRESH','source_result_id',p_result_id,'result_code',v_result_code,'applied_at',v_applied_at)
      ) else t.metadata end
  from public.training_program_items t
  cross join lateral(select case when v_replacement_map?t.item_id::text then v_replacement_map->>t.item_id::text else t.exercise_key end new_exercise_key,
    (v_replacement_map?t.item_id::text) changed)c
  where t.program_id=v_old_program_id;

  insert into public.nutrition_targets(program_id,maintenance_low,maintenance_high,calorie_low,calorie_high,protein_low_g,protein_high_g,fat_min_g,carb_target_g,estimate_confidence)
  select v_new_program_id,n.maintenance_low,n.maintenance_high,n.calorie_low,n.calorie_high,n.protein_low_g,n.protein_high_g,n.fat_min_g,n.carb_target_g,n.estimate_confidence
  from public.nutrition_targets n where n.program_id=v_old_program_id;

  insert into private.program_decisions(user_id,review_id,program_id,decision_type,previous_value,new_value,reason,approved_by,approved_at)
  values(v_user_id,null,v_new_program_id,'LAB_AUTO_REFRESH',
    jsonb_build_object('source_result_id',p_result_id,'program_id',v_old_program_id,'program_version',v_old_version,'movement_slot',v_slot,'changes',v_previous_changes),
    jsonb_build_object('source_result_id',p_result_id,'program_id',v_new_program_id,'program_version',v_new_version,'movement_slot',v_slot,'changes',v_new_changes),
    'C1 high-confidence directional LAB targeted refresh; actual response remains higher authority','SYSTEM_POLICY_C1_AUTO_REFRESH_V1',v_applied_at)
  returning decision_id into v_decision_id;

  return jsonb_build_object('status','UPDATED','decision_id',v_decision_id,'previous_program_id',v_old_program_id,'previous_program_version',v_old_version,
    'new_program_id',v_new_program_id,'new_program_version',v_new_version,'movement_slot',v_slot,'result_code',v_result_code,'percent_difference',v_pct,'changes',v_new_changes);
end;
$fn$;

revoke all on function private.apply_c1_targeted_program_refresh(uuid) from public, anon, authenticated;

create or replace function public.save_my_lab_result(p_tool_key text,p_result_payload jsonb,p_measured_at timestamptz default now())
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare v_user_id uuid; v_tool_key text; v_result_id uuid;
begin
  v_user_id:=auth.uid(); if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  v_tool_key:=lower(btrim(coalesce(p_tool_key,'')));
  if v_tool_key not in ('exercise-fit','squat-geometry','physique-goal','v-taper','ffmi','knee-to-wall','ape-index','femur-tibia') then raise exception 'INVALID_LAB_TOOL_KEY'; end if;
  if p_result_payload is null or jsonb_typeof(p_result_payload)<>'object' then raise exception 'LAB_RESULT_PAYLOAD_MUST_BE_OBJECT'; end if;
  if coalesce(p_result_payload->>'schema_version','')<>'LAB_RESULT_V1' then raise exception 'LAB_RESULT_SCHEMA_VERSION_REQUIRED'; end if;
  if octet_length(p_result_payload::text)>32768 then raise exception 'LAB_RESULT_PAYLOAD_TOO_LARGE'; end if;
  if p_measured_at is null then p_measured_at:=now(); end if;
  if p_measured_at>now()+interval '5 minutes' or p_measured_at<now()-interval '365 days' then raise exception 'INVALID_LAB_MEASURED_AT'; end if;
  insert into public.lab_results(user_id,tool_key,result_payload,result_status,measured_at) values(v_user_id,v_tool_key,p_result_payload,'VALID',p_measured_at) returning result_id into v_result_id;
  perform private.normalize_lab_result(v_result_id);
  perform private.rank_exercise_candidates_for_lab_result(v_result_id);
  perform private.apply_c1_targeted_program_refresh(v_result_id);
  return v_result_id;
end;$fn$;

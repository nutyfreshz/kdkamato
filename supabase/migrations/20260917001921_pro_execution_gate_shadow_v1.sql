create or replace function private.validate_pro_policy_execution_v1(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_policy jsonb;
  v_selected jsonb;
  v_user_id uuid;
  v_snapshot_program_id uuid;
  v_current_program_id uuid;
  v_domain text;
  v_action text;
  v_revalidation jsonb;
  v_current_exercise text;
  v_candidate_exercise text;
  v_muscle text;
  v_delta integer;
  v_item_id uuid;
  v_live_item record;
  v_live_target jsonb;
begin
  select cs.user_id,nullif(cs.program_snapshot->'active_program'->>'program_id','')::uuid
  into v_user_id,v_snapshot_program_id
  from private.consult_snapshots cs
  where cs.snapshot_id=p_snapshot_id;

  if v_user_id is null or v_snapshot_program_id is null then
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_SNAPSHOT_PROGRAM_MISSING','execution_authorized',false,'program_write_authorized',false);
  end if;

  v_policy := private.evaluate_pro_policy_shadow_v5(p_snapshot_id);
  if coalesce(v_policy->>'route','') <> 'AUTO_CANDIDATE_SHADOW' then
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_POLICY_NOT_AUTO_CANDIDATE','policy_route',v_policy->>'route','execution_authorized',false,'program_write_authorized',false);
  end if;

  v_selected := v_policy->'selected_proposal';
  if v_selected is null or jsonb_typeof(v_selected) <> 'object' then
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_SELECTED_PROPOSAL_MISSING','execution_authorized',false,'program_write_authorized',false);
  end if;
  if not coalesce((v_selected->>'auto_eligible_candidate')::boolean,false) then
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_SELECTED_NOT_AUTO_ELIGIBLE','execution_authorized',false,'program_write_authorized',false);
  end if;

  select p.program_id into v_current_program_id
  from public.programs p
  where p.user_id=v_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1;
  if v_current_program_id is distinct from v_snapshot_program_id then
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_SNAPSHOT_PROGRAM_STALE','snapshot_program_id',v_snapshot_program_id,'current_program_id',v_current_program_id,'execution_authorized',false,'program_write_authorized',false);
  end if;

  v_domain := v_selected->>'domain';
  v_action := v_selected->>'action';

  if v_domain='RECOVERY' and v_action in ('HOLD_PROGRESSION','TEMP_DELOAD') then
    return jsonb_build_object(
      'schema_version','PRO_EXECUTION_GATE_V1',
      'route','NON_MATERIAL_GUIDANCE_READY_SHADOW',
      'domain',v_domain,'action',v_action,
      'selected_proposal',v_selected,
      'base_program_change',false,
      'execution_authorized',false,
      'program_write_authorized',false
    );
  end if;

  if v_domain='NUTRITION' and v_action='ADJUST_CALORIES' then
    begin
      v_delta := (v_selected->'proposed_change'->>'delta_kcal_per_day')::integer;
    exception when others then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_INVALID_NUTRITION_PROPOSAL','execution_authorized',false,'program_write_authorized',false);
    end;
    v_revalidation := private.validate_nutrition_adjustment_v1(p_snapshot_id,v_delta);
    if not coalesce((v_revalidation->>'criteria_passed')::boolean,false) then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_REVALIDATION_FAILED','domain',v_domain,'action',v_action,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
    end if;
    if coalesce(v_revalidation->'current_target','{}'::jsonb) <> coalesce(v_selected->'proposed_change'->'current_target','{}'::jsonb)
       or coalesce(v_revalidation->'proposed_target','{}'::jsonb) <> coalesce(v_selected->'proposed_change'->'proposed_target','{}'::jsonb) then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_PROPOSAL_DRIFT','domain',v_domain,'action',v_action,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
    end if;
    select jsonb_build_object('calorie_low',nt.calorie_low,'calorie_high',nt.calorie_high)
    into v_live_target from public.nutrition_targets nt where nt.program_id=v_current_program_id limit 1;
    if v_live_target is distinct from v_revalidation->'current_target' then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_LIVE_NUTRITION_TARGET_DRIFT','domain',v_domain,'action',v_action,'live_target',v_live_target,'expected_current_target',v_revalidation->'current_target','execution_authorized',false,'program_write_authorized',false);
    end if;
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','EXECUTION_READY_SHADOW','domain',v_domain,'action',v_action,'snapshot_id',p_snapshot_id,'program_id',v_current_program_id,'selected_proposal',v_selected,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
  end if;

  if v_domain='VOLUME' and v_action='ADD_WEEKLY_SET' then
    v_muscle := v_selected->'proposed_change'->>'muscle';
    v_revalidation := private.select_volume_target_item_v1(p_snapshot_id,v_muscle);
    if not coalesce((v_revalidation->>'criteria_passed')::boolean,false) then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_REVALIDATION_FAILED','domain',v_domain,'action',v_action,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
    end if;
    if v_revalidation->>'target_item_id' is distinct from v_selected->'proposed_change'->>'target_item_id'
       or v_revalidation->>'exercise_key' is distinct from v_selected->'proposed_change'->>'exercise_key'
       or (v_revalidation->>'current_sets')::integer is distinct from (v_selected->'proposed_change'->>'current_sets')::integer
       or (v_revalidation->>'proposed_sets')::integer is distinct from (v_selected->'proposed_change'->>'proposed_sets')::integer then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_PROPOSAL_DRIFT','domain',v_domain,'action',v_action,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
    end if;
    v_item_id := (v_revalidation->>'target_item_id')::uuid;
    select t.item_id,t.program_id,t.exercise_key,t.sets into v_live_item from public.training_program_items t where t.item_id=v_item_id;
    if v_live_item.item_id is null or v_live_item.program_id<>v_current_program_id or v_live_item.exercise_key<>v_revalidation->>'exercise_key' or v_live_item.sets<>(v_revalidation->>'current_sets')::integer then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_LIVE_ITEM_DRIFT','domain',v_domain,'action',v_action,'execution_authorized',false,'program_write_authorized',false);
    end if;
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','EXECUTION_READY_SHADOW','domain',v_domain,'action',v_action,'snapshot_id',p_snapshot_id,'program_id',v_current_program_id,'target_item_id',v_item_id,'selected_proposal',v_selected,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
  end if;

  if v_domain='EXERCISE' and v_action='REPLACE_EXERCISE' then
    v_current_exercise := v_selected->'proposed_change'->>'from_exercise';
    v_candidate_exercise := v_selected->'proposed_change'->>'to_exercise';
    v_revalidation := private.validate_exercise_replacement_v1(v_user_id,v_current_exercise,v_candidate_exercise);
    if not coalesce((v_revalidation->>'criteria_passed')::boolean,false) then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_REVALIDATION_FAILED','domain',v_domain,'action',v_action,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
    end if;
    if v_revalidation->>'target_item_id' is distinct from v_selected->'proposed_change'->>'target_item_id'
       or v_revalidation->>'current_exercise' is distinct from v_current_exercise
       or v_revalidation->>'candidate_exercise' is distinct from v_candidate_exercise then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_PROPOSAL_DRIFT','domain',v_domain,'action',v_action,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
    end if;
    v_item_id := (v_revalidation->>'target_item_id')::uuid;
    select t.item_id,t.program_id,t.exercise_key,t.sets into v_live_item from public.training_program_items t where t.item_id=v_item_id;
    if v_live_item.item_id is null or v_live_item.program_id<>v_current_program_id or v_live_item.exercise_key<>v_current_exercise then
      return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_LIVE_ITEM_DRIFT','domain',v_domain,'action',v_action,'execution_authorized',false,'program_write_authorized',false);
    end if;
    return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','EXECUTION_READY_SHADOW','domain',v_domain,'action',v_action,'snapshot_id',p_snapshot_id,'program_id',v_current_program_id,'target_item_id',v_item_id,'selected_proposal',v_selected,'revalidation',v_revalidation,'execution_authorized',false,'program_write_authorized',false);
  end if;

  return jsonb_build_object('schema_version','PRO_EXECUTION_GATE_V1','route','BLOCKED_UNSUPPORTED_SELECTED_ACTION','domain',v_domain,'action',v_action,'execution_authorized',false,'program_write_authorized',false);
end;
$function$;

create or replace function private.evaluate_pro_policy_shadow_v4(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v3 jsonb;
  v_domains jsonb;
  v_recovery jsonb;
  v_schedule jsonb;
  v_nutrition jsonb;
  v_volume_raw jsonb;
  v_exercise_raw jsonb;
  v_volume jsonb := '[]'::jsonb;
  v_exercise jsonb := '[]'::jsonb;
  v_deferred jsonb := '[]'::jsonb;
  v_selected jsonb := null;
  v_route text := 'KEEP';
  v_validation jsonb;
  v_candidate jsonb;
  v_hardened jsonb;
  v_delta integer;
  v_nutrition_eligible boolean := false;
  v_volume_eligible integer := 0;
  v_exercise_eligible integer := 0;
  v_recovery_intervention boolean := false;
  v_safety_exception boolean := false;
begin
  v3 := private.evaluate_pro_policy_shadow_v3(p_snapshot_id);
  v_domains := coalesce(v3->'domains','{}'::jsonb);
  v_recovery := coalesce(v_domains->'recovery','{}'::jsonb);
  v_schedule := coalesce(v_domains->'schedule','{}'::jsonb);
  v_nutrition := coalesce(v_domains->'nutrition','{}'::jsonb);
  v_volume_raw := coalesce(v_domains->'volume','[]'::jsonb);
  v_exercise_raw := coalesce(v_domains->'exercise','[]'::jsonb);

  v_safety_exception := v_recovery->>'action'='EXCEPTION_REVIEW';
  v_recovery_intervention := v_recovery->>'action' in ('HOLD_PROGRESSION','TEMP_DELOAD');

  if v_nutrition->>'action'='ADJUST_CALORIES' then
    begin
      v_delta := (v_nutrition->'proposed_change'->>'delta_kcal_per_day')::integer;
      v_validation := private.validate_nutrition_adjustment_v1(p_snapshot_id,v_delta);
    exception when others then
      v_validation := jsonb_build_object('route','BLOCKED_NUTRITION_VALIDATION_ERROR','criteria_passed',false,'program_change_authorized',false);
    end;

    if coalesce((v_validation->>'criteria_passed')::boolean,false) then
      v_nutrition_eligible := true;
      v_nutrition := v_nutrition || jsonb_build_object(
        'policy_validation',v_validation,
        'proposed_change',jsonb_build_object(
          'delta_kcal_per_day',v_delta,
          'current_target',v_validation->'current_target',
          'proposed_target',v_validation->'proposed_target',
          'auto_envelope',v_validation->'auto_envelope'
        ),
        'auto_eligible_candidate',true,
        'execution_authorized',false
      );
    else
      v_nutrition := jsonb_build_object(
        'domain','NUTRITION',
        'action',case when coalesce(v_validation->>'route','') like 'REVIEW_REQUIRED%' then 'NUTRITION_REVIEW_REQUIRED' else 'NUTRITION_AUTO_BLOCKED' end,
        'level',case when coalesce(v_validation->>'route','') like 'REVIEW_REQUIRED%' then 'REVIEW_CANDIDATE' else 'BLOCKED' end,
        'original_candidate',v_nutrition,
        'policy_validation',v_validation,
        'auto_eligible_candidate',false,
        'execution_authorized',false
      );
    end if;
  end if;

  for v_candidate in select value from jsonb_array_elements(v_volume_raw)
  loop
    if v_candidate->>'action'='ADD_WEEKLY_SET' then
      v_validation := private.select_volume_target_item_v1(p_snapshot_id,v_candidate->'proposed_change'->>'muscle');
      if coalesce((v_validation->>'criteria_passed')::boolean,false) then
        v_hardened := v_candidate || jsonb_build_object(
          'policy_validation',v_validation,
          'proposed_change',jsonb_build_object(
            'muscle',v_validation->>'muscle',
            'target_item_id',v_validation->>'target_item_id',
            'exercise_key',v_validation->>'exercise_key',
            'current_sets',(v_validation->>'current_sets')::integer,
            'proposed_sets',(v_validation->>'proposed_sets')::integer,
            'delta_weekly_hard_sets',1,
            'per_exercise_set_cap',(v_validation->>'set_cap')::integer
          ),
          'auto_eligible_candidate',true,
          'execution_authorized',false
        );
        v_volume := v_volume || jsonb_build_array(v_hardened);
        v_volume_eligible := v_volume_eligible + 1;
      else
        v_hardened := jsonb_build_object(
          'domain','VOLUME',
          'action',case when coalesce(v_validation->>'route','') like 'REVIEW_REQUIRED%' then 'VOLUME_REVIEW_REQUIRED' else 'VOLUME_AUTO_BLOCKED' end,
          'level',case when coalesce(v_validation->>'route','') like 'REVIEW_REQUIRED%' then 'REVIEW_CANDIDATE' else 'BLOCKED' end,
          'original_candidate',v_candidate,
          'policy_validation',v_validation,
          'auto_eligible_candidate',false,
          'execution_authorized',false
        );
        v_volume := v_volume || jsonb_build_array(v_hardened);
      end if;
    else
      v_volume := v_volume || jsonb_build_array(v_candidate);
    end if;
  end loop;

  for v_candidate in select value from jsonb_array_elements(v_exercise_raw)
  loop
    if v_candidate->>'action'='REPLACE_EXERCISE' then
      v_validation := coalesce(v_candidate->'evidence','{}'::jsonb);
      if coalesce((v_validation->>'criteria_passed')::boolean,false)
         and nullif(v_validation->>'target_item_id','') is not null then
        v_hardened := v_candidate || jsonb_build_object(
          'proposed_change',coalesce(v_candidate->'proposed_change','{}'::jsonb) || jsonb_build_object(
            'target_item_id',v_validation->>'target_item_id'
          ),
          'auto_eligible_candidate',true,
          'execution_authorized',false
        );
        v_exercise := v_exercise || jsonb_build_array(v_hardened);
        v_exercise_eligible := v_exercise_eligible + 1;
      else
        v_exercise := v_exercise || jsonb_build_array(jsonb_build_object(
          'domain','EXERCISE','action','EXERCISE_AUTO_BLOCKED','level','BLOCKED',
          'original_candidate',v_candidate,'policy_validation',v_validation,
          'auto_eligible_candidate',false,'execution_authorized',false
        ));
      end if;
    else
      v_exercise := v_exercise || jsonb_build_array(v_candidate);
    end if;
  end loop;

  if v_safety_exception then
    v_route := 'EXCEPTION';
    v_selected := v_recovery;
    if v_exercise_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_exercise) where value->>'action'='REPLACE_EXERCISE' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
    if v_nutrition_eligible then v_deferred := v_deferred || jsonb_build_array(v_nutrition); end if;
    if v_volume_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
  elsif v_recovery_intervention then
    v_route := 'AUTO_CANDIDATE_SHADOW';
    v_selected := v_recovery;
    if v_exercise_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_exercise) where value->>'action'='REPLACE_EXERCISE' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
    if v_nutrition_eligible then v_deferred := v_deferred || jsonb_build_array(v_nutrition); end if;
    if v_volume_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
  elsif v_exercise_eligible=1 then
    v_route := 'AUTO_CANDIDATE_SHADOW';
    select value into v_selected from jsonb_array_elements(v_exercise) where value->>'action'='REPLACE_EXERCISE' and coalesce((value->>'auto_eligible_candidate')::boolean,false) limit 1;
    if v_nutrition_eligible then v_deferred := v_deferred || jsonb_build_array(v_nutrition); end if;
    if v_volume_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
  elsif v_exercise_eligible>1 then
    v_route := 'REVIEW_AMBIGUOUS';
    v_selected := jsonb_build_object('domain','EXERCISE','action','MULTIPLE_VALIDATED_ALTERNATIVES','level','REVIEW_CANDIDATE','auto_eligible_candidate',false,'execution_authorized',false);
  elsif v_schedule->>'action'='SCHEDULE_FIT_REVIEW' then
    v_route := 'REVIEW_CANDIDATE';
    v_selected := v_schedule;
    if v_nutrition_eligible then v_deferred := v_deferred || jsonb_build_array(v_nutrition); end if;
    if v_volume_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
  elsif v_nutrition_eligible then
    v_route := 'AUTO_CANDIDATE_SHADOW';
    v_selected := v_nutrition;
    if v_volume_eligible>0 then v_deferred := v_deferred || (select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' and coalesce((value->>'auto_eligible_candidate')::boolean,false)); end if;
  elsif v_volume_eligible=1 then
    v_route := 'AUTO_CANDIDATE_SHADOW';
    select value into v_selected from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' and coalesce((value->>'auto_eligible_candidate')::boolean,false) limit 1;
  elsif v_volume_eligible>1 then
    v_route := 'REVIEW_AMBIGUOUS';
    v_selected := jsonb_build_object('domain','VOLUME','action','MULTIPLE_MUSCLE_CANDIDATES','level','REVIEW_CANDIDATE','auto_eligible_candidate',false,'execution_authorized',false);
  else
    v_route := 'KEEP';
  end if;

  return jsonb_build_object(
    'policy_version','PRO_CENTRAL_POLICY_SHADOW_V4',
    'mode','SHADOW_ONLY_NO_PROGRAM_WRITE',
    'snapshot_id',p_snapshot_id,
    'route',v_route,
    'one_variable_rule',true,
    'selected_proposal',v_selected,
    'deferred_material_candidates',v_deferred,
    'domains',jsonb_build_object(
      'recovery',v_recovery,
      'schedule',v_schedule,
      'nutrition',v_nutrition,
      'volume',v_volume,
      'exercise',v_exercise
    ),
    'program_change_authorized',false,
    'execution_authorized',false
  );
end;
$function$;
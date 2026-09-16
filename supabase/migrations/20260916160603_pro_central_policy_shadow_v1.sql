create or replace function private.evaluate_pro_policy_shadow_v1(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_confidence text;
  v_metrics jsonb;
  v_program jsonb;
  v_latest_recovery text;
  v_prev_recovery text;
  v_new_issue integer;
  v_pain integer;
  v_discomfort integer;
  v_active_deprioritized integer;
  v_active_confirmed integer;
  v_low_adherence integer;
  v_weight_entries integer;
  v_recovery_action text := 'KEEP';
  v_exercise_action text := 'KEEP';
  v_schedule_action text := 'KEEP';
  v_nutrition_action text := 'OBSERVE';
  v_volume_action text := 'OBSERVE';
  v_route text := 'KEEP';
  v_blocked jsonb := '[]'::jsonb;
  v_non_material jsonb := '[]'::jsonb;
begin
  select cs.user_id,cs.data_confidence,cs.progress_metrics,cs.program_snapshot
  into v_user_id,v_confidence,v_metrics,v_program
  from private.consult_snapshots cs
  where cs.snapshot_id=p_snapshot_id;

  if v_user_id is null then raise exception 'SNAPSHOT_NOT_FOUND'; end if;

  v_new_issue := coalesce((v_metrics->>'new_issue_count')::integer,0);
  v_low_adherence := coalesce((v_metrics->>'adherence_low_count')::integer,0);
  v_weight_entries := coalesce((v_metrics->>'weight_entries_count')::integer,0);

  select x->>'recovery_status'
  into v_latest_recovery
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) with ordinality a(x,ord)
  where nullif(x->>'recovery_status','') is not null
  order by ord asc
  limit 1;

  select x->>'recovery_status'
  into v_prev_recovery
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) with ordinality a(x,ord)
  where nullif(x->>'recovery_status','') is not null
  order by ord asc
  offset 1 limit 1;

  select count(*) filter(where x->>'issue_status'='PAIN'),
         count(*) filter(where x->>'issue_status'='DISCOMFORT')
  into v_pain,v_discomfort
  from jsonb_array_elements(coalesce(v_metrics->'recent_workout_evidence','[]'::jsonb)) x;

  select
    count(*) filter(where em.memory_status='DEPRIORITIZED'),
    count(*) filter(where em.memory_status='CONFIRMED_GOOD_FIT')
  into v_active_deprioritized,v_active_confirmed
  from jsonb_array_elements(coalesce(v_program->'training_items','[]'::jsonb)) ti
  left join private.exercise_memory em
    on em.user_id=v_user_id and em.exercise_key=ti->>'exercise_key';

  if v_new_issue>0 or v_pain>0 or v_discomfort>=2 then
    v_route := 'EXCEPTION';
  end if;

  if v_latest_recovery='POOR' and v_prev_recovery='POOR' then
    v_recovery_action := 'DELOAD_CANDIDATE';
    v_blocked := v_blocked || jsonb_build_array('DELOAD_REQUIRES_POST_ACTION_MONITOR_CONTRACT');
  elsif v_latest_recovery='POOR' then
    v_recovery_action := 'HOLD_PROGRESSION';
    v_non_material := v_non_material || jsonb_build_array('HOLD_PROGRESSION');
  end if;

  if v_active_deprioritized>0 then
    v_exercise_action := 'REPLACEMENT_REVIEW_CANDIDATE';
    v_blocked := v_blocked || jsonb_build_array('EXERCISE_REPLACEMENT_REQUIRES_VALIDATED_ALTERNATIVE_AND_CHANGE_BOUND');
  elsif v_active_confirmed>0 then
    v_exercise_action := 'KEEP_CONFIRMED_RESPONSE';
  end if;

  if v_low_adherence>=2 then
    v_schedule_action := 'SCHEDULE_FIT_REVIEW_CANDIDATE';
  end if;
  v_blocked := v_blocked || jsonb_build_array('SCHEDULE_AUTO_BLOCKED_UNTIL_TRAINING_ADHERENCE_IS_SEPARATE');

  if v_weight_entries>=4 and v_confidence<>'LIMITED' then
    v_nutrition_action := 'TREND_READY_BUT_ADHERENCE_UNRESOLVED';
  else
    v_nutrition_action := 'INSUFFICIENT_TREND_DATA';
  end if;
  v_blocked := v_blocked || jsonb_build_array('NUTRITION_AUTO_BLOCKED_UNTIL_NUTRITION_ADHERENCE_IS_SEPARATE');

  v_volume_action := 'DOSE_RESPONSE_MODEL_NOT_READY';
  v_blocked := v_blocked || jsonb_build_array('VOLUME_AUTO_BLOCKED_UNTIL_MUSCLE_SPECIFIC_ACTUAL_DOSE_RESPONSE_EXISTS');

  return jsonb_build_object(
    'policy_version','PRO_CENTRAL_POLICY_SHADOW_V1',
    'mode','SHADOW_ONLY_NO_PROGRAM_WRITE',
    'snapshot_id',p_snapshot_id,
    'user_id',v_user_id,
    'data_confidence',v_confidence,
    'route',v_route,
    'domains',jsonb_build_object(
      'recovery',jsonb_build_object('action',v_recovery_action,'latest',v_latest_recovery,'previous',v_prev_recovery),
      'exercise',jsonb_build_object('action',v_exercise_action,'active_deprioritized',v_active_deprioritized,'active_confirmed',v_active_confirmed),
      'schedule',jsonb_build_object('action',v_schedule_action,'legacy_low_adherence_count',v_low_adherence),
      'nutrition',jsonb_build_object('action',v_nutrition_action,'weight_entries',v_weight_entries),
      'volume',jsonb_build_object('action',v_volume_action)
    ),
    'non_material_auto_candidates',v_non_material,
    'blocked_auto_reasons',v_blocked,
    'program_change_authorized',false
  );
end;
$$;

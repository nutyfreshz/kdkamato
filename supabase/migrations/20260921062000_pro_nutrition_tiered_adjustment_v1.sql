-- PRO Nutrition Tiered Adjustment v1
-- Approved policy change: replace fixed +/-100 kcal/day with:
--   * +/-200 kcal/day as the default material nutrition adjustment
--   * +/-300 kcal/day only for strong signals
--
-- Strong-signal requirements:
--   * nutrition adherence HIGH >= 3 entries
--   * training adherence has >= 2 entries and zero LOW entries
--   * zero recent training_status = WORSE
--   * latest and previous recovery are not POOR
--   * weight-trend deviation reaches the strong threshold
--
-- Strong thresholds:
--   FAT_LOSS: >= +0.10%/wk => -300; <= -1.50%/wk => +300
--   MUSCLE_GAIN: <= -0.25%/wk => +300; >= +0.75%/wk => -300
-- Otherwise the existing material-trigger thresholds use +/-200.
--
-- Guardrails preserved:
--   one-variable rule, exact execution gate, stale-program guard,
--   safety/recovery escalation, and human review routes.
-- Auto envelope is capped at +/-300 kcal around the foundation band.


create or replace function private.evaluate_pro_policy_shadow_v3(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_confidence text;
  v_metrics jsonb;
  v_program jsonb;
  v_period_start date;
  v_period_end date;
  v_goal text;
  v_latest_recovery text;
  v_prev_recovery text;
  v_new_issue integer := 0;
  v_pain integer := 0;
  v_discomfort integer := 0;
  v_train_high integer := 0;
  v_train_low integer := 0;
  v_train_entries integer := 0;
  v_nutri_high integer := 0;
  v_nutri_low integer := 0;
  v_nutri_entries integer := 0;
  v_weight_count integer := 0;
  v_weight_span integer := 0;
  v_first_date date;
  v_last_date date;
  v_first_avg numeric;
  v_last_avg numeric;
  v_first_n integer := 0;
  v_last_n integer := 0;
  v_weekly_pct numeric;
  v_planned_days integer;
  v_actual_sessions integer := 0;
  v_window_weeks numeric := 1;
  v_actual_sessions_per_week numeric;
  v_suggested_days integer;
  v_recovery jsonb;
  v_schedule jsonb;
  v_nutrition jsonb;
  v_volume jsonb := '[]'::jsonb;
  v_exercise jsonb := '[]'::jsonb;
  v_deferred jsonb := '[]'::jsonb;
  v_selected jsonb := null;
  v_route text := 'KEEP';
  v_m jsonb;
  v_avg_rir numeric;
  v_completion numeric;
  v_control numeric;
  v_sessions integer;
  v_rir_sets integer;
  v_issue_logs integer;
  v_comparable integer;
  v_improved integer;
  v_flat integer;
  v_declined integer;
  v_volume_eligible integer := 0;
  v_volume_candidate jsonb;
  r record;
  a jsonb;
  v_check jsonb;
  v_exercise_eligible integer := 0;
  v_exercise_candidate jsonb;
  v_delta integer := 0;
  v_nutrition_auto boolean := false;
  v_training_worse integer := 0;
  v_strong_nutrition_signal boolean := false;
  v_schedule_review boolean := false;
  v_recovery_intervention boolean := false;
  v_safety_exception boolean := false;
begin
  select cs.user_id,cs.data_confidence,cs.progress_metrics,cs.program_snapshot,cs.period_start,cs.period_end
  into v_user_id,v_confidence,v_metrics,v_program,v_period_start,v_period_end
  from private.consult_snapshots cs
  where cs.snapshot_id=p_snapshot_id;
  if v_user_id is null then raise exception 'SNAPSHOT_NOT_FOUND'; end if;

  v_goal := coalesce(v_program->'active_program'->'goal_snapshot'->>'goal','');
  v_train_high := coalesce((v_metrics->>'training_adherence_high_count')::integer,0);
  v_train_low := coalesce((v_metrics->>'training_adherence_low_count')::integer,0);
  v_train_entries := coalesce((v_metrics->>'training_adherence_entries')::integer,0);
  v_nutri_high := coalesce((v_metrics->>'nutrition_adherence_high_count')::integer,0);
  v_nutri_low := coalesce((v_metrics->>'nutrition_adherence_low_count')::integer,0);
  v_nutri_entries := coalesce((v_metrics->>'nutrition_adherence_entries')::integer,0);
  v_new_issue := coalesce((v_metrics->>'new_issue_count')::integer,0);

  select x->>'recovery_status' into v_latest_recovery
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) with ordinality q(x,ord)
  where nullif(x->>'recovery_status','') is not null order by ord asc limit 1;
  select x->>'recovery_status' into v_prev_recovery
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) with ordinality q(x,ord)
  where nullif(x->>'recovery_status','') is not null order by ord asc offset 1 limit 1;

  select count(*) filter(where x->>'issue_status'='PAIN'),count(*) filter(where x->>'issue_status'='DISCOMFORT')
  into v_pain,v_discomfort
  from jsonb_array_elements(coalesce(v_metrics->'recent_workout_evidence','[]'::jsonb)) x;

  select count(*) into v_training_worse
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) x
  where x->>'training_status'='WORSE';

  v_safety_exception := v_new_issue>0 or v_pain>0 or v_discomfort>=2;

  if v_safety_exception then
    v_recovery := jsonb_build_object('domain','SAFETY','action','EXCEPTION_REVIEW','level','EXCEPTION','evidence',jsonb_build_object('new_issue_count',v_new_issue,'pain_logs',v_pain,'discomfort_logs',v_discomfort),'auto_eligible_candidate',false,'execution_authorized',false,'monitor',jsonb_build_object('until_reviewed',true));
  elsif v_latest_recovery='POOR' and v_prev_recovery='POOR' then
    v_recovery_intervention := true;
    v_recovery := jsonb_build_object('domain','RECOVERY','action','TEMP_DELOAD','level','NON_MATERIAL_AUTO_CANDIDATE','proposed_change',jsonb_build_object('kind','TEMPORARY_STRESS_REDUCTION','base_program_change',false),'evidence',jsonb_build_object('latest_recovery',v_latest_recovery,'previous_recovery',v_prev_recovery),'auto_eligible_candidate',true,'execution_authorized',false,'monitor',jsonb_build_object('min_days',7,'min_sessions',2,'metrics',jsonb_build_array('recovery','performance','control')));
  elsif v_latest_recovery='POOR' then
    v_recovery_intervention := true;
    v_recovery := jsonb_build_object('domain','RECOVERY','action','HOLD_PROGRESSION','level','NON_MATERIAL_AUTO_CANDIDATE','proposed_change',jsonb_build_object('base_program_change',false),'evidence',jsonb_build_object('latest_recovery',v_latest_recovery),'auto_eligible_candidate',true,'execution_authorized',false,'monitor',jsonb_build_object('min_sessions',1,'metrics',jsonb_build_array('recovery','performance')));
  else
    v_recovery := jsonb_build_object('domain','RECOVERY','action','KEEP','level','KEEP','auto_eligible_candidate',false,'execution_authorized',false);
  end if;

  v_window_weeks := greatest(1.0,((v_period_end-v_period_start+1)::numeric/7.0));
  begin v_planned_days := nullif(v_program->'active_program'->'goal_snapshot'->>'training_days_per_week','')::integer; exception when others then v_planned_days := null; end;
  select count(distinct wl.entry_date) into v_actual_sessions from private.workout_exercise_logs wl where wl.user_id=v_user_id and wl.entry_date between v_period_start and v_period_end;
  v_actual_sessions_per_week := round(v_actual_sessions::numeric/v_window_weeks,1);

  if v_train_entries>=3 and v_train_low>=2 and coalesce(v_planned_days,0)>0 and v_actual_sessions>=4 and v_actual_sessions_per_week <= v_planned_days-1 then
    v_suggested_days := greatest(2,least(v_planned_days-1,round(v_actual_sessions_per_week)::integer));
    v_schedule_review := true;
    v_schedule := jsonb_build_object('domain','SCHEDULE','action','SCHEDULE_FIT_REVIEW','level','REVIEW_CANDIDATE','proposed_change',jsonb_build_object('training_days_per_week_from',v_planned_days,'training_days_per_week_candidate',v_suggested_days),'evidence',jsonb_build_object('training_adherence_entries',v_train_entries,'training_low_count',v_train_low,'actual_sessions',v_actual_sessions,'actual_sessions_per_week',v_actual_sessions_per_week,'window_weeks',v_window_weeks),'auto_eligible_candidate',false,'execution_authorized',false,'blockers',jsonb_build_array('SPLIT_OR_FREQUENCY_CHANGE_HAS_BROAD_PROGRAM_IMPACT'),'monitor',jsonb_build_object('min_days',14,'metrics',jsonb_build_array('training_adherence','session_completion','recovery')));
  elsif v_train_entries<3 then
    v_schedule := jsonb_build_object('domain','SCHEDULE','action','INSUFFICIENT_SPLIT_ADHERENCE','level','OBSERVE','auto_eligible_candidate',false,'execution_authorized',false);
  else
    v_schedule := jsonb_build_object('domain','SCHEDULE','action','KEEP','level','KEEP','auto_eligible_candidate',false,'execution_authorized',false);
  end if;

  select count(pe.body_weight_kg),min(pe.entry_date),max(pe.entry_date) into v_weight_count,v_first_date,v_last_date from public.progress_entries pe where pe.user_id=v_user_id and pe.body_weight_kg is not null and pe.entry_date between v_period_start and v_period_end;
  if v_first_date is not null and v_last_date is not null then v_weight_span := v_last_date-v_first_date; end if;
  if v_weight_count>=4 and v_weight_span>=14 then
    select avg(pe.body_weight_kg),count(*) into v_first_avg,v_first_n from public.progress_entries pe where pe.user_id=v_user_id and pe.body_weight_kg is not null and pe.entry_date between v_first_date and v_first_date+6;
    select avg(pe.body_weight_kg),count(*) into v_last_avg,v_last_n from public.progress_entries pe where pe.user_id=v_user_id and pe.body_weight_kg is not null and pe.entry_date between v_last_date-6 and v_last_date;
    if v_first_n>=2 and v_last_n>=2 and v_first_avg>0 then v_weekly_pct := ((v_last_avg-v_first_avg)/v_first_avg)*(7.0/greatest(v_weight_span,1))*100.0; end if;
  end if;

  if v_nutri_entries>=2 and v_nutri_low>=2 then
    v_nutrition := jsonb_build_object('domain','NUTRITION','action','FIX_ADHERENCE_FIRST','level','BEHAVIOR_FIRST','evidence',jsonb_build_object('nutrition_adherence_entries',v_nutri_entries,'nutrition_low_count',v_nutri_low,'weekly_weight_change_pct',case when v_weekly_pct is null then null else round(v_weekly_pct,2) end),'auto_eligible_candidate',false,'execution_authorized',false,'monitor',jsonb_build_object('min_days',14,'metrics',jsonb_build_array('nutrition_adherence','weight_trend')));
  elsif v_weekly_pct is null or v_nutri_entries<2 or v_nutri_high<2 then
    v_nutrition := jsonb_build_object('domain','NUTRITION','action','MONITOR','level','OBSERVE','evidence',jsonb_build_object('weight_entries',v_weight_count,'weight_span_days',v_weight_span,'nutrition_adherence_entries',v_nutri_entries,'nutrition_high_count',v_nutri_high),'auto_eligible_candidate',false,'execution_authorized',false);
  else
    v_strong_nutrition_signal := v_nutri_high>=3
      and v_train_entries>=2
      and v_train_low=0
      and v_training_worse=0
      and coalesce(v_latest_recovery,'OK')<>'POOR'
      and coalesce(v_prev_recovery,'OK')<>'POOR';

    if v_goal='FAT_LOSS' then
      if v_weekly_pct > -0.20 then
        v_delta := case when v_strong_nutrition_signal and v_weekly_pct >= 0.10 then -300 else -200 end;
      elsif v_weekly_pct < -1.00 then
        v_delta := case when v_strong_nutrition_signal and v_weekly_pct <= -1.50 then 300 else 200 end;
      end if;
    elsif v_goal='MUSCLE_GAIN' then
      if v_weekly_pct <= 0.00 then
        v_delta := case when v_strong_nutrition_signal and v_weekly_pct <= -0.25 then 300 else 200 end;
      elsif v_weekly_pct > 0.50 then
        v_delta := case when v_strong_nutrition_signal and v_weekly_pct >= 0.75 then -300 else -200 end;
      end if;
    end if;

    if v_delta<>0 then
      v_nutrition_auto := true;
      v_nutrition := jsonb_build_object(
        'domain','NUTRITION','action','ADJUST_CALORIES','level','MATERIAL_AUTO_CANDIDATE',
        'proposed_change',jsonb_build_object(
          'delta_kcal_per_day',v_delta,
          'change_bound_kcal',abs(v_delta),
          'adjustment_tier',case when abs(v_delta)=300 then 'STRONG_300' else 'DEFAULT_200' end
        ),
        'evidence',jsonb_build_object(
          'goal',v_goal,
          'weekly_weight_change_pct',round(v_weekly_pct,2),
          'nutrition_adherence_entries',v_nutri_entries,
          'nutrition_high_count',v_nutri_high,
          'training_adherence_entries',v_train_entries,
          'training_low_count',v_train_low,
          'training_worse_count',v_training_worse,
          'latest_recovery',v_latest_recovery,
          'previous_recovery',v_prev_recovery,
          'strong_signal',v_strong_nutrition_signal
        ),
        'auto_eligible_candidate',true,'execution_authorized',false,
        'monitor',jsonb_build_object('min_days',14,'metrics',jsonb_build_array('weight_trend','nutrition_adherence','training_response','recovery'))
      );
    else
      v_nutrition := jsonb_build_object('domain','NUTRITION','action','KEEP','level','KEEP','evidence',jsonb_build_object('goal',v_goal,'weekly_weight_change_pct',round(v_weekly_pct,2),'nutrition_high_count',v_nutri_high),'auto_eligible_candidate',false,'execution_authorized',false);
    end if;
  end if;

  for v_m in select value from jsonb_array_elements(coalesce(v_metrics->'muscle_dose_response'->'muscles','[]'::jsonb)) loop
    begin v_avg_rir := nullif(v_m->>'avg_rir','')::numeric; exception when others then v_avg_rir:=null; end;
    begin v_completion := nullif(v_m->>'completion_ratio','')::numeric; exception when others then v_completion:=null; end;
    begin v_control := nullif(v_m->>'control_good_ok_ratio','')::numeric; exception when others then v_control:=null; end;
    v_sessions := coalesce((v_m->>'session_dates')::integer,0); v_rir_sets := coalesce((v_m->>'rir_sets')::integer,0); v_issue_logs := coalesce((v_m->>'issue_logs')::integer,0); v_comparable := coalesce((v_m->>'comparable_exercises')::integer,0); v_improved := coalesce((v_m->>'improved_exercises')::integer,0); v_flat := coalesce((v_m->>'flat_exercises')::integer,0); v_declined := coalesce((v_m->>'declined_exercises')::integer,0);
    if v_sessions>=3 and v_rir_sets>=6 and coalesce(v_completion,0)>=0.75 and v_avg_rir between 1 and 3 and coalesce(v_control,0)>=0.80 and v_issue_logs=0 and v_comparable>=1 and v_improved=0 and v_flat>=1 and v_declined=0 and v_train_entries>=2 and v_train_low=0 and coalesce(v_latest_recovery,'OK')<>'POOR' and coalesce(v_prev_recovery,'OK')<>'POOR' then
      v_volume_candidate := jsonb_build_object('domain','VOLUME','action','ADD_WEEKLY_SET','level','MATERIAL_AUTO_CANDIDATE','proposed_change',jsonb_build_object('muscle',v_m->>'muscle','delta_weekly_hard_sets',1,'change_bound_sets',1),'evidence',v_m,'auto_eligible_candidate',true,'execution_authorized',false,'monitor',jsonb_build_object('min_days',14,'min_sessions',3,'metrics',jsonb_build_array('muscle_performance','rir','control','recovery','completion_ratio')));
      v_volume := v_volume||jsonb_build_array(v_volume_candidate); v_volume_eligible := v_volume_eligible+1;
    elsif v_declined>=1 and v_latest_recovery='POOR' and v_prev_recovery='POOR' then
      v_volume := v_volume||jsonb_build_array(jsonb_build_object('domain','VOLUME','action','BASE_VOLUME_REDUCTION_REVIEW_AFTER_DELOAD','level','REVIEW_CANDIDATE','proposed_change',jsonb_build_object('muscle',v_m->>'muscle'),'evidence',v_m,'auto_eligible_candidate',false,'execution_authorized',false,'blockers',jsonb_build_array('POST_DELOAD_RESPONSE_REQUIRED_BEFORE_BASE_VOLUME_REDUCTION')));
    end if;
  end loop;

  for r in select t.exercise_key,t.metadata from public.programs p join public.training_program_items t on t.program_id=p.program_id join private.exercise_memory em on em.user_id=v_user_id and em.exercise_key=t.exercise_key and em.memory_status='DEPRIORITIZED' where p.user_id=v_user_id and p.status='ACTIVE' loop
    for a in select value from jsonb_array_elements(coalesce(r.metadata->'alternatives','[]'::jsonb)) loop
      if nullif(a->>'key','') is null then continue; end if;
      v_check := private.validate_exercise_replacement_v1(v_user_id,r.exercise_key,a->>'key');
      if coalesce((v_check->>'criteria_passed')::boolean,false) then
        v_exercise_candidate := jsonb_build_object('domain','EXERCISE','action','REPLACE_EXERCISE','level','MATERIAL_AUTO_CANDIDATE','proposed_change',jsonb_build_object('from_exercise',r.exercise_key,'to_exercise',a->>'key','scope','ONE_ACTIVE_EXERCISE'),'evidence',v_check,'auto_eligible_candidate',true,'execution_authorized',false,'monitor',jsonb_build_object('min_sessions',3,'metrics',jsonb_build_array('performance','tolerance','control','recovery')));
        v_exercise := v_exercise||jsonb_build_array(v_exercise_candidate); v_exercise_eligible := v_exercise_eligible+1;
      elsif v_check->>'route'='TRIAL_ELIGIBLE_BEFORE_REPLACEMENT' then
        v_exercise := v_exercise||jsonb_build_array(jsonb_build_object('domain','EXERCISE','action','TRIAL_EXERCISE','level','NON_MATERIAL_TRIAL','proposed_change',jsonb_build_object('current_exercise',r.exercise_key,'trial_exercise',a->>'key'),'evidence',v_check,'auto_eligible_candidate',true,'execution_authorized',false,'monitor',jsonb_build_object('min_sessions',2,'metrics',jsonb_build_array('performance','tolerance','control'))));
      else
        v_exercise := v_exercise||jsonb_build_array(jsonb_build_object('domain','EXERCISE','action','NO_REPLACEMENT','level','BLOCKED','evidence',v_check,'auto_eligible_candidate',false,'execution_authorized',false));
      end if;
    end loop;
  end loop;

  if v_safety_exception then v_route := 'EXCEPTION'; v_selected := v_recovery;
  elsif v_recovery_intervention then v_route := 'AUTO_CANDIDATE_SHADOW'; v_selected := v_recovery;
  elsif v_exercise_eligible=1 then v_route := 'AUTO_CANDIDATE_SHADOW'; select value into v_selected from jsonb_array_elements(v_exercise) where value->>'action'='REPLACE_EXERCISE' limit 1; if v_nutrition_auto then v_deferred:=v_deferred||jsonb_build_array(v_nutrition); end if; if v_volume_eligible>0 then v_deferred:=v_deferred||v_volume; end if;
  elsif v_exercise_eligible>1 then v_route := 'REVIEW_AMBIGUOUS'; v_selected := jsonb_build_object('domain','EXERCISE','action','MULTIPLE_VALIDATED_ALTERNATIVES','level','REVIEW_CANDIDATE','auto_eligible_candidate',false,'execution_authorized',false);
  elsif v_schedule_review then v_route := 'REVIEW_CANDIDATE'; v_selected := v_schedule; if v_nutrition_auto then v_deferred:=v_deferred||jsonb_build_array(v_nutrition); end if; if v_volume_eligible>0 then v_deferred:=v_deferred||v_volume; end if;
  elsif v_nutrition_auto then v_route := 'AUTO_CANDIDATE_SHADOW'; v_selected := v_nutrition; if v_volume_eligible>0 then v_deferred:=v_deferred||v_volume; end if;
  elsif v_volume_eligible=1 then v_route := 'AUTO_CANDIDATE_SHADOW'; select value into v_selected from jsonb_array_elements(v_volume) where value->>'action'='ADD_WEEKLY_SET' limit 1;
  elsif v_volume_eligible>1 then v_route := 'REVIEW_AMBIGUOUS'; v_selected := jsonb_build_object('domain','VOLUME','action','MULTIPLE_MUSCLE_CANDIDATES','level','REVIEW_CANDIDATE','auto_eligible_candidate',false,'execution_authorized',false);
  else v_route := 'KEEP'; end if;

  return jsonb_build_object('policy_version','PRO_CENTRAL_POLICY_SHADOW_V3','mode','SHADOW_ONLY_NO_PROGRAM_WRITE','snapshot_id',p_snapshot_id,'user_id',v_user_id,'data_confidence',v_confidence,'route',v_route,'one_variable_rule',true,'selected_proposal',v_selected,'deferred_material_candidates',v_deferred,'domains',jsonb_build_object('recovery',v_recovery,'schedule',v_schedule,'nutrition',v_nutrition,'volume',v_volume,'exercise',v_exercise),'program_change_authorized',false,'execution_authorized',false);
end;
$function$;

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
          'change_bound_kcal',abs(v_delta),
          'adjustment_tier',case when abs(v_delta)=300 then 'STRONG_300' else 'DEFAULT_200' end,
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
  if p_delta_kcal not in (-300,-200,200,300) then
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

  v_envelope_low := greatest(1,v_foundation_low-300);
  v_envelope_high := v_foundation_high+300;
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
    'schema_version','NUTRITION_ADJUSTMENT_VALIDATOR_V2',
    'route',v_route,
    'goal',v_goal,
    'estimate_confidence',v_confidence,
    'delta_kcal_per_day',p_delta_kcal,
    'foundation_band',jsonb_build_object('calorie_low',v_foundation_low,'calorie_high',v_foundation_high),
    'auto_envelope',jsonb_build_object('calorie_low',v_envelope_low,'calorie_high',v_envelope_high,'rule','FREE_FOUNDATION_BAND_PLUS_MAX_300_KCAL','max_abs_delta_kcal',300),
    'current_target',jsonb_build_object('calorie_low',v_calorie_low,'calorie_high',v_calorie_high),
    'proposed_target',jsonb_build_object('calorie_low',v_proposed_low,'calorie_high',v_proposed_high),
    'criteria_passed',v_pass,
    'program_change_authorized',false
  );
end;
$function$;

create or replace function private.publish_auto_adapt_consult_report_v1(p_snapshot_id uuid,p_analysis_id uuid,p_execution jsonb,p_next_review_date date)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid; v_cycle_key text; v_period_start date; v_period_end date;
  v_decision_id uuid; v_new_program_id uuid; v_domain text; v_action text; v_report_id uuid;
  v_what_changed text; v_training_review text; v_nutrition_review text; v_program_update text;
  v_delta integer; v_abs_delta integer;
begin
  if coalesce((p_execution->>'applied')::boolean,false) is not true or coalesce(p_execution->>'route','') <> 'AUTO_WRITE_APPLIED' then raise exception 'VALID_AUTO_EXECUTION_REQUIRED'; end if;
  select s.user_id,s.cycle_key,s.period_start,s.period_end into v_user_id,v_cycle_key,v_period_start,v_period_end from private.consult_snapshots s where s.snapshot_id=p_snapshot_id;
  if v_user_id is null then raise exception 'SNAPSHOT_NOT_FOUND'; end if;
  if not exists (select 1 from private.consult_analysis a where a.analysis_id=p_analysis_id and a.snapshot_id=p_snapshot_id and a.user_id=v_user_id and a.escalation_required=false and a.bloodwork_consideration=false) then raise exception 'AUTO_ANALYSIS_CONTRACT_FAILED'; end if;
  if exists (select 1 from private.review_queue q where q.snapshot_id=p_snapshot_id or q.analysis_id=p_analysis_id) then raise exception 'AUTO_CASE_CANNOT_HAVE_REVIEW_QUEUE'; end if;

  v_decision_id := nullif(p_execution->>'decision_id','')::uuid;
  v_new_program_id := nullif(p_execution->>'new_program_id','')::uuid;
  v_domain := p_execution->>'domain'; v_action := p_execution->>'action';
  begin
    v_delta := nullif(p_execution->'selected_proposal'->'proposed_change'->>'delta_kcal_per_day','')::integer;
  exception when others then
    v_delta := null;
  end;
  v_abs_delta := abs(coalesce(v_delta,0));
  if not exists (
    select 1 from private.program_decisions d join public.programs p on p.program_id=d.program_id and p.user_id=d.user_id
    where d.decision_id=v_decision_id and d.user_id=v_user_id and d.program_id=v_new_program_id and d.review_id is null
      and d.approved_by='KDKAMATO_AUTO_POLICY_V1' and d.previous_value->>'snapshot_id'=p_snapshot_id::text and p.status='ACTIVE' and p.program_tier='PRO'
  ) then raise exception 'AUTO_WRITE_DECISION_AUDIT_REQUIRED'; end if;

  if v_domain='NUTRITION' and v_action='ADJUST_CALORIES' then
    if v_abs_delta not in (200,300) then raise exception 'INVALID_TIERED_NUTRITION_DELTA'; end if;
    v_what_changed := case when v_delta<0 then 'ลดเป้าหมายพลังงานตามแนวโน้มจริงและความสม่ำเสมอ' else 'เพิ่มเป้าหมายพลังงานตามแนวโน้มจริงและความสม่ำเสมอ' end;
    v_training_review := 'โครงสร้างการฝึกคงเดิม';
    v_nutrition_review := case when v_delta<0 then 'เป้าหมายพลังงานลดลง ' else 'เป้าหมายพลังงานเพิ่มขึ้น ' end || v_abs_delta || ' kcal/วัน ตาม guardrail';
    v_program_update := 'สร้าง Program version ใหม่โดยปรับ Nutrition target ' || v_abs_delta || ' kcal/วัน';
  elsif v_domain='VOLUME' and v_action='ADD_WEEKLY_SET' then
    v_what_changed := 'เพิ่มปริมาณฝึก 1 เซตในท่าที่ผ่านเกณฑ์ตอบสนองจริง'; v_training_review := 'ปรับเฉพาะ 1 เซตในท่าเป้าหมาย ส่วน Program อื่นคงเดิม'; v_nutrition_review := 'เป้าหมายโภชนาการคงเดิม'; v_program_update := 'สร้าง Program version ใหม่โดยเพิ่ม 1 set ในท่าเป้าหมาย';
  elsif v_domain='EXERCISE' and v_action='REPLACE_EXERCISE' then
    v_what_changed := 'เปลี่ยนท่าฝึก 1 ท่าตามผลตอบสนองจริงและตัวเลือกที่ยืนยันว่าเหมาะ'; v_training_review := 'เปลี่ยนเฉพาะท่าเป้าหมาย 1 จุด ส่วนโครงสร้าง Program อื่นคงเดิม'; v_nutrition_review := 'เป้าหมายโภชนาการคงเดิม'; v_program_update := 'สร้าง Program version ใหม่โดยเปลี่ยนท่าเป้าหมาย 1 ท่า';
  else raise exception 'UNSUPPORTED_AUTO_REPORT_ACTION'; end if;

  insert into public.consult_reports(user_id,cycle_key,period_start,period_end,overall_status,what_changed,training_review,nutrition_review,lab_context,professional_assessment,program_update,next_actions,monitor_items,next_review_date,report_status,published_at,source_review_id)
  values(v_user_id,v_cycle_key,v_period_start,v_period_end,'ADAPT',v_what_changed,v_training_review,v_nutrition_review,
    'LAB เป็นข้อมูลประกอบ แต่การปรับครั้งนี้ผ่าน exact gate จากข้อมูลตอบสนองจริง','ระบบปรับเพียงตัวแปรเดียวและสร้าง Program version ใหม่เพื่อเก็บประวัติเดิมไว้',v_program_update,
    jsonb_build_array('ใช้ Program version ใหม่ต่อ','บันทึกผลการฝึกและการฟื้นตัวตามปกติ'),jsonb_build_array('performance','recovery','exercise tolerance','body-weight trend'),p_next_review_date,'PUBLISHED',now(),null)
  returning report_id into v_report_id;
  return v_report_id;
end;
$function$;

revoke all on function private.publish_auto_adapt_consult_report_v1(uuid,uuid,jsonb,date) from public, anon, authenticated;
grant execute on function private.publish_auto_adapt_consult_report_v1(uuid,uuid,jsonb,date) to service_role;

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
    if v_goal='FAT_LOSS' then if v_weekly_pct > -0.20 then v_delta := -100; elsif v_weekly_pct < -1.00 then v_delta := 100; end if;
    elsif v_goal='MUSCLE_GAIN' then if v_weekly_pct <= 0.00 then v_delta := 100; elsif v_weekly_pct > 0.50 then v_delta := -100; end if; end if;
    if v_delta<>0 then
      v_nutrition_auto := true;
      v_nutrition := jsonb_build_object('domain','NUTRITION','action','ADJUST_CALORIES','level','MATERIAL_AUTO_CANDIDATE','proposed_change',jsonb_build_object('delta_kcal_per_day',v_delta,'change_bound_kcal',100),'evidence',jsonb_build_object('goal',v_goal,'weekly_weight_change_pct',round(v_weekly_pct,2),'nutrition_adherence_entries',v_nutri_entries,'nutrition_high_count',v_nutri_high),'auto_eligible_candidate',true,'execution_authorized',false,'monitor',jsonb_build_object('min_days',14,'metrics',jsonb_build_array('weight_trend','nutrition_adherence','training_response','recovery')));
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
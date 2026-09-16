alter table public.progress_entries add column if not exists training_adherence_status text;
alter table public.progress_entries add column if not exists nutrition_adherence_status text;

alter table public.progress_entries drop constraint if exists progress_entries_training_adherence_status_check;
alter table public.progress_entries add constraint progress_entries_training_adherence_status_check check (training_adherence_status is null or training_adherence_status in ('HIGH','MEDIUM','LOW'));
alter table public.progress_entries drop constraint if exists progress_entries_nutrition_adherence_status_check;
alter table public.progress_entries add constraint progress_entries_nutrition_adherence_status_check check (nutrition_adherence_status is null or nutrition_adherence_status in ('HIGH','MEDIUM','LOW'));

create or replace function public.save_my_progress_check_v2(
  p_entry_date date,
  p_body_weight_kg numeric default null,
  p_training_completed boolean default null,
  p_training_status text default null,
  p_recovery_status text default null,
  p_training_adherence_status text default null,
  p_nutrition_adherence_status text default null,
  p_new_issue boolean default false,
  p_optional_note text default null
) returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_active_program uuid;
  v_existing_program uuid;
  v_program uuid;
  v_entry_id uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_body_weight_kg is not null and (p_body_weight_kg < 20 or p_body_weight_kg > 400) then raise exception 'INVALID_WEIGHT'; end if;
  if p_training_status is not null and p_training_status not in ('BETTER','SAME','WORSE') then raise exception 'INVALID_TRAINING_STATUS'; end if;
  if p_recovery_status is not null and p_recovery_status not in ('GOOD','OK','POOR') then raise exception 'INVALID_RECOVERY_STATUS'; end if;
  if p_training_adherence_status is not null and p_training_adherence_status not in ('HIGH','MEDIUM','LOW') then raise exception 'INVALID_TRAINING_ADHERENCE_STATUS'; end if;
  if p_nutrition_adherence_status is not null and p_nutrition_adherence_status not in ('HIGH','MEDIUM','LOW') then raise exception 'INVALID_NUTRITION_ADHERENCE_STATUS'; end if;

  select p.program_id into v_active_program
  from public.programs p
  where p.user_id=v_uid and p.status='ACTIVE'
  order by p.program_version desc limit 1;

  select pe.program_id into v_existing_program
  from public.progress_entries pe
  where pe.user_id=v_uid and pe.entry_date=p_entry_date
  limit 1;

  v_program := coalesce(v_existing_program,v_active_program);

  insert into public.progress_entries(
    user_id,program_id,entry_date,body_weight_kg,training_completed,
    training_status,recovery_status,adherence_status,training_adherence_status,
    nutrition_adherence_status,new_issue,optional_note
  ) values (
    v_uid,v_program,p_entry_date,p_body_weight_kg,p_training_completed,
    p_training_status,p_recovery_status,null,p_training_adherence_status,
    p_nutrition_adherence_status,coalesce(p_new_issue,false),nullif(btrim(p_optional_note),'')
  )
  on conflict(user_id,entry_date) do update set
    program_id=coalesce(public.progress_entries.program_id,excluded.program_id),
    body_weight_kg=excluded.body_weight_kg,
    training_completed=excluded.training_completed,
    training_status=excluded.training_status,
    recovery_status=excluded.recovery_status,
    training_adherence_status=excluded.training_adherence_status,
    nutrition_adherence_status=excluded.nutrition_adherence_status,
    new_issue=excluded.new_issue,
    optional_note=excluded.optional_note,
    updated_at=now()
  returning entry_id,program_id into v_entry_id,v_program;

  return jsonb_build_object('entry_id',v_entry_id,'program_id',v_program,'entry_date',p_entry_date,'schema_version','PROGRESS_CHECK_V2');
end;
$function$;

revoke all on function public.save_my_progress_check_v2(date,numeric,boolean,text,text,text,text,boolean,text) from public, anon;
grant execute on function public.save_my_progress_check_v2(date,numeric,boolean,text,text,text,text,boolean,text) to authenticated;

create or replace function private.build_muscle_dose_response_v1(p_user_id uuid,p_start date,p_end date)
returns jsonb
language sql
stable
set search_path to ''
as $function$
with params as (
  select greatest(1.0,((p_end-p_start+1)::numeric/7.0)) as window_weeks
), active_program as (
  select p.program_id from public.programs p
  where p.user_id=p_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1
), prescribed as (
  select upper(coalesce(t.metadata->>'primary_muscle','UNKNOWN')) as muscle,
         sum(t.sets)::numeric as prescribed_weekly_sets
  from public.training_program_items t
  join active_program ap on ap.program_id=t.program_id
  group by 1
), log_base as (
  select wl.entry_date,wl.exercise_key,
         upper(coalesce(t.metadata->>'primary_muscle','UNKNOWN')) as muscle,
         jsonb_array_length(wl.set_entries) as completed_sets,
         wl.control_status,wl.issue_status,wl.set_entries
  from private.workout_exercise_logs wl
  join public.training_program_items t on t.item_id=wl.item_id
  where wl.user_id=p_user_id and wl.entry_date between p_start and p_end
), set_rows as (
  select lb.entry_date,lb.exercise_key,lb.muscle,
         nullif(s->>'reps','')::numeric as reps,
         nullif(s->>'load_kg','')::numeric as load_kg,
         nullif(s->>'rir','')::numeric as rir
  from log_base lb
  cross join lateral jsonb_array_elements(lb.set_entries) s
), actual as (
  select muscle,sum(completed_sets)::numeric as actual_sets,
         count(distinct entry_date)::integer as session_dates,
         count(distinct exercise_key)::integer as exercises_logged,
         count(*) filter(where control_status in ('GOOD','OK'))::integer as control_good_ok_logs,
         count(*)::integer as workout_logs,
         count(*) filter(where issue_status in ('DISCOMFORT','PAIN'))::integer as issue_logs
  from log_base group by muscle
), rir_agg as (
  select muscle,round(avg(rir),2) as avg_rir,count(rir)::integer as rir_sets
  from set_rows group by muscle
), session_perf as (
  select entry_date,exercise_key,muscle,
         max(case when load_kg is not null and load_kg>0 and reps is not null
                  then load_kg*(1+((reps+coalesce(rir,0))/30.0)) end) as capacity_proxy
  from set_rows group by entry_date,exercise_key,muscle
), ranked_perf as (
  select sp.*,row_number() over(partition by exercise_key order by entry_date desc) as rn
  from session_perf sp where capacity_proxy is not null
), exercise_trends as (
  select exercise_key,muscle,
         max(capacity_proxy) filter(where rn=1) as latest_proxy,
         max(capacity_proxy) filter(where rn=2) as previous_proxy
  from ranked_perf where rn<=2 group by exercise_key,muscle
), trend_agg as (
  select muscle,
         count(*) filter(where latest_proxy is not null and previous_proxy is not null)::integer as comparable_exercises,
         count(*) filter(where previous_proxy>0 and latest_proxy/previous_proxy>1.02)::integer as improved_exercises,
         count(*) filter(where previous_proxy>0 and latest_proxy/previous_proxy between 0.98 and 1.02)::integer as flat_exercises,
         count(*) filter(where previous_proxy>0 and latest_proxy/previous_proxy<0.98)::integer as declined_exercises
  from exercise_trends group by muscle
), muscles as (
  select muscle from prescribed union select muscle from actual union select muscle from trend_agg
)
select jsonb_build_object(
  'schema_version','MUSCLE_DOSE_RESPONSE_V1','mode','EVIDENCE_ONLY',
  'period_start',p_start,'period_end',p_end,
  'performance_proxy_method','EPLEY_REPS_PLUS_RIR_LOAD_ONLY_SHADOW',
  'muscles',coalesce(jsonb_agg(jsonb_build_object(
    'muscle',m.muscle,
    'prescribed_weekly_sets',coalesce(p.prescribed_weekly_sets,0),
    'window_weeks',(select window_weeks from params),
    'expected_sets_in_window',round(coalesce(p.prescribed_weekly_sets,0)*(select window_weeks from params),1),
    'actual_completed_sets',coalesce(a.actual_sets,0),
    'completion_ratio',case when coalesce(p.prescribed_weekly_sets,0)>0 then round(coalesce(a.actual_sets,0)/(p.prescribed_weekly_sets*(select window_weeks from params)),2) else null end,
    'session_dates',coalesce(a.session_dates,0),'exercises_logged',coalesce(a.exercises_logged,0),
    'avg_rir',r.avg_rir,'rir_sets',coalesce(r.rir_sets,0),
    'control_good_ok_ratio',case when coalesce(a.workout_logs,0)>0 then round(a.control_good_ok_logs::numeric/a.workout_logs,2) else null end,
    'issue_logs',coalesce(a.issue_logs,0),
    'comparable_exercises',coalesce(t.comparable_exercises,0),
    'improved_exercises',coalesce(t.improved_exercises,0),
    'flat_exercises',coalesce(t.flat_exercises,0),
    'declined_exercises',coalesce(t.declined_exercises,0)
  ) order by m.muscle),'[]'::jsonb)
)
from muscles m
left join prescribed p on p.muscle=m.muscle
left join actual a on a.muscle=m.muscle
left join rir_agg r on r.muscle=m.muscle
left join trend_agg t on t.muscle=m.muscle;
$function$;

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
  v_context_fresh boolean := false;
  v_current_count integer := 0;
  v_route text;
  v_criteria_passed boolean := false;
begin
  select p.program_id into v_program_id from public.programs p
  where p.user_id=p_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1;
  if v_program_id is null then return jsonb_build_object('route','BLOCKED_NO_ACTIVE_PROGRAM','criteria_passed',false,'program_change_authorized',false); end if;

  select count(*) into v_current_count from public.training_program_items t
  where t.program_id=v_program_id and t.exercise_key=p_current_exercise;
  if v_current_count=0 then return jsonb_build_object('route','BLOCKED_CURRENT_NOT_ACTIVE','criteria_passed',false,'program_change_authorized',false); end if;
  if p_candidate_exercise is null or p_candidate_exercise=p_current_exercise then return jsonb_build_object('route','BLOCKED_INVALID_CANDIDATE','criteria_passed',false,'program_change_authorized',false); end if;

  select em.memory_status,coalesce(em.evidence_summary,'{}'::jsonb) into v_current_status,v_current_evidence
  from private.exercise_memory em where em.user_id=p_user_id and em.exercise_key=p_current_exercise;
  select em.memory_status,coalesce(em.evidence_summary,'{}'::jsonb) into v_candidate_status,v_candidate_evidence
  from private.exercise_memory em where em.user_id=p_user_id and em.exercise_key=p_candidate_exercise;

  v_poor_tolerance := coalesce((v_current_evidence->>'poor_tolerance_count')::integer,0);
  v_dislike := coalesce((v_current_evidence->>'dislike_count')::integer,0);

  select exists(
    select 1 from public.training_program_items t
    cross join lateral jsonb_array_elements(coalesce(t.metadata->'alternatives','[]'::jsonb)) a
    where t.program_id=v_program_id and t.exercise_key=p_current_exercise and a->>'key'=p_candidate_exercise
  ) into v_candidate_is_program_alt;

  select coalesce((p.goal_snapshot->>'goal')=ub.goal,false)
         and coalesce((p.goal_snapshot->>'equipment_profile')=ub.equipment_profile,false)
         and coalesce((p.goal_snapshot->>'training_days_per_week')::integer=ub.training_days_per_week,false)
  into v_context_fresh
  from public.programs p join public.user_baseline ub on ub.user_id=p.user_id
  where p.program_id=v_program_id;

  if v_current_status='CONFIRMED_GOOD_FIT' then v_route:='BLOCKED_CURRENT_CONFIRMED_GOOD_FIT';
  elsif v_candidate_status='DEPRIORITIZED' then v_route:='BLOCKED_CANDIDATE_DEPRIORITIZED';
  elsif not v_candidate_is_program_alt then v_route:='BLOCKED_CANDIDATE_NOT_PROGRAM_ALTERNATIVE';
  elsif not v_context_fresh then v_route:='BLOCKED_PROGRAM_CONTEXT_STALE';
  elsif v_poor_tolerance<2 and v_dislike>=2 then v_route:='REVIEW_ONLY_DISLIKE_WITHOUT_TOLERANCE_FAILURE';
  elsif v_poor_tolerance<2 then v_route:='BLOCKED_INSUFFICIENT_REAL_RESPONSE';
  elsif coalesce(v_candidate_status,'UNTESTED')='CONFIRMED_GOOD_FIT' then v_route:='REPLACEMENT_CRITERIA_PASSED_SHADOW'; v_criteria_passed:=true;
  else v_route:='TRIAL_ELIGIBLE_BEFORE_REPLACEMENT'; end if;

  return jsonb_build_object(
    'schema_version','EXERCISE_REPLACEMENT_VALIDATOR_V1','route',v_route,
    'current_exercise',p_current_exercise,'candidate_exercise',p_candidate_exercise,
    'current_memory_status',coalesce(v_current_status,'UNTESTED'),
    'candidate_memory_status',coalesce(v_candidate_status,'UNTESTED'),
    'poor_tolerance_count',v_poor_tolerance,'dislike_count',v_dislike,
    'candidate_is_program_alternative',v_candidate_is_program_alt,
    'program_context_fresh',v_context_fresh,'criteria_passed',v_criteria_passed,
    'program_change_authorized',false
  );
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
  v_muscle_dose jsonb;
  v_train_high integer; v_train_medium integer; v_train_low integer; v_train_entries integer;
  v_nutri_high integer; v_nutri_medium integer; v_nutri_low integer; v_nutri_entries integer;
begin
  select coalesce(jsonb_agg(x.payload order by x.entry_date desc),'[]'::jsonb) into v_recent
  from (
    select pe.entry_date,
      jsonb_build_object('entry_date',pe.entry_date,'training_completed',pe.training_completed,
        'training_status',pe.training_status,'recovery_status',pe.recovery_status,
        'legacy_adherence_status',pe.adherence_status,
        'training_adherence_status',pe.training_adherence_status,
        'nutrition_adherence_status',pe.nutrition_adherence_status,'new_issue',pe.new_issue) as payload
    from public.progress_entries pe
    where pe.user_id=new.user_id and pe.entry_date between new.period_start and new.period_end
    order by pe.entry_date desc,pe.created_at desc limit 8
  ) x;

  select coalesce(jsonb_agg(x.payload order by x.entry_date desc,x.exercise_key),'[]'::jsonb) into v_workouts
  from (
    select wl.entry_date,wl.exercise_key,
      jsonb_build_object('entry_date',wl.entry_date,'exercise_key',wl.exercise_key,
        'set_count',jsonb_array_length(wl.set_entries),'set_entries',wl.set_entries,
        'control_status',wl.control_status,'issue_status',wl.issue_status) as payload
    from private.workout_exercise_logs wl
    where wl.user_id=new.user_id and wl.entry_date between new.period_start and new.period_end
    order by wl.entry_date desc,wl.updated_at desc limit 30
  ) x;

  select
    count(*) filter(where training_adherence_status='HIGH'),count(*) filter(where training_adherence_status='MEDIUM'),count(*) filter(where training_adherence_status='LOW'),count(training_adherence_status),
    count(*) filter(where nutrition_adherence_status='HIGH'),count(*) filter(where nutrition_adherence_status='MEDIUM'),count(*) filter(where nutrition_adherence_status='LOW'),count(nutrition_adherence_status)
  into v_train_high,v_train_medium,v_train_low,v_train_entries,v_nutri_high,v_nutri_medium,v_nutri_low,v_nutri_entries
  from public.progress_entries pe where pe.user_id=new.user_id and pe.entry_date between new.period_start and new.period_end;

  v_muscle_dose := private.build_muscle_dose_response_v1(new.user_id,new.period_start,new.period_end);

  new.progress_metrics := coalesce(new.progress_metrics,'{}'::jsonb) || jsonb_build_object(
    'recent_signals',v_recent,'recent_workout_evidence',v_workouts,
    'training_adherence_high_count',v_train_high,'training_adherence_medium_count',v_train_medium,
    'training_adherence_low_count',v_train_low,'training_adherence_entries',v_train_entries,
    'nutrition_adherence_high_count',v_nutri_high,'nutrition_adherence_medium_count',v_nutri_medium,
    'nutrition_adherence_low_count',v_nutri_low,'nutrition_adherence_entries',v_nutri_entries,
    'muscle_dose_response',v_muscle_dose,'evidence_schema_version','PRO_TRAINING_CONTEXT_V3'
  );
  return new;
end;
$function$;

create or replace function private.evaluate_pro_policy_shadow_v2(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_user_id uuid; v_confidence text; v_metrics jsonb; v_program jsonb;
  v_latest_recovery text; v_prev_recovery text;
  v_new_issue integer; v_pain integer; v_discomfort integer;
  v_train_low integer; v_train_entries integer;
  v_nutri_low integer; v_nutri_high integer; v_nutri_entries integer; v_weight_entries integer;
  v_route text := 'KEEP'; v_recovery_action text := 'KEEP'; v_schedule_action text := 'OBSERVE';
  v_nutrition_action text := 'OBSERVE'; v_volume_action text := 'EVIDENCE_ONLY';
  v_exercise_checks jsonb := '[]'::jsonb; v_blocked jsonb := '[]'::jsonb;
begin
  select cs.user_id,cs.data_confidence,cs.progress_metrics,cs.program_snapshot
  into v_user_id,v_confidence,v_metrics,v_program from private.consult_snapshots cs where cs.snapshot_id=p_snapshot_id;
  if v_user_id is null then raise exception 'SNAPSHOT_NOT_FOUND'; end if;

  v_new_issue:=coalesce((v_metrics->>'new_issue_count')::integer,0);
  v_train_low:=coalesce((v_metrics->>'training_adherence_low_count')::integer,0);
  v_train_entries:=coalesce((v_metrics->>'training_adherence_entries')::integer,0);
  v_nutri_low:=coalesce((v_metrics->>'nutrition_adherence_low_count')::integer,0);
  v_nutri_high:=coalesce((v_metrics->>'nutrition_adherence_high_count')::integer,0);
  v_nutri_entries:=coalesce((v_metrics->>'nutrition_adherence_entries')::integer,0);
  v_weight_entries:=coalesce((v_metrics->>'weight_entries_count')::integer,0);

  select x->>'recovery_status' into v_latest_recovery
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) with ordinality a(x,ord)
  where nullif(x->>'recovery_status','') is not null order by ord asc limit 1;
  select x->>'recovery_status' into v_prev_recovery
  from jsonb_array_elements(coalesce(v_metrics->'recent_signals','[]'::jsonb)) with ordinality a(x,ord)
  where nullif(x->>'recovery_status','') is not null order by ord asc offset 1 limit 1;

  select count(*) filter(where x->>'issue_status'='PAIN'),count(*) filter(where x->>'issue_status'='DISCOMFORT')
  into v_pain,v_discomfort from jsonb_array_elements(coalesce(v_metrics->'recent_workout_evidence','[]'::jsonb)) x;

  if v_new_issue>0 or v_pain>0 or v_discomfort>=2 then v_route:='EXCEPTION'; end if;
  if v_latest_recovery='POOR' and v_prev_recovery='POOR' then v_recovery_action:='DELOAD_CANDIDATE'; v_blocked:=v_blocked||jsonb_build_array('DELOAD_REQUIRES_MONITOR_CONTRACT');
  elsif v_latest_recovery='POOR' then v_recovery_action:='HOLD_PROGRESSION'; end if;

  if v_train_entries<2 then v_schedule_action:='INSUFFICIENT_SPLIT_TRAINING_ADHERENCE';
  elsif v_train_low>=2 then v_schedule_action:='SCHEDULE_FIT_REVIEW_CANDIDATE';
  else v_schedule_action:='KEEP_SCHEDULE'; end if;

  if v_weight_entries>=4 and v_nutri_entries>=2 then
    if v_nutri_low>=2 then v_nutrition_action:='FIX_ADHERENCE_FIRST';
    elsif v_nutri_high>=2 then v_nutrition_action:='TREND_READY_ADHERENCE_KNOWN';
    else v_nutrition_action:='MONITOR_ADHERENCE'; end if;
  else v_nutrition_action:='INSUFFICIENT_TREND_OR_NUTRITION_ADHERENCE'; end if;

  select coalesce(jsonb_agg(private.validate_exercise_replacement_v1(v_user_id,t.exercise_key,a->>'key')),'[]'::jsonb)
  into v_exercise_checks
  from public.programs p join public.training_program_items t on t.program_id=p.program_id
  join private.exercise_memory em on em.user_id=v_user_id and em.exercise_key=t.exercise_key and em.memory_status='DEPRIORITIZED'
  cross join lateral jsonb_array_elements(coalesce(t.metadata->'alternatives','[]'::jsonb)) a
  where p.user_id=v_user_id and p.status='ACTIVE' and (a->>'key') is not null;

  if not exists(
    select 1 from jsonb_array_elements(coalesce(v_metrics->'muscle_dose_response'->'muscles','[]'::jsonb)) m
    where coalesce((m->>'session_dates')::integer,0)>=3 and coalesce((m->>'rir_sets')::integer,0)>=6
  ) then v_volume_action:='INSUFFICIENT_MUSCLE_SPECIFIC_ACTUAL_DOSE_RESPONSE';
  else v_volume_action:='MUSCLE_DOSE_RESPONSE_READY_FOR_REVIEW'; end if;

  v_blocked:=v_blocked||jsonb_build_array('MATERIAL_PROGRAM_AUTO_WRITE_REMAINS_DISABLED_IN_SHADOW_V2');

  return jsonb_build_object(
    'policy_version','PRO_CENTRAL_POLICY_SHADOW_V2','mode','SHADOW_ONLY_NO_PROGRAM_WRITE',
    'snapshot_id',p_snapshot_id,'user_id',v_user_id,'data_confidence',v_confidence,'route',v_route,
    'domains',jsonb_build_object(
      'recovery',jsonb_build_object('action',v_recovery_action,'latest',v_latest_recovery,'previous',v_prev_recovery),
      'schedule',jsonb_build_object('action',v_schedule_action,'training_adherence_entries',v_train_entries,'training_low_count',v_train_low),
      'nutrition',jsonb_build_object('action',v_nutrition_action,'weight_entries',v_weight_entries,'nutrition_adherence_entries',v_nutri_entries,'nutrition_high_count',v_nutri_high,'nutrition_low_count',v_nutri_low),
      'volume',jsonb_build_object('action',v_volume_action,'evidence',v_metrics->'muscle_dose_response'),
      'exercise',jsonb_build_object('replacement_checks',v_exercise_checks)
    ),
    'blocked_auto_reasons',v_blocked,'program_change_authorized',false
  );
end;
$function$;

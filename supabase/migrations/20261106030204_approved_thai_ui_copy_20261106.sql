-- Approved Thai UI copy only. Preserve function signatures, security and logic.
DO $copy_guard$ BEGIN IF md5(pg_get_functiondef('private.publish_auto_adapt_consult_report_v1(uuid,uuid,jsonb,date)'::regprocedure)) <> '8d1bfb39bd573ee4685f620a1469d5f0' THEN RAISE EXCEPTION 'Function changed since copy review: publish_auto_adapt_consult_report_v1'; END IF; END $copy_guard$;
CREATE OR REPLACE FUNCTION private.publish_auto_adapt_consult_report_v1(p_snapshot_id uuid, p_analysis_id uuid, p_execution jsonb, p_next_review_date date)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
    v_nutrition_review := case when v_delta<0 then 'เป้าหมายพลังงานลดลง ' else 'เป้าหมายพลังงานเพิ่มขึ้น ' end || v_abs_delta || ' กิโลแคลอรี/วัน ตามเกณฑ์ที่กำหนด';
    v_program_update := 'สร้างโปรแกรมเวอร์ชันใหม่โดยปรับเป้าหมายอาหาร ' || v_abs_delta || ' กิโลแคลอรี/วัน';
  elsif v_domain='VOLUME' and v_action='ADD_WEEKLY_SET' then
    v_what_changed := 'เพิ่มปริมาณฝึก 1 เซตในท่าที่ผ่านเกณฑ์ตอบสนองจริง'; v_training_review := 'ปรับเฉพาะท่าเป้าหมาย 1 เซต ส่วนอื่นของโปรแกรมคงเดิม'; v_nutrition_review := 'เป้าหมายโภชนาการคงเดิม'; v_program_update := 'สร้างโปรแกรมเวอร์ชันใหม่โดยเพิ่ม 1 เซตในท่าเป้าหมาย';
  elsif v_domain='EXERCISE' and v_action='REPLACE_EXERCISE' then
    v_what_changed := 'เปลี่ยนท่าฝึก 1 ท่าตามผลตอบสนองจริงและตัวเลือกที่ยืนยันว่าเหมาะ'; v_training_review := 'เปลี่ยนเฉพาะท่าเป้าหมาย 1 จุด ส่วนอื่นของโปรแกรมคงเดิม'; v_nutrition_review := 'เป้าหมายโภชนาการคงเดิม'; v_program_update := 'สร้างโปรแกรมเวอร์ชันใหม่โดยเปลี่ยนท่าเป้าหมาย 1 ท่า';
  else raise exception 'UNSUPPORTED_AUTO_REPORT_ACTION'; end if;

  insert into public.consult_reports(user_id,cycle_key,period_start,period_end,overall_status,what_changed,training_review,nutrition_review,lab_context,professional_assessment,program_update,next_actions,monitor_items,next_review_date,report_status,published_at,source_review_id)
  values(v_user_id,v_cycle_key,v_period_start,v_period_end,'ADAPT',v_what_changed,v_training_review,v_nutrition_review,
    'ใช้ LAB เป็นข้อมูลประกอบ และปรับเมื่อผลฝึกจริงของท่าเป้าหมายผ่านเกณฑ์ที่กำหนด','ระบบปรับทีละอย่างและสร้างโปรแกรมเวอร์ชันใหม่ เพื่อเก็บประวัติเวอร์ชันเดิมไว้',v_program_update,
    jsonb_build_array('ใช้ โปรแกรมเวอร์ชัน ใหม่ต่อ','บันทึกผลการฝึกและการฟื้นตัวตามปกติ'),jsonb_build_array('performance','recovery','exercise tolerance','body-weight trend'),p_next_review_date,'PUBLISHED',now(),null)
  returning report_id into v_report_id;
  return v_report_id;
end;
$function$;

DO $copy_guard$ BEGIN IF md5(pg_get_functiondef('private.run_due_pro_reviews(integer)'::regprocedure)) <> '676dc791b559ec0827a8339424a3ca43' THEN RAISE EXCEPTION 'Function changed since copy review: run_due_pro_reviews'; END IF; END $copy_guard$;
CREATE OR REPLACE FUNCTION private.run_due_pro_reviews(p_limit integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  r record;
  v_period_start date;
  v_period_end date;
  v_progress_count integer;
  v_workout_count integer;
  v_confidence text;
  v_snapshot_id uuid;
  v_metrics jsonb;
  v_policy_v5 jsonb;
  v_screen jsonb;
  v_analysis_id uuid;
  v_report_id uuid;
  v_exception boolean;
  v_new_issue_count integer;
  v_pain_count integer;
  v_discomfort_count integer;
  v_processed integer := 0;
  v_kept integer := 0;
  v_exceptions integer := 0;
  v_errors integer := 0;
  v_cycle_key text;
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 then
    raise exception 'INVALID_REVIEW_BATCH_LIMIT';
  end if;

  if not pg_catalog.pg_try_advisory_xact_lock(2609161401::bigint) then
    return jsonb_build_object('status','SKIPPED_LOCKED','processed',0);
  end if;

  for r in
    select pp.user_id,pp.next_review_at,pp.last_review_at,ua.pro_active_since
    from public.pro_profiles pp
    join public.user_access ua on ua.user_id=pp.user_id
    where ua.tier='PRO'
      and pp.next_review_at is not null
      and pp.next_review_at <= now()
      and not exists (
        select 1 from private.review_queue rq
        where rq.user_id=pp.user_id
          and rq.status in ('PENDING','SCHEDULED','REVIEWING','NEEDS_INFO')
      )
    order by pp.next_review_at asc
    limit p_limit
    for update of pp skip locked
  loop
    begin
      v_processed := v_processed + 1;
      v_period_end := timezone('Asia/Bangkok',now())::date;
      v_period_start := case
        when r.last_review_at is not null then greatest((timezone('Asia/Bangkok',r.last_review_at)::date + 1), v_period_end - 27)
        else greatest(timezone('Asia/Bangkok',coalesce(r.pro_active_since,now()))::date, v_period_end - 13)
      end;
      if v_period_start > v_period_end then v_period_start := v_period_end; end if;

      select count(*) into v_progress_count
      from public.progress_entries pe
      where pe.user_id=r.user_id and pe.entry_date between v_period_start and v_period_end;

      select count(*) into v_workout_count
      from private.workout_exercise_logs wl
      where wl.user_id=r.user_id and wl.entry_date between v_period_start and v_period_end;

      v_confidence := case
        when v_progress_count + v_workout_count >= 3 then 'SUFFICIENT'
        when v_progress_count + v_workout_count >= 1 then 'PARTIAL'
        else 'LIMITED'
      end;

      v_cycle_key := 'AUTO_' || to_char(timezone('Asia/Bangkok',now()),'YYYYMMDD_HH24MISS') || '_' || substr(replace(r.user_id::text,'-',''),1,8);

      v_snapshot_id := private.build_pro_consult_snapshot(
        r.user_id,v_cycle_key,v_period_start,v_period_end,v_confidence,'{}'::jsonb
      );

      select cs.progress_metrics into v_metrics
      from private.consult_snapshots cs where cs.snapshot_id=v_snapshot_id;

      v_policy_v5 := private.evaluate_pro_policy_shadow_v5(v_snapshot_id);

      v_new_issue_count := coalesce((v_metrics->>'new_issue_count')::integer,0);
      select count(*) filter (where x->>'issue_status'='PAIN'),
             count(*) filter (where x->>'issue_status'='DISCOMFORT')
      into v_pain_count,v_discomfort_count
      from jsonb_array_elements(coalesce(v_metrics->'recent_workout_evidence','[]'::jsonb)) x;

      v_exception := v_new_issue_count > 0 or v_pain_count > 0 or v_discomfort_count >= 2;

      if v_exception then
        v_screen := private.persist_consult_screening(
          v_snapshot_id,r.user_id,
          'EXCEPTION',
          jsonb_build_object(
            'decision','EXCEPTION','data_confidence',v_confidence,
            'new_issue_count',v_new_issue_count,'pain_count',v_pain_count,'discomfort_count',v_discomfort_count,
            'shadow_policy_version',v_policy_v5->>'policy_version','shadow_route',v_policy_v5->>'route'
          ),
          jsonb_build_object(
            'action','HUMAN_EXCEPTION_REVIEW','program_change_authorized',false,
            'shadow_policy',v_policy_v5
          ),
          true,
          jsonb_build_array('PAIN_OR_REPEATED_ISSUE_SIGNAL'),
          false,null,
          'MATERIAL_PROBLEM','HIGH','PENDING'
        );

        update public.pro_profiles
        set activation_assessed_at=coalesce(activation_assessed_at,now()),
            last_review_at=now(),
            next_review_at=now()+interval '14 days',
            review_state='EXCEPTION_OPEN',
            review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object(
              'last_cycle_key',v_cycle_key,'last_route','EXCEPTION','last_snapshot_id',v_snapshot_id,
              'shadow_policy_version',v_policy_v5->>'policy_version','shadow_route',v_policy_v5->>'route',
              'shadow_selected_proposal',v_policy_v5->'selected_proposal','updated_at',now()
            ),
            updated_at=now()
        where user_id=r.user_id;
        v_exceptions := v_exceptions + 1;
      else
        v_screen := private.persist_consult_screening(
          v_snapshot_id,r.user_id,
          'KEEP',
          jsonb_build_object(
            'decision','KEEP','data_confidence',v_confidence,
            'reason',case when v_confidence='LIMITED' then 'INSUFFICIENT_DATA_FOR_MATERIAL_CHANGE' else 'NO_MATERIAL_EXCEPTION_SIGNAL' end,
            'shadow_policy_version',v_policy_v5->>'policy_version','shadow_route',v_policy_v5->>'route'
          ),
          jsonb_build_object(
            'action','KEEP','program_change_authorized',false,
            'shadow_policy',v_policy_v5
          ),
          false,'[]'::jsonb,false,null,null,null,null
        );
        v_analysis_id := (v_screen->>'analysis_id')::uuid;

        v_report_id := private.publish_routine_consult_report(
          v_snapshot_id,v_analysis_id,
          case when v_confidence='LIMITED' then 'ข้อมูลยังไม่พอให้ปรับโปรแกรม' else 'โปรแกรม ยังเหมาะสม' end,
          case when v_confidence='LIMITED' then 'รอบนี้ยังมีข้อมูลไม่พอสำหรับปรับโปรแกรม' else 'รอบนี้ยังไม่พบเหตุผลสำคัญที่ต้องเปลี่ยนโปรแกรม' end,
          'ใช้โปรแกรมปัจจุบันต่อ พร้อมติดตามผลฝึก การคุมท่า ความสบายขณะฝึก และการฟื้นตัว',
          'คงเป้าหมายอาหารเดิม จนกว่าจะมีแนวโน้มและข้อมูลการทำตามแผนเพียงพอสำหรับพิจารณาปรับ',
          'ใช้ LAB เป็นข้อมูลประกอบ โดยไม่เปลี่ยนโปรแกรมโดยตรง',
          'รอบนี้ยังไม่มีเหตุผลพอให้เปลี่ยนแผนหลัก',
          null,
          jsonb_build_array('ทำ โปรแกรมปัจจุบันต่อ','บันทึกผลการฝึกและการฟื้นตัวตามปกติ'),
          jsonb_build_array('performance','recovery','exercise tolerance','body-weight trend'),
          (v_period_end + 14)
        );

        update public.pro_profiles
        set activation_assessed_at=coalesce(activation_assessed_at,now()),
            last_review_at=now(),
            next_review_at=now()+interval '14 days',
            review_state='ACTIVE',
            review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object(
              'last_cycle_key',v_cycle_key,'last_route','KEEP','last_snapshot_id',v_snapshot_id,
              'last_report_id',v_report_id,'data_confidence',v_confidence,
              'shadow_policy_version',v_policy_v5->>'policy_version','shadow_route',v_policy_v5->>'route',
              'shadow_selected_proposal',v_policy_v5->'selected_proposal','updated_at',now()
            ),
            updated_at=now()
        where user_id=r.user_id;
        v_kept := v_kept + 1;
      end if;
    exception when others then
      v_errors := v_errors + 1;
      update public.pro_profiles
      set review_state='ERROR',
          next_review_at=now()+interval '1 hour',
          review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_error',sqlerrm,'error_at',now()),
          updated_at=now()
      where user_id=r.user_id;
    end;
  end loop;

  return jsonb_build_object('status','OK','processed',v_processed,'keep',v_kept,'exceptions',v_exceptions,'errors',v_errors,'shadow_policy_version','PRO_CENTRAL_POLICY_SHADOW_V5');
end;
$function$;

DO $copy_guard$ BEGIN IF md5(pg_get_functiondef('private.run_due_pro_reviews_v2(integer)'::regprocedure)) <> '00d1aa36c6bbe08cf82a9813290f73fa' THEN RAISE EXCEPTION 'Function changed since copy review: run_due_pro_reviews_v2'; END IF; END $copy_guard$;
CREATE OR REPLACE FUNCTION private.run_due_pro_reviews_v2(p_limit integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  r record; v_period_start date; v_period_end date; v_progress_count integer; v_workout_count integer; v_confidence text;
  v_snapshot_id uuid; v_metrics jsonb; v_policy jsonb; v_screen jsonb; v_analysis_id uuid; v_report_id uuid;
  v_exception boolean; v_new_issue_count integer; v_pain_count integer; v_discomfort_count integer;
  v_processed integer:=0; v_kept integer:=0; v_exceptions integer:=0; v_reviews integer:=0; v_autowrites integer:=0; v_guidance integer:=0; v_errors integer:=0;
  v_cycle_key text; v_policy_route text; v_selected_domain text; v_selected_action text; v_execution jsonb; v_review_trigger text; v_review_priority text;
begin
  if p_limit is null or p_limit<1 or p_limit>500 then raise exception 'INVALID_REVIEW_BATCH_LIMIT'; end if;
  if not pg_catalog.pg_try_advisory_xact_lock(2609171501::bigint) then return jsonb_build_object('status','SKIPPED_LOCKED','processed',0); end if;
  for r in
    select pp.user_id,pp.next_review_at,pp.last_review_at,ua.pro_active_since
    from public.pro_profiles pp join public.user_access ua on ua.user_id=pp.user_id
    where ua.tier='PRO' and pp.next_review_at is not null and pp.next_review_at<=now()
      and not exists (select 1 from private.review_queue rq where rq.user_id=pp.user_id and rq.status in ('PENDING','SCHEDULED','REVIEWING','NEEDS_INFO'))
    order by pp.next_review_at asc limit p_limit for update of pp skip locked
  loop
    begin
      v_processed:=v_processed+1;
      v_period_end:=timezone('Asia/Bangkok',now())::date;
      v_period_start:=case when r.last_review_at is not null then greatest((timezone('Asia/Bangkok',r.last_review_at)::date+1),v_period_end-27) else greatest(timezone('Asia/Bangkok',coalesce(r.pro_active_since,now()))::date,v_period_end-13) end;
      if v_period_start>v_period_end then v_period_start:=v_period_end; end if;
      select count(*) into v_progress_count from public.progress_entries pe where pe.user_id=r.user_id and pe.entry_date between v_period_start and v_period_end;
      select count(*) into v_workout_count from private.workout_exercise_logs wl where wl.user_id=r.user_id and wl.entry_date between v_period_start and v_period_end;
      v_confidence:=case when v_progress_count+v_workout_count>=3 then 'SUFFICIENT' when v_progress_count+v_workout_count>=1 then 'PARTIAL' else 'LIMITED' end;
      v_cycle_key:='AUTO_'||to_char(timezone('Asia/Bangkok',now()),'YYYYMMDD_HH24MISS')||'_'||substr(replace(r.user_id::text,'-',''),1,8);
      v_snapshot_id:=private.build_pro_consult_snapshot(r.user_id,v_cycle_key,v_period_start,v_period_end,v_confidence,'{}'::jsonb);
      select cs.progress_metrics into v_metrics from private.consult_snapshots cs where cs.snapshot_id=v_snapshot_id;
      v_policy:=private.evaluate_pro_policy_shadow_v5(v_snapshot_id);
      v_policy_route:=coalesce(v_policy->>'route','KEEP'); v_selected_domain:=coalesce(v_policy->'selected_proposal'->>'domain',''); v_selected_action:=coalesce(v_policy->'selected_proposal'->>'action','');
      v_new_issue_count:=coalesce((v_metrics->>'new_issue_count')::integer,0);
      select count(*) filter(where x->>'issue_status'='PAIN'),count(*) filter(where x->>'issue_status'='DISCOMFORT') into v_pain_count,v_discomfort_count from jsonb_array_elements(coalesce(v_metrics->'recent_workout_evidence','[]'::jsonb)) x;
      v_exception:=v_new_issue_count>0 or v_pain_count>0 or v_discomfort_count>=2;

      if v_exception or v_policy_route='EXCEPTION' then
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'EXCEPTION',jsonb_build_object('decision','EXCEPTION','data_confidence',v_confidence,'new_issue_count',v_new_issue_count,'pain_count',v_pain_count,'discomfort_count',v_discomfort_count,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route),jsonb_build_object('action','HUMAN_EXCEPTION_REVIEW','program_change_authorized',false,'policy',v_policy),true,jsonb_build_array('PAIN_OR_REPEATED_ISSUE_SIGNAL'),false,null,'MATERIAL_PROBLEM','HIGH','PENDING');
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='EXCEPTION_OPEN',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','EXCEPTION','last_snapshot_id',v_snapshot_id,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route,'selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_exceptions:=v_exceptions+1;
      elsif v_policy_route in ('REVIEW_CANDIDATE','REVIEW_AMBIGUOUS') then
        v_review_trigger:=case when v_policy_route='REVIEW_AMBIGUOUS' then 'CONFLICTING_SIGNALS' else 'PROGRAM_CHANGE_REQUIRES_JUDGMENT' end;
        v_review_priority:=case when v_policy_route='REVIEW_AMBIGUOUS' then 'HIGH' else 'NORMAL' end;
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'REVIEW_REQUIRED',jsonb_build_object('decision',v_policy_route,'data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','review_candidates',v_policy->'review_candidates'),jsonb_build_object('action','HUMAN_REVIEW','program_change_authorized',false,'policy',v_policy),true,jsonb_build_array(v_policy_route),false,null,v_review_trigger,v_review_priority,'PENDING');
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='REVIEW_OPEN',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route',v_policy_route,'last_snapshot_id',v_snapshot_id,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_reviews:=v_reviews+1;
      elsif v_policy_route='AUTO_CANDIDATE_SHADOW' and v_selected_domain in ('NUTRITION','VOLUME','EXERCISE') then
        v_execution:=private.execute_pro_policy_autowrite_v1(v_snapshot_id);
        if coalesce((v_execution->>'applied')::boolean,false) then
          v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'AUTO_ADAPTED',jsonb_build_object('decision','AUTO_WRITE_APPLIED','data_confidence',v_confidence,'domain',v_execution->>'domain','action',v_execution->>'action','previous_program_id',v_execution->>'previous_program_id','new_program_id',v_execution->>'new_program_id','new_program_version',v_execution->>'new_program_version','policy_version',v_policy->>'policy_version'),jsonb_build_object('action','AUTO_WRITE_APPLIED','program_change_authorized',true,'execution',v_execution),false,'[]'::jsonb,false,null,null,null,null);
          v_analysis_id:=(v_screen->>'analysis_id')::uuid;
          v_report_id:=private.publish_auto_adapt_consult_report_v1(v_snapshot_id,v_analysis_id,v_execution,(v_period_end+14));
          update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='ACTIVE',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','AUTO_WRITE_APPLIED','last_snapshot_id',v_snapshot_id,'last_report_id',v_report_id,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','execution',v_execution,'updated_at',now()),updated_at=now() where user_id=r.user_id;
          v_autowrites:=v_autowrites+1;
        else
          v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'REVIEW_REQUIRED',jsonb_build_object('decision','AUTO_WRITE_BLOCKED','data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','execution',v_execution),jsonb_build_object('action','HUMAN_REVIEW_AFTER_AUTOWRITE_BLOCK','program_change_authorized',false,'policy',v_policy,'execution',v_execution),true,jsonb_build_array('AUTO_WRITE_REVALIDATION_BLOCKED'),false,null,'CONFLICTING_SIGNALS','HIGH','PENDING');
          update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='REVIEW_OPEN',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','AUTO_WRITE_BLOCKED','last_snapshot_id',v_snapshot_id,'policy_version',v_policy->>'policy_version','execution',v_execution,'updated_at',now()),updated_at=now() where user_id=r.user_id;
          v_reviews:=v_reviews+1;
        end if;
      elsif v_policy_route='AUTO_CANDIDATE_SHADOW' and v_selected_domain='RECOVERY' and v_selected_action in ('HOLD_PROGRESSION','TEMP_DELOAD') then
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'GUIDANCE',jsonb_build_object('decision',v_selected_action,'data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal'),jsonb_build_object('action',v_selected_action,'program_change_authorized',false,'policy',v_policy),false,'[]'::jsonb,false,null,null,null,null);
        v_analysis_id:=(v_screen->>'analysis_id')::uuid;
        v_report_id:=private.publish_routine_consult_report(v_snapshot_id,v_analysis_id,'MONITOR',case when v_selected_action='TEMP_DELOAD' then 'มีสัญญาณฟื้นตัวไม่ดีต่อเนื่อง จึงแนะนำให้ลดภาระฝึกชั่วคราว โดยยังใช้โปรแกรมหลักเดิม' else 'มีสัญญาณฟื้นตัวไม่ดี จึงแนะนำให้หยุดเพิ่มความหนักชั่วคราว' end,case when v_selected_action='TEMP_DELOAD' then 'ลดภาระฝึกชั่วคราว แล้วติดตามการฟื้นตัวและผลฝึก ก่อนพิจารณาเปลี่ยนโปรแกรมหลัก' else 'คงน้ำหนักที่ยกและยังไม่เพิ่มความหนักจนกว่าจะฟื้นตัวดีขึ้น' end,'เป้าหมายโภชนาการคงเดิม','LAB ไม่ได้เปลี่ยน โปรแกรม โดยตรง','คำแนะนำชั่วคราว โปรแกรมหลักยังเหมือนเดิม',null,jsonb_build_array('ทำตามคำแนะนำการฟื้นตัวชั่วคราว','บันทึกผลการฝึกและการฟื้นตัว'),jsonb_build_array('recovery','performance','control'),(v_period_end+14));
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='ACTIVE',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','GUIDANCE','last_snapshot_id',v_snapshot_id,'last_report_id',v_report_id,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_guidance:=v_guidance+1;
      else
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'KEEP',jsonb_build_object('decision','KEEP','data_confidence',v_confidence,'reason',case when v_confidence='LIMITED' then 'INSUFFICIENT_DATA_FOR_MATERIAL_CHANGE' else 'NO_MATERIAL_CHANGE_SIGNAL' end,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route),jsonb_build_object('action','KEEP','program_change_authorized',false,'policy',v_policy),false,'[]'::jsonb,false,null,null,null,null);
        v_analysis_id:=(v_screen->>'analysis_id')::uuid;
        v_report_id:=private.publish_routine_consult_report(v_snapshot_id,v_analysis_id,case when v_confidence='LIMITED' then 'ข้อมูลยังไม่พอให้ปรับโปรแกรม' else 'โปรแกรม ยังเหมาะสม' end,case when v_confidence='LIMITED' then 'รอบนี้ยังมีข้อมูลไม่พอสำหรับปรับโปรแกรม' else 'รอบนี้ยังไม่พบเหตุผลสำคัญที่ต้องเปลี่ยนโปรแกรม' end,'ใช้โปรแกรมปัจจุบันต่อ พร้อมติดตามผลฝึก การคุมท่า ความสบายขณะฝึก และการฟื้นตัว','คงเป้าหมายอาหารเดิม จนกว่าจะมีแนวโน้มและข้อมูลการทำตามแผนเพียงพอสำหรับพิจารณาปรับ','ใช้ LAB เป็นข้อมูลประกอบ โดยไม่เปลี่ยนโปรแกรมโดยตรง','รอบนี้ยังไม่มีเหตุผลพอให้เปลี่ยนแผนหลัก',null,jsonb_build_array('ทำ โปรแกรมปัจจุบันต่อ','บันทึกผลการฝึกและการฟื้นตัวตามปกติ'),jsonb_build_array('performance','recovery','exercise tolerance','body-weight trend'),(v_period_end+14));
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='ACTIVE',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','KEEP','last_snapshot_id',v_snapshot_id,'last_report_id',v_report_id,'data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route,'selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_kept:=v_kept+1;
      end if;
    exception when others then
      v_errors:=v_errors+1;
      update public.pro_profiles set review_state='ERROR',next_review_at=now()+interval '1 hour',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_error',sqlerrm,'error_at',now()),updated_at=now() where user_id=r.user_id;
    end;
  end loop;
  return jsonb_build_object('status','OK','processed',v_processed,'keep',v_kept,'exceptions',v_exceptions,'reviews',v_reviews,'autowrites',v_autowrites,'guidance',v_guidance,'errors',v_errors,'policy_version','PRO_CENTRAL_POLICY_SHADOW_V5','execution_version','PRO_AUTOWRITE_V1');
end;
$function$;


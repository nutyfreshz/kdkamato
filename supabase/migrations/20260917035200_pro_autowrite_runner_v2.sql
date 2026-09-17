create or replace function private.run_due_pro_reviews_v2(p_limit integer default 100)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  r record;
  v_period_start date;
  v_period_end date;
  v_progress_count integer;
  v_workout_count integer;
  v_confidence text;
  v_snapshot_id uuid;
  v_metrics jsonb;
  v_policy jsonb;
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
  v_reviews integer := 0;
  v_autowrites integer := 0;
  v_guidance integer := 0;
  v_errors integer := 0;
  v_cycle_key text;
  v_policy_route text;
  v_selected_domain text;
  v_selected_action text;
  v_execution jsonb;
  v_review_trigger text;
  v_review_priority text;
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 then raise exception 'INVALID_REVIEW_BATCH_LIMIT'; end if;
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
      v_policy_route:=coalesce(v_policy->>'route','KEEP');
      v_selected_domain:=coalesce(v_policy->'selected_proposal'->>'domain','');
      v_selected_action:=coalesce(v_policy->'selected_proposal'->>'action','');

      v_new_issue_count:=coalesce((v_metrics->>'new_issue_count')::integer,0);
      select count(*) filter(where x->>'issue_status'='PAIN'),count(*) filter(where x->>'issue_status'='DISCOMFORT')
      into v_pain_count,v_discomfort_count from jsonb_array_elements(coalesce(v_metrics->'recent_workout_evidence','[]'::jsonb)) x;
      v_exception:=v_new_issue_count>0 or v_pain_count>0 or v_discomfort_count>=2;

      if v_exception or v_policy_route='EXCEPTION' then
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'EXCEPTION',
          jsonb_build_object('decision','EXCEPTION','data_confidence',v_confidence,'new_issue_count',v_new_issue_count,'pain_count',v_pain_count,'discomfort_count',v_discomfort_count,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route),
          jsonb_build_object('action','HUMAN_EXCEPTION_REVIEW','program_change_authorized',false,'policy',v_policy),
          true,jsonb_build_array('PAIN_OR_REPEATED_ISSUE_SIGNAL'),false,null,'MATERIAL_PROBLEM','HIGH','PENDING');
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='EXCEPTION_OPEN',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','EXCEPTION','last_snapshot_id',v_snapshot_id,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route,'selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_exceptions:=v_exceptions+1;

      elsif v_policy_route in ('REVIEW_CANDIDATE','REVIEW_AMBIGUOUS') then
        v_review_trigger:=case when v_policy_route='REVIEW_AMBIGUOUS' then 'CONFLICTING_SIGNALS' else 'PROGRAM_CHANGE_REQUIRES_JUDGMENT' end;
        v_review_priority:=case when v_policy_route='REVIEW_AMBIGUOUS' then 'HIGH' else 'NORMAL' end;
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'REVIEW_REQUIRED',
          jsonb_build_object('decision',v_policy_route,'data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','review_candidates',v_policy->'review_candidates'),
          jsonb_build_object('action','HUMAN_REVIEW','program_change_authorized',false,'policy',v_policy),
          true,jsonb_build_array(v_policy_route),false,null,v_review_trigger,v_review_priority,'PENDING');
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='REVIEW_OPEN',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route',v_policy_route,'last_snapshot_id',v_snapshot_id,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_reviews:=v_reviews+1;

      elsif v_policy_route='AUTO_CANDIDATE_SHADOW' and v_selected_domain in ('NUTRITION','VOLUME','EXERCISE') then
        v_execution:=private.execute_pro_policy_autowrite_v1(v_snapshot_id);
        if coalesce((v_execution->>'applied')::boolean,false) then
          v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'AUTO_ADAPTED',
            jsonb_build_object('decision','AUTO_WRITE_APPLIED','data_confidence',v_confidence,'domain',v_execution->>'domain','action',v_execution->>'action','previous_program_id',v_execution->>'previous_program_id','new_program_id',v_execution->>'new_program_id','new_program_version',v_execution->>'new_program_version','policy_version',v_policy->>'policy_version'),
            jsonb_build_object('action','AUTO_WRITE_APPLIED','program_change_authorized',true,'execution',v_execution),
            false,'[]'::jsonb,false,null,null,null,null);
          v_analysis_id:=(v_screen->>'analysis_id')::uuid;
          v_report_id:=private.publish_auto_adapt_consult_report_v1(v_snapshot_id,v_analysis_id,v_execution,(v_period_end+14));
          update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='ACTIVE',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','AUTO_WRITE_APPLIED','last_snapshot_id',v_snapshot_id,'last_report_id',v_report_id,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','execution',v_execution,'updated_at',now()),updated_at=now() where user_id=r.user_id;
          v_autowrites:=v_autowrites+1;
        else
          v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'REVIEW_REQUIRED',
            jsonb_build_object('decision','AUTO_WRITE_BLOCKED','data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','execution',v_execution),
            jsonb_build_object('action','HUMAN_REVIEW_AFTER_AUTOWRITE_BLOCK','program_change_authorized',false,'policy',v_policy,'execution',v_execution),
            true,jsonb_build_array('AUTO_WRITE_REVALIDATION_BLOCKED'),false,null,'CONFLICTING_SIGNALS','HIGH','PENDING');
          update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='REVIEW_OPEN',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','AUTO_WRITE_BLOCKED','last_snapshot_id',v_snapshot_id,'policy_version',v_policy->>'policy_version','execution',v_execution,'updated_at',now()),updated_at=now() where user_id=r.user_id;
          v_reviews:=v_reviews+1;
        end if;

      elsif v_policy_route='AUTO_CANDIDATE_SHADOW' and v_selected_domain='RECOVERY' and v_selected_action in ('HOLD_PROGRESSION','TEMP_DELOAD') then
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'GUIDANCE',
          jsonb_build_object('decision',v_selected_action,'data_confidence',v_confidence,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal),
          jsonb_build_object('action',v_selected_action,'program_change_authorized',false,'policy',v_policy),false,'[]'::jsonb,false,null,null,null,null);
        v_analysis_id:=(v_screen->>'analysis_id')::uuid;
        v_report_id:=private.publish_routine_consult_report(v_snapshot_id,v_analysis_id,'MONITOR',
          case when v_selected_action='TEMP_DELOAD' then 'พบสัญญาณฟื้นตัวแย่ต่อเนื่อง จึงลดความเครียดชั่วคราวโดยยังไม่เปลี่ยน Program ฐาน' else 'พบสัญญาณฟื้นตัวแย่ จึงพักการเพิ่มความหนักชั่วคราว' end,
          case when v_selected_action='TEMP_DELOAD' then 'ลดความเครียดชั่วคราวและติดตาม recovery/performance ก่อนตัดสินใจเปลี่ยนฐาน Program' else 'คงน้ำหนัก/ความก้าวหน้าไว้ก่อนจน recovery ดีขึ้น' end,
          'เป้าหมายโภชนาการคงเดิม','LAB ไม่ได้เปลี่ยน Program โดยตรง','เป็นคำแนะนำชั่วคราว ไม่ใช่การแก้ Program ฐาน',null,
          jsonb_build_array('ทำตามคำแนะนำ recovery ชั่วคราว','บันทึกผลการฝึกและการฟื้นตัว'),jsonb_build_array('recovery','performance','control'),(v_period_end+14));
        update public.pro_profiles set activation_assessed_at=coalesce(activation_assessed_at,now()),last_review_at=now(),next_review_at=now()+interval '14 days',review_state='ACTIVE',review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('last_cycle_key',v_cycle_key,'last_route','GUIDANCE','last_snapshot_id',v_snapshot_id,'last_report_id',v_report_id,'policy_version',v_policy->>'policy_version','selected_proposal',v_policy->'selected_proposal','updated_at',now()),updated_at=now() where user_id=r.user_id;
        v_guidance:=v_guidance+1;

      else
        v_screen:=private.persist_consult_screening(v_snapshot_id,r.user_id,'KEEP',
          jsonb_build_object('decision','KEEP','data_confidence',v_confidence,'reason',case when v_confidence='LIMITED' then 'INSUFFICIENT_DATA_FOR_MATERIAL_CHANGE' else 'NO_MATERIAL_CHANGE_SIGNAL' end,'policy_version',v_policy->>'policy_version','policy_route',v_policy_route),
          jsonb_build_object('action','KEEP','program_change_authorized',false,'policy',v_policy),false,'[]'::jsonb,false,null,null,null,null);
        v_analysis_id:=(v_screen->>'analysis_id')::uuid;
        v_report_id:=private.publish_routine_consult_report(v_snapshot_id,v_analysis_id,
          case when v_confidence='LIMITED' then 'ข้อมูลยังไม่พอสำหรับปรับ Program' else 'Program ยังเหมาะสม' end,
          case when v_confidence='LIMITED' then 'รอบนี้ยังมีข้อมูลไม่พอสำหรับการเปลี่ยน Program อย่างมีเหตุผล' else 'ยังไม่พบสัญญาณสำคัญที่ทำให้ต้องเปลี่ยน Program ในรอบนี้' end,
          'ใช้ Program ปัจจุบันต่อและติดตาม performance, control, tolerance และ recovery ตามข้อมูลจริง','คงเป้าหมาย Nutrition ปัจจุบันไว้จนกว่าจะมีแนวโน้มและ adherence เพียงพอสำหรับการตัดสินใจ','LAB ใช้เป็นข้อมูลประกอบและไม่เปลี่ยน Program โดยตรง','รอบนี้ยังไม่มีเหตุผลพอสำหรับการเปลี่ยน Program ระดับ material',null,
          jsonb_build_array('ทำ Program ปัจจุบันต่อ','บันทึกผลการฝึกและการฟื้นตัวตามปกติ'),jsonb_build_array('performance','recovery','exercise tolerance','body-weight trend'),(v_period_end+14));
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

revoke all on function private.run_due_pro_reviews_v2(integer) from public, anon, authenticated;
grant execute on function private.run_due_pro_reviews_v2(integer) to service_role;

select cron.schedule('kdk-pro-review-runner-hourly','7 * * * *',$$select private.run_due_pro_reviews_v2(100);$$);

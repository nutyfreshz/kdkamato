create or replace function private.execute_pro_policy_autowrite_v1(p_snapshot_id uuid)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_snapshot_program_id uuid;
  v_current_program_id uuid;
  v_current_version integer;
  v_new_program_id uuid;
  v_new_version integer;
  v_goal_snapshot jsonb;
  v_gate jsonb;
  v_selected jsonb;
  v_domain text;
  v_action text;
  v_target_item_id uuid;
  v_candidate_exercise text;
  v_delta integer;
  v_decision_id uuid;
  v_live_item record;
  v_live_target jsonb;
  v_reason text := 'PRO_POLICY_V5_EXACT_GATE_AUTOWRITE';
  v_decision_type text;
begin
  select cs.user_id,
         nullif(cs.program_snapshot->'active_program'->>'program_id','')::uuid
  into v_user_id,v_snapshot_program_id
  from private.consult_snapshots cs
  where cs.snapshot_id=p_snapshot_id;

  if v_user_id is null or v_snapshot_program_id is null then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_SNAPSHOT_PROGRAM_MISSING','applied',false);
  end if;

  perform 1 from public.user_access ua where ua.user_id=v_user_id and ua.tier='PRO' for update;
  if not found then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_ACTIVE_PRO_REQUIRED','applied',false);
  end if;

  select p.program_id,p.program_version,p.goal_snapshot
  into v_current_program_id,v_current_version,v_goal_snapshot
  from public.programs p
  where p.user_id=v_user_id and p.status='ACTIVE'
  order by p.program_version desc limit 1 for update;

  if v_current_program_id is null then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_ACTIVE_PROGRAM_REQUIRED','applied',false);
  end if;
  if v_current_program_id is distinct from v_snapshot_program_id then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_SNAPSHOT_PROGRAM_STALE','snapshot_program_id',v_snapshot_program_id,'current_program_id',v_current_program_id,'applied',false);
  end if;

  if exists (
    select 1 from private.program_decisions d
    where d.user_id=v_user_id and d.review_id is null and d.decision_type like 'PRO_AUTO_%'
      and d.previous_value->>'snapshot_id'=p_snapshot_id::text and d.program_id is not null
  ) then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','ALREADY_APPLIED','snapshot_id',p_snapshot_id,'applied',false);
  end if;

  v_gate := private.validate_pro_policy_execution_v2(p_snapshot_id);
  if coalesce((v_gate->>'execution_authorized')::boolean,false) is not true
     or coalesce((v_gate->>'program_write_authorized')::boolean,false) is not true
     or coalesce(v_gate->>'route','') <> 'EXECUTION_READY' then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_EXECUTION_GATE','gate',v_gate,'applied',false);
  end if;

  v_selected := v_gate->'selected_proposal';
  v_domain := v_gate->>'domain';
  v_action := v_gate->>'action';

  if (v_domain,v_action) not in (('NUTRITION','ADJUST_CALORIES'),('VOLUME','ADD_WEEKLY_SET'),('EXERCISE','REPLACE_EXERCISE')) then
    return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_UNSUPPORTED_AUTOWRITE_ACTION','domain',v_domain,'action',v_action,'applied',false);
  end if;

  if v_domain='NUTRITION' then
    v_delta := (v_selected->'proposed_change'->>'delta_kcal_per_day')::integer;
    select jsonb_build_object('calorie_low',nt.calorie_low,'calorie_high',nt.calorie_high)
      into v_live_target from public.nutrition_targets nt where nt.program_id=v_current_program_id for update;
    if v_live_target is distinct from v_gate->'revalidation'->'current_target' then
      return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_LIVE_NUTRITION_TARGET_DRIFT','live_target',v_live_target,'expected_current_target',v_gate->'revalidation'->'current_target','applied',false);
    end if;
    v_decision_type := 'PRO_AUTO_NUTRITION';
  elsif v_domain='VOLUME' then
    v_target_item_id := nullif(v_gate->>'target_item_id','')::uuid;
    select t.item_id,t.program_id,t.exercise_key,t.sets into v_live_item
    from public.training_program_items t where t.item_id=v_target_item_id for update;
    if v_live_item.item_id is null or v_live_item.program_id<>v_current_program_id
       or v_live_item.exercise_key<>v_gate->'revalidation'->>'exercise_key'
       or v_live_item.sets<>(v_gate->'revalidation'->>'current_sets')::integer then
      return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_LIVE_ITEM_DRIFT','domain',v_domain,'action',v_action,'applied',false);
    end if;
    v_decision_type := 'PRO_AUTO_VOLUME';
  elsif v_domain='EXERCISE' then
    v_target_item_id := nullif(v_gate->>'target_item_id','')::uuid;
    v_candidate_exercise := v_selected->'proposed_change'->>'to_exercise';
    select t.item_id,t.program_id,t.exercise_key,t.sets into v_live_item
    from public.training_program_items t where t.item_id=v_target_item_id for update;
    if v_live_item.item_id is null or v_live_item.program_id<>v_current_program_id
       or v_live_item.exercise_key<>v_selected->'proposed_change'->>'from_exercise' then
      return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','BLOCKED_LIVE_ITEM_DRIFT','domain',v_domain,'action',v_action,'applied',false);
    end if;
    v_decision_type := 'PRO_AUTO_EXERCISE';
  end if;

  select coalesce(max(p.program_version),0)+1 into v_new_version from public.programs p where p.user_id=v_user_id;
  update public.programs set status='ARCHIVED',archived_at=now() where program_id=v_current_program_id;
  insert into public.programs(user_id,program_version,program_tier,goal_snapshot,status,activated_at)
  values(v_user_id,v_new_version,'PRO',v_goal_snapshot,'ACTIVE',now()) returning program_id into v_new_program_id;

  insert into public.training_program_items(program_id,training_day,movement_slot,exercise_key,sets,rep_min,rep_max,target_rir,display_order,metadata)
  select v_new_program_id,t.training_day,t.movement_slot,
    case when v_domain='EXERCISE' and t.item_id=v_target_item_id then v_candidate_exercise else t.exercise_key end,
    case when v_domain='VOLUME' and t.item_id=v_target_item_id then t.sets+1 else t.sets end,
    t.rep_min,t.rep_max,t.target_rir,t.display_order,t.metadata
  from public.training_program_items t where t.program_id=v_current_program_id
  order by t.training_day,t.display_order,t.item_id;

  insert into public.nutrition_targets(program_id,maintenance_low,maintenance_high,calorie_low,calorie_high,protein_low_g,protein_high_g,fat_min_g,carb_target_g,estimate_confidence)
  select v_new_program_id,nt.maintenance_low,nt.maintenance_high,
    case when v_domain='NUTRITION' then (v_gate->'revalidation'->'proposed_target'->>'calorie_low')::numeric else nt.calorie_low end,
    case when v_domain='NUTRITION' then (v_gate->'revalidation'->'proposed_target'->>'calorie_high')::numeric else nt.calorie_high end,
    nt.protein_low_g,nt.protein_high_g,nt.fat_min_g,nt.carb_target_g,nt.estimate_confidence
  from public.nutrition_targets nt where nt.program_id=v_current_program_id;

  insert into private.program_decisions(user_id,review_id,program_id,decision_type,previous_value,new_value,reason,approved_by,approved_at)
  values(v_user_id,null,v_new_program_id,v_decision_type,
    jsonb_build_object('snapshot_id',p_snapshot_id,'program_id',v_current_program_id,'program_version',v_current_version,'domain',v_domain,'action',v_action,'selected_proposal',v_selected,'gate',v_gate),
    jsonb_build_object('snapshot_id',p_snapshot_id,'program_id',v_new_program_id,'program_version',v_new_version,'domain',v_domain,'action',v_action,'selected_proposal',v_selected),
    v_reason,'KDKAMATO_AUTO_POLICY_V1',now())
  returning decision_id into v_decision_id;

  return jsonb_build_object('schema_version','PRO_AUTOWRITE_V1','route','AUTO_WRITE_APPLIED','applied',true,'snapshot_id',p_snapshot_id,'decision_id',v_decision_id,'domain',v_domain,'action',v_action,'previous_program_id',v_current_program_id,'previous_program_version',v_current_version,'new_program_id',v_new_program_id,'new_program_version',v_new_version,'selected_proposal',v_selected);
end;
$function$;

revoke all on function private.execute_pro_policy_autowrite_v1(uuid) from public, anon, authenticated;
grant execute on function private.execute_pro_policy_autowrite_v1(uuid) to service_role;

create or replace function private.publish_auto_adapt_consult_report_v1(p_snapshot_id uuid,p_analysis_id uuid,p_execution jsonb,p_next_review_date date)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid; v_cycle_key text; v_period_start date; v_period_end date;
  v_decision_id uuid; v_new_program_id uuid; v_domain text; v_action text; v_report_id uuid;
  v_what_changed text; v_training_review text; v_nutrition_review text; v_program_update text;
begin
  if coalesce((p_execution->>'applied')::boolean,false) is not true or coalesce(p_execution->>'route','') <> 'AUTO_WRITE_APPLIED' then raise exception 'VALID_AUTO_EXECUTION_REQUIRED'; end if;
  select s.user_id,s.cycle_key,s.period_start,s.period_end into v_user_id,v_cycle_key,v_period_start,v_period_end from private.consult_snapshots s where s.snapshot_id=p_snapshot_id;
  if v_user_id is null then raise exception 'SNAPSHOT_NOT_FOUND'; end if;
  if not exists (select 1 from private.consult_analysis a where a.analysis_id=p_analysis_id and a.snapshot_id=p_snapshot_id and a.user_id=v_user_id and a.escalation_required=false and a.bloodwork_consideration=false) then raise exception 'AUTO_ANALYSIS_CONTRACT_FAILED'; end if;
  if exists (select 1 from private.review_queue q where q.snapshot_id=p_snapshot_id or q.analysis_id=p_analysis_id) then raise exception 'AUTO_CASE_CANNOT_HAVE_REVIEW_QUEUE'; end if;

  v_decision_id := nullif(p_execution->>'decision_id','')::uuid;
  v_new_program_id := nullif(p_execution->>'new_program_id','')::uuid;
  v_domain := p_execution->>'domain'; v_action := p_execution->>'action';
  if not exists (
    select 1 from private.program_decisions d join public.programs p on p.program_id=d.program_id and p.user_id=d.user_id
    where d.decision_id=v_decision_id and d.user_id=v_user_id and d.program_id=v_new_program_id and d.review_id is null
      and d.approved_by='KDKAMATO_AUTO_POLICY_V1' and d.previous_value->>'snapshot_id'=p_snapshot_id::text and p.status='ACTIVE' and p.program_tier='PRO'
  ) then raise exception 'AUTO_WRITE_DECISION_AUDIT_REQUIRED'; end if;

  if v_domain='NUTRITION' and v_action='ADJUST_CALORIES' then
    v_what_changed := 'ปรับเป้าหมายพลังงานเล็กน้อยตามแนวโน้มจริงและความสม่ำเสมอ'; v_training_review := 'โครงสร้างการฝึกคงเดิม'; v_nutrition_review := 'เป้าหมายพลังงานถูกขยับทีละ 100 kcal ตาม guardrail'; v_program_update := 'สร้าง Program version ใหม่โดยปรับ Nutrition target เพียง 100 kcal/วัน';
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

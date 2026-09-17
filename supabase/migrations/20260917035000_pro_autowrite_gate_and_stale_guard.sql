-- PRO Auto-write v1
-- Scope: deterministic exact-gate material changes only.
-- Nutrition: +/-100 kcal/day, Volume: +1 exact set, Exercise: replace one exact validated item.
-- Safety/recovery/schedule remain non-material guidance or Human Gate.

create or replace function private.validate_pro_policy_execution_v2(p_snapshot_id uuid)
returns jsonb
language plpgsql
stable
set search_path to ''
as $function$
declare
  v_gate jsonb;
begin
  v_gate := private.validate_pro_policy_execution_v1(p_snapshot_id);

  if coalesce(v_gate->>'route','') = 'EXECUTION_READY_SHADOW' then
    return (v_gate - 'schema_version' - 'route' - 'execution_authorized' - 'program_write_authorized')
      || jsonb_build_object(
        'schema_version','PRO_EXECUTION_GATE_V2',
        'route','EXECUTION_READY',
        'execution_authorized',true,
        'program_write_authorized',true
      );
  end if;

  return (v_gate - 'schema_version' - 'execution_authorized' - 'program_write_authorized')
    || jsonb_build_object(
      'schema_version','PRO_EXECUTION_GATE_V2',
      'execution_authorized',false,
      'program_write_authorized',false
    );
end;
$function$;

revoke all on function private.validate_pro_policy_execution_v2(uuid) from public, anon, authenticated;
grant execute on function private.validate_pro_policy_execution_v2(uuid) to service_role;

create or replace function private.persist_approved_pro_program_version_v2(
  p_review_id uuid,
  p_component_changed text,
  p_decision_type text,
  p_previous_value jsonb,
  p_new_value jsonb,
  p_reason text,
  p_approved_by text,
  p_goal_snapshot jsonb,
  p_training_items jsonb,
  p_nutrition_target jsonb
)
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_snapshot_program_id uuid;
  v_current_program_id uuid;
begin
  select rq.user_id,
         nullif(cs.program_snapshot->'active_program'->>'program_id','')::uuid
  into v_user_id,v_snapshot_program_id
  from private.review_queue rq
  left join private.consult_snapshots cs
    on cs.snapshot_id=rq.snapshot_id
   and cs.user_id=rq.user_id
  where rq.review_id=p_review_id;

  if v_user_id is null then
    raise exception 'REVIEW_NOT_FOUND';
  end if;

  if v_snapshot_program_id is null then
    raise exception 'REVIEW_SNAPSHOT_PROGRAM_REQUIRED_FOR_WRITEBACK';
  end if;

  perform 1
  from public.user_access ua
  where ua.user_id=v_user_id and ua.tier='PRO'
  for update;

  if not found then
    raise exception 'ACTIVE_PRO_REQUIRED';
  end if;

  select p.program_id
  into v_current_program_id
  from public.programs p
  where p.user_id=v_user_id and p.status='ACTIVE'
  order by p.program_version desc
  limit 1
  for update;

  if v_current_program_id is null then
    raise exception 'ACTIVE_PROGRAM_REQUIRED';
  end if;

  if v_current_program_id is distinct from v_snapshot_program_id then
    raise exception 'STALE_REVIEW_PROGRAM';
  end if;

  return private.persist_approved_pro_program_version(
    p_review_id,
    p_component_changed,
    p_decision_type,
    p_previous_value,
    p_new_value,
    p_reason,
    p_approved_by,
    p_goal_snapshot,
    p_training_items,
    p_nutrition_target
  );
end;
$function$;

revoke all on function private.persist_approved_pro_program_version_v2(uuid,text,text,jsonb,jsonb,text,text,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function private.persist_approved_pro_program_version_v2(uuid,text,text,jsonb,jsonb,text,text,jsonb,jsonb,jsonb) to service_role;

create or replace function public.bridge_persist_approved_pro_program_version(
  p_review_id uuid,
  p_component_changed text,
  p_decision_type text,
  p_previous_value jsonb,
  p_new_value jsonb,
  p_reason text,
  p_approved_by text,
  p_goal_snapshot jsonb,
  p_training_items jsonb,
  p_nutrition_target jsonb
)
returns jsonb
language sql
set search_path to ''
as $function$
  select private.persist_approved_pro_program_version_v2(
    p_review_id,
    p_component_changed,
    p_decision_type,
    p_previous_value,
    p_new_value,
    p_reason,
    p_approved_by,
    p_goal_snapshot,
    p_training_items,
    p_nutrition_target
  );
$function$;

revoke all on function public.bridge_persist_approved_pro_program_version(uuid,text,text,jsonb,jsonb,text,text,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.bridge_persist_approved_pro_program_version(uuid,text,text,jsonb,jsonb,text,text,jsonb,jsonb,jsonb) to service_role;

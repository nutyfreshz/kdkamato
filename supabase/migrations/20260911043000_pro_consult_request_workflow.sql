alter table public.consult_meetings
  add column if not exists review_id uuid,
  add column if not exists admin_notified_at timestamptz,
  add column if not exists user_notified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'consult_meetings_review_id_fkey'
  ) then
    alter table public.consult_meetings
      add constraint consult_meetings_review_id_fkey
      foreign key (review_id) references private.review_queue(review_id) on delete set null;
  end if;
end $$;

update public.consult_meetings cm
set review_id = rq.review_id
from private.review_queue rq
where cm.review_id is null
  and rq.trigger_type = 'USER_REQUESTED_MEETING'
  and rq.user_id = cm.user_id
  and rq.created_at = cm.requested_at;

create or replace function private.request_online_consult(
  p_user_id uuid,
  p_user_reason text,
  p_priority text,
  p_queue_status text
)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_month_key text;
  v_consumed_count integer;
  v_meeting_id uuid;
  v_review_id uuid;
  v_existing_status text;
begin
  if p_user_id is null then raise exception 'USER_ID_REQUIRED'; end if;
  if p_priority is null or length(btrim(p_priority)) = 0 then raise exception 'REVIEW_PRIORITY_REQUIRED'; end if;
  if p_queue_status is null or length(btrim(p_queue_status)) = 0 then raise exception 'REVIEW_QUEUE_STATUS_REQUIRED'; end if;

  v_month_key := to_char(timezone('Asia/Bangkok', now()), 'YYYY-MM');

  perform 1
  from public.user_access ua
  where ua.user_id = p_user_id and ua.tier = 'PRO'
  for update;
  if not found then raise exception 'ACTIVE_PRO_REQUIRED'; end if;

  select count(*) into v_consumed_count
  from public.consult_meetings cm
  where cm.user_id = p_user_id
    and cm.month_key = v_month_key
    and cm.entitlement_consumed = true;
  if v_consumed_count >= 2 then raise exception 'MONTHLY_MEETING_ENTITLEMENT_EXHAUSTED'; end if;

  select cm.meeting_id, cm.review_id, cm.status
    into v_meeting_id, v_review_id, v_existing_status
  from public.consult_meetings cm
  where cm.user_id = p_user_id
    and cm.month_key = v_month_key
    and cm.status in ('REQUESTED','SCHEDULED')
    and cm.entitlement_consumed = false
  order by cm.requested_at desc
  limit 1;

  if v_meeting_id is not null then
    return jsonb_build_object(
      'meeting_id', v_meeting_id,
      'review_id', v_review_id,
      'month_key', v_month_key,
      'status', v_existing_status,
      'created', false,
      'consumed_entitlements', v_consumed_count,
      'remaining_entitlements', 2 - v_consumed_count,
      'entitlement_consumed', false
    );
  end if;

  insert into public.consult_meetings (
    user_id, month_key, requested_at, status, user_reason, entitlement_consumed
  ) values (
    p_user_id, v_month_key, now(), 'REQUESTED', nullif(btrim(p_user_reason), ''), false
  ) returning meeting_id into v_meeting_id;

  insert into private.review_queue (
    user_id, snapshot_id, analysis_id, trigger_type, priority, status
  ) values (
    p_user_id, null, null, 'USER_REQUESTED_MEETING', p_priority, p_queue_status
  ) returning review_id into v_review_id;

  update public.consult_meetings
  set review_id = v_review_id, updated_at = now()
  where meeting_id = v_meeting_id;

  return jsonb_build_object(
    'meeting_id', v_meeting_id,
    'review_id', v_review_id,
    'month_key', v_month_key,
    'status', 'REQUESTED',
    'created', true,
    'consumed_entitlements', v_consumed_count,
    'remaining_entitlements', 2 - v_consumed_count,
    'entitlement_consumed', false
  );
end;
$$;

create or replace function public.pro_list_consult_requests()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_result jsonb;
begin
  if v_email <> 'brosci.bnbh@gmail.com' then raise exception 'PRO_CONSULT_ADMIN_REQUIRED'; end if;

  select coalesce(jsonb_agg(x.item order by x.requested_at desc), '[]'::jsonb)
  into v_result
  from (
    select cm.requested_at,
      jsonb_build_object(
        'meeting_id', cm.meeting_id,
        'request_code', 'PC-' || upper(substr(replace(cm.meeting_id::text, '-', ''), 1, 8)),
        'review_id', cm.review_id,
        'status', cm.status,
        'requested_at', cm.requested_at,
        'scheduled_at', cm.scheduled_at,
        'user_reason', cm.user_reason,
        'entitlement_consumed', cm.entitlement_consumed,
        'admin_notified_at', cm.admin_notified_at,
        'user_notified_at', cm.user_notified_at,
        'display_name', p.display_name
      ) as item
    from public.consult_meetings cm
    left join public.profiles p on p.user_id = cm.user_id
    order by cm.requested_at desc
    limit 50
  ) x;

  return v_result;
end;
$$;

create or replace function public.pro_get_consult_case(p_meeting_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_user_id uuid;
  v_result jsonb;
begin
  if v_email <> 'brosci.bnbh@gmail.com' then raise exception 'PRO_CONSULT_ADMIN_REQUIRED'; end if;

  select cm.user_id into v_user_id
  from public.consult_meetings cm
  where cm.meeting_id = p_meeting_id;
  if v_user_id is null then raise exception 'CONSULT_MEETING_NOT_FOUND'; end if;

  select jsonb_build_object(
    'meeting', (
      select jsonb_build_object(
        'meeting_id', cm.meeting_id,
        'request_code', 'PC-' || upper(substr(replace(cm.meeting_id::text, '-', ''), 1, 8)),
        'review_id', cm.review_id,
        'status', cm.status,
        'requested_at', cm.requested_at,
        'scheduled_at', cm.scheduled_at,
        'user_reason', cm.user_reason,
        'entitlement_consumed', cm.entitlement_consumed,
        'admin_notified_at', cm.admin_notified_at,
        'user_notified_at', cm.user_notified_at
      ) from public.consult_meetings cm where cm.meeting_id = p_meeting_id
    ),
    'user', jsonb_build_object(
      'user_id', v_user_id,
      'email', (select u.email from auth.users u where u.id = v_user_id),
      'display_name', (select p.display_name from public.profiles p where p.user_id = v_user_id),
      'baseline', (select to_jsonb(b) - 'user_id' from public.user_baseline b where b.user_id = v_user_id),
      'training_profile', (select to_jsonb(t) - 'user_id' from public.training_profiles t where t.user_id = v_user_id),
      'nutrition_profile', (select to_jsonb(n) - 'user_id' from public.nutrition_profiles n where n.user_id = v_user_id)
    ),
    'active_program', (
      select jsonb_build_object(
        'program_id', p.program_id,
        'program_version', p.program_version,
        'program_tier', p.program_tier,
        'goal_snapshot', p.goal_snapshot,
        'activated_at', p.activated_at,
        'nutrition_target', (select to_jsonb(nt) - 'program_id' from public.nutrition_targets nt where nt.program_id = p.program_id),
        'training_items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'training_day', ti.training_day,
            'movement_slot', ti.movement_slot,
            'exercise_key', ti.exercise_key,
            'sets', ti.sets,
            'rep_min', ti.rep_min,
            'rep_max', ti.rep_max,
            'target_rir', ti.target_rir,
            'display_order', ti.display_order,
            'metadata', ti.metadata
          ) order by ti.training_day, ti.display_order)
          from public.training_program_items ti where ti.program_id = p.program_id
        ), '[]'::jsonb)
      )
      from public.programs p
      where p.user_id = v_user_id and p.status = 'ACTIVE'
      order by p.program_version desc
      limit 1
    ),
    'recent_progress', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.entry_date desc)
      from (
        select pe.entry_date, pe.body_weight_kg, pe.training_completed, pe.training_status,
               pe.recovery_status, pe.adherence_status, pe.new_issue, pe.optional_note
        from public.progress_entries pe
        where pe.user_id = v_user_id
        order by pe.entry_date desc, pe.created_at desc
        limit 14
      ) x
    ), '[]'::jsonb),
    'recent_lab', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.measured_at desc)
      from (
        select lr.tool_key, lr.result_payload, lr.result_status, lr.measured_at
        from public.lab_results lr
        where lr.user_id = v_user_id
        order by lr.measured_at desc, lr.created_at desc
        limit 10
      ) x
    ), '[]'::jsonb),
    'exercise_memory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'exercise_key', em.exercise_key,
        'memory_status', em.memory_status,
        'evidence_summary', em.evidence_summary,
        'last_observed_at', em.last_observed_at
      ) order by em.last_observed_at desc)
      from private.exercise_memory em
      where em.user_id = v_user_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.pro_schedule_consult(
  p_meeting_id uuid,
  p_scheduled_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_user_id uuid;
  v_review_id uuid;
  v_status text;
  v_user_email text;
begin
  if v_email <> 'brosci.bnbh@gmail.com' then raise exception 'PRO_CONSULT_ADMIN_REQUIRED'; end if;
  if p_scheduled_at is null or p_scheduled_at <= now() then raise exception 'FUTURE_APPOINTMENT_REQUIRED'; end if;

  select cm.user_id, cm.review_id, cm.status
    into v_user_id, v_review_id, v_status
  from public.consult_meetings cm
  where cm.meeting_id = p_meeting_id
  for update;

  if v_user_id is null then raise exception 'CONSULT_MEETING_NOT_FOUND'; end if;
  if v_status not in ('REQUESTED','SCHEDULED') then raise exception 'CONSULT_MEETING_NOT_SCHEDULABLE'; end if;

  update public.consult_meetings
  set status = 'SCHEDULED',
      scheduled_at = p_scheduled_at,
      user_notified_at = null,
      updated_at = now()
  where meeting_id = p_meeting_id;

  if v_review_id is not null then
    update private.review_queue set status = 'SCHEDULED' where review_id = v_review_id;
  end if;

  select u.email into v_user_email from auth.users u where u.id = v_user_id;

  return jsonb_build_object(
    'meeting_id', p_meeting_id,
    'request_code', 'PC-' || upper(substr(replace(p_meeting_id::text, '-', ''), 1, 8)),
    'review_id', v_review_id,
    'status', 'SCHEDULED',
    'scheduled_at', p_scheduled_at,
    'user_id', v_user_id,
    'user_email', v_user_email
  );
end;
$$;

revoke all on function public.pro_list_consult_requests() from public, anon;
revoke all on function public.pro_get_consult_case(uuid) from public, anon;
revoke all on function public.pro_schedule_consult(uuid, timestamptz) from public, anon;
grant execute on function public.pro_list_consult_requests() to authenticated;
grant execute on function public.pro_get_consult_case(uuid) to authenticated;
grant execute on function public.pro_schedule_consult(uuid, timestamptz) to authenticated;

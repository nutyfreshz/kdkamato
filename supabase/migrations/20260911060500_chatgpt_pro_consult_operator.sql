create or replace function private.chatgpt_resolve_consult_request(p_request_code text)
returns uuid
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_token text;
  v_meeting_id uuid;
begin
  v_token := upper(regexp_replace(btrim(coalesce(p_request_code, '')), '^PC-', '', 'i'));
  if v_token !~ '^[0-9A-F]{8}$' then
    raise exception 'INVALID_CONSULT_REQUEST_CODE';
  end if;

  select cm.meeting_id
    into v_meeting_id
  from public.consult_meetings cm
  where upper(substr(replace(cm.meeting_id::text, '-', ''), 1, 8)) = v_token
  order by cm.requested_at desc
  limit 1;

  if v_meeting_id is null then
    raise exception 'CONSULT_REQUEST_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.consult_meetings cm
    where upper(substr(replace(cm.meeting_id::text, '-', ''), 1, 8)) = v_token
      and cm.meeting_id <> v_meeting_id
  ) then
    raise exception 'CONSULT_REQUEST_CODE_AMBIGUOUS';
  end if;

  return v_meeting_id;
end;
$$;

create or replace function private.chatgpt_list_consult_requests()
returns jsonb
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'request_code', 'PC-' || upper(substr(replace(cm.meeting_id::text, '-', ''), 1, 8)),
        'status', cm.status,
        'requested_at', cm.requested_at,
        'scheduled_at', cm.scheduled_at,
        'user_reason', cm.user_reason,
        'display_name', p.display_name
      )
      order by cm.requested_at desc
    ),
    '[]'::jsonb
  )
  from public.consult_meetings cm
  left join public.profiles p on p.user_id = cm.user_id
  where cm.status in ('REQUESTED', 'SCHEDULED');
$$;

create or replace function private.chatgpt_get_consult_case(p_request_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_meeting_id uuid;
  v_user_id uuid;
  v_result jsonb;
begin
  v_meeting_id := private.chatgpt_resolve_consult_request(p_request_code);

  select cm.user_id
    into v_user_id
  from public.consult_meetings cm
  where cm.meeting_id = v_meeting_id;

  if v_user_id is null then
    raise exception 'CONSULT_REQUEST_NOT_FOUND';
  end if;

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
      )
      from public.consult_meetings cm
      where cm.meeting_id = v_meeting_id
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
        'nutrition_target', (
          select to_jsonb(nt) - 'program_id'
          from public.nutrition_targets nt
          where nt.program_id = p.program_id
        ),
        'training_items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'training_day', ti.training_day,
              'movement_slot', ti.movement_slot,
              'exercise_key', ti.exercise_key,
              'sets', ti.sets,
              'rep_min', ti.rep_min,
              'rep_max', ti.rep_max,
              'target_rir', ti.target_rir,
              'display_order', ti.display_order,
              'metadata', ti.metadata
            )
            order by ti.training_day, ti.display_order
          )
          from public.training_program_items ti
          where ti.program_id = p.program_id
        ), '[]'::jsonb)
      )
      from public.programs p
      where p.user_id = v_user_id
        and p.status = 'ACTIVE'
      order by p.program_version desc
      limit 1
    ),
    'recent_progress', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.entry_date desc)
      from (
        select pe.entry_date,
               pe.body_weight_kg,
               pe.training_completed,
               pe.training_status,
               pe.recovery_status,
               pe.adherence_status,
               pe.new_issue,
               pe.optional_note
        from public.progress_entries pe
        where pe.user_id = v_user_id
        order by pe.entry_date desc, pe.created_at desc
        limit 14
      ) x
    ), '[]'::jsonb),
    'recent_lab', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.measured_at desc)
      from (
        select lr.tool_key,
               lr.result_payload,
               lr.result_status,
               lr.measured_at
        from public.lab_results lr
        where lr.user_id = v_user_id
        order by lr.measured_at desc, lr.created_at desc
        limit 10
      ) x
    ), '[]'::jsonb),
    'exercise_memory', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'exercise_key', em.exercise_key,
          'memory_status', em.memory_status,
          'evidence_summary', em.evidence_summary,
          'last_observed_at', em.last_observed_at
        )
        order by em.last_observed_at desc
      )
      from private.exercise_memory em
      where em.user_id = v_user_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function private.chatgpt_schedule_consult(
  p_request_code text,
  p_scheduled_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_meeting_id uuid;
  v_user_id uuid;
  v_review_id uuid;
  v_status text;
  v_user_email text;
begin
  if p_scheduled_at is null or p_scheduled_at <= now() then
    raise exception 'FUTURE_APPOINTMENT_REQUIRED';
  end if;

  v_meeting_id := private.chatgpt_resolve_consult_request(p_request_code);

  select cm.user_id, cm.review_id, cm.status
    into v_user_id, v_review_id, v_status
  from public.consult_meetings cm
  where cm.meeting_id = v_meeting_id
  for update;

  if v_status not in ('REQUESTED', 'SCHEDULED') then
    raise exception 'CONSULT_MEETING_NOT_SCHEDULABLE';
  end if;

  update public.consult_meetings
  set status = 'SCHEDULED',
      scheduled_at = p_scheduled_at,
      user_notified_at = null,
      updated_at = now()
  where meeting_id = v_meeting_id;

  if v_review_id is not null then
    update private.review_queue
    set status = 'SCHEDULED'
    where review_id = v_review_id;
  end if;

  select u.email into v_user_email
  from auth.users u
  where u.id = v_user_id;

  return jsonb_build_object(
    'meeting_id', v_meeting_id,
    'request_code', 'PC-' || upper(substr(replace(v_meeting_id::text, '-', ''), 1, 8)),
    'review_id', v_review_id,
    'status', 'SCHEDULED',
    'scheduled_at', p_scheduled_at,
    'user_id', v_user_id,
    'user_email', v_user_email
  );
end;
$$;

create or replace function private.chatgpt_mark_user_notified(p_request_code text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_meeting_id uuid;
  v_notified_at timestamptz;
begin
  v_meeting_id := private.chatgpt_resolve_consult_request(p_request_code);

  update public.consult_meetings
  set user_notified_at = coalesce(user_notified_at, now()),
      updated_at = now()
  where meeting_id = v_meeting_id
  returning user_notified_at into v_notified_at;

  return jsonb_build_object(
    'request_code', 'PC-' || upper(substr(replace(v_meeting_id::text, '-', ''), 1, 8)),
    'user_notified_at', v_notified_at
  );
end;
$$;

revoke all on function private.chatgpt_resolve_consult_request(text) from public, anon, authenticated;
revoke all on function private.chatgpt_list_consult_requests() from public, anon, authenticated;
revoke all on function private.chatgpt_get_consult_case(text) from public, anon, authenticated;
revoke all on function private.chatgpt_schedule_consult(text, timestamptz) from public, anon, authenticated;
revoke all on function private.chatgpt_mark_user_notified(text) from public, anon, authenticated;

grant execute on function private.chatgpt_resolve_consult_request(text) to service_role;
grant execute on function private.chatgpt_list_consult_requests() to service_role;
grant execute on function private.chatgpt_get_consult_case(text) to service_role;
grant execute on function private.chatgpt_schedule_consult(text, timestamptz) to service_role;
grant execute on function private.chatgpt_mark_user_notified(text) to service_role;

drop function if exists public.pro_list_consult_requests();
drop function if exists public.pro_get_consult_case(uuid);
drop function if exists public.pro_schedule_consult(uuid, timestamptz);

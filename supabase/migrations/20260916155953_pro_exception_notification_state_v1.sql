alter table private.review_queue
  add column if not exists admin_notified_at timestamptz,
  add column if not exists notification_claimed_at timestamptz,
  add column if not exists notification_attempts integer not null default 0,
  add column if not exists notification_error text;

create index if not exists review_queue_pending_exception_notify_idx
  on private.review_queue(created_at)
  where admin_notified_at is null
    and trigger_type in ('MATERIAL_PROBLEM','CONFLICTING_SIGNALS','SENSITIVE_HEALTH_CONTEXT')
    and priority in ('HIGH','CRITICAL','URGENT');

create or replace function public.bridge_claim_pro_exception_notifications(p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_items jsonb;
begin
  if p_limit is null or p_limit < 1 or p_limit > 50 then
    raise exception 'INVALID_NOTIFICATION_BATCH_LIMIT';
  end if;

  with candidates as (
    select rq.review_id
    from private.review_queue rq
    where rq.admin_notified_at is null
      and rq.status in ('PENDING','REVIEWING','NEEDS_INFO')
      and rq.trigger_type in ('MATERIAL_PROBLEM','CONFLICTING_SIGNALS','SENSITIVE_HEALTH_CONTEXT')
      and rq.priority in ('HIGH','CRITICAL','URGENT')
      and rq.notification_attempts < 5
      and (
        rq.notification_claimed_at is null
        or rq.notification_claimed_at < now() - interval '15 minutes'
      )
    order by
      case rq.priority when 'CRITICAL' then 1 when 'URGENT' then 2 else 3 end,
      rq.created_at asc
    limit p_limit
    for update skip locked
  ), claimed as (
    update private.review_queue rq
    set notification_claimed_at = now(),
        notification_attempts = rq.notification_attempts + 1,
        notification_error = null
    from candidates c
    where rq.review_id = c.review_id
    returning rq.review_id,rq.user_id,rq.trigger_type,rq.priority,rq.status,rq.created_at,rq.notification_attempts,rq.analysis_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'review_id', c.review_id,
    'user_id', c.user_id,
    'display_name', p.display_name,
    'trigger_type', c.trigger_type,
    'priority', c.priority,
    'status', c.status,
    'created_at', c.created_at,
    'attempt', c.notification_attempts,
    'escalation_reasons', coalesce(a.escalation_reasons,'[]'::jsonb),
    'analysis_summary', coalesce(a.summary,'{}'::jsonb)
  ) order by c.created_at), '[]'::jsonb)
  into v_items
  from claimed c
  left join public.profiles p on p.user_id=c.user_id
  left join private.consult_analysis a on a.analysis_id=c.analysis_id;

  return jsonb_build_object('items',v_items,'count',jsonb_array_length(v_items));
end;
$$;

create or replace function public.bridge_mark_pro_exception_notification(
  p_review_id uuid,
  p_success boolean,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_review_id is null then raise exception 'REVIEW_ID_REQUIRED'; end if;

  update private.review_queue rq
  set admin_notified_at = case when p_success then coalesce(rq.admin_notified_at,now()) else rq.admin_notified_at end,
      notification_error = case when p_success then null else left(coalesce(p_error,'UNKNOWN_NOTIFICATION_ERROR'),1000) end,
      notification_claimed_at = case when p_success then rq.notification_claimed_at else now() end
  where rq.review_id=p_review_id
    and rq.trigger_type in ('MATERIAL_PROBLEM','CONFLICTING_SIGNALS','SENSITIVE_HEALTH_CONTEXT');

  if not found then raise exception 'EXCEPTION_REVIEW_NOT_FOUND'; end if;

  return jsonb_build_object('review_id',p_review_id,'success',p_success);
end;
$$;

revoke all on function public.bridge_claim_pro_exception_notifications(integer) from public, anon, authenticated;
revoke all on function public.bridge_mark_pro_exception_notification(uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.bridge_claim_pro_exception_notifications(integer) to service_role;
grant execute on function public.bridge_mark_pro_exception_notification(uuid,boolean,text) to service_role;

-- KDKAMATO Success Journey v0.3: authenticated, owner-scoped workout history.
-- Applied to Supabase KDKAMATO_PROGRAM on 2026-11-01 via approved migration.
-- No client-supplied user ID, no notes, no writes, max 28 days / 500 logs.
create or replace function public.get_my_workout_history(p_days integer default 28)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'log_id',x.log_id,'entry_date',x.entry_date,'program_id',x.program_id,
    'item_id',x.item_id,'exercise_key',x.exercise_key,'set_entries',x.set_entries,
    'control_status',x.control_status,'issue_status',x.issue_status
  ) order by x.entry_date asc,x.log_id asc),'[]'::jsonb)
  from (
    select w.log_id,w.entry_date,w.program_id,w.item_id,w.exercise_key,
           w.set_entries,w.control_status,w.issue_status
    from private.workout_exercise_logs w
    where auth.uid() is not null
      and w.user_id=(select auth.uid())
      and w.entry_date between ((now() at time zone 'Asia/Bangkok')::date-(least(greatest(coalesce(p_days,28),1),28)-1))
                           and (now() at time zone 'Asia/Bangkok')::date
    order by w.entry_date,w.log_id
    limit 500
  ) x;
$$;
revoke all on function public.get_my_workout_history(integer) from public;
revoke all on function public.get_my_workout_history(integer) from anon;
grant execute on function public.get_my_workout_history(integer) to authenticated;

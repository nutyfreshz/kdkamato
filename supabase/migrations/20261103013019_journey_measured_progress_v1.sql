-- Additive tracker. Old categorical check-ins remain historical self-report only.
create table public.nutrition_daily_logs (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 entry_date date not null,
 calories numeric not null check (calories > 0 and calories <= 20000),
 program_id uuid references public.programs(program_id),
 target_low numeric,
 target_high numeric,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,entry_date)
);
alter table public.nutrition_daily_logs enable row level security;
revoke all on public.nutrition_daily_logs from public,anon,authenticated;
grant select,insert,update on public.nutrition_daily_logs to authenticated;
create policy nutrition_read_own on public.nutrition_daily_logs for select to authenticated using ((select auth.uid())=user_id);
create policy nutrition_insert_own on public.nutrition_daily_logs for insert to authenticated with check ((select auth.uid())=user_id);
create policy nutrition_update_own on public.nutrition_daily_logs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- Invoker trigger: RLS on programs and targets remains in force. Client cannot
-- invent a target, change ownership, or replace the first-recorded target snapshot.
create function public.guard_nutrition_day() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_today date := (now() at time zone 'Asia/Bangkok')::date;
begin
 if auth.uid() is null or new.user_id is distinct from auth.uid() then raise exception 'UNAUTHENTICATED'; end if;
 if new.entry_date is null or new.entry_date>v_today or new.entry_date<v_today-89 then raise exception 'DATE_OUT_OF_RANGE'; end if;
 if tg_op='UPDATE' then
  if new.user_id is distinct from old.user_id or new.entry_date is distinct from old.entry_date then raise exception 'IMMUTABLE_DAY'; end if;
  new.program_id:=old.program_id;new.target_low:=old.target_low;new.target_high:=old.target_high;new.created_at:=old.created_at;
 else
  new.program_id:=null;new.target_low:=null;new.target_high:=null;
  select p.program_id,n.calorie_low,n.calorie_high into new.program_id,new.target_low,new.target_high
  from public.programs p left join public.nutrition_targets n on n.program_id=p.program_id
  where p.user_id=auth.uid() and p.status='ACTIVE'
   and (coalesce(p.activated_at,p.created_at) at time zone 'Asia/Bangkok')::date<=new.entry_date
  order by p.program_version desc limit 1;
  new.created_at:=now();
 end if;
 new.updated_at:=now();return new;
end;$$;
revoke all on function public.guard_nutrition_day() from public,anon,authenticated;
create trigger guard_nutrition_day before insert or update on public.nutrition_daily_logs for each row execute function public.guard_nutrition_day();

-- Retain existing owner-scoped private-history RPC; expand only its date/row bounds.
create or replace function public.get_my_workout_history(p_days integer default 30)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'log_id',x.log_id,'entry_date',x.entry_date,'program_id',x.program_id,'item_id',x.item_id,
  'exercise_key',x.exercise_key,'set_entries',x.set_entries,'control_status',x.control_status,'issue_status',x.issue_status
 ) order by x.entry_date,x.log_id),'[]'::jsonb)
 from (select w.log_id,w.entry_date,w.program_id,w.item_id,w.exercise_key,w.set_entries,w.control_status,w.issue_status
 from private.workout_exercise_logs w
 where auth.uid() is not null and w.user_id=(select auth.uid())
 and w.entry_date between (now() at time zone 'Asia/Bangkok')::date-(least(greatest(coalesce(p_days,30),1),90)-1)
 and (now() at time zone 'Asia/Bangkok')::date
 order by w.entry_date desc,w.log_id desc limit 5000) x;
$$;
revoke all on function public.get_my_workout_history(integer) from public,anon;
grant execute on function public.get_my_workout_history(integer) to authenticated;
notify pgrst,'reload schema';

alter table public.pro_profiles
  add column if not exists activation_assessed_at timestamptz,
  add column if not exists next_review_at timestamptz,
  add column if not exists last_review_at timestamptz,
  add column if not exists review_state text not null default 'INACTIVE',
  add column if not exists review_metadata jsonb not null default '{}'::jsonb;

create index if not exists pro_profiles_next_review_at_idx
  on public.pro_profiles(next_review_at)
  where next_review_at is not null;

create or replace function private.sync_pro_review_clock_from_access()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.tier='PRO' and (tg_op='INSERT' or old.tier is distinct from 'PRO') then
    new.pro_active_since := coalesce(new.pro_active_since, now());

    insert into public.pro_profiles(user_id,next_review_at,review_state,review_metadata)
    values(
      new.user_id,
      new.pro_active_since + interval '14 days',
      'ACTIVE_PENDING_INITIAL_REVIEW',
      jsonb_build_object('clock_source','PRO_ACTIVATION','initialized_at',now())
    )
    on conflict(user_id) do update set
      next_review_at=coalesce(public.pro_profiles.next_review_at,excluded.next_review_at),
      review_state=case when public.pro_profiles.review_state in ('INACTIVE','PAUSED') then 'ACTIVE_PENDING_INITIAL_REVIEW' else public.pro_profiles.review_state end,
      review_metadata=coalesce(public.pro_profiles.review_metadata,'{}'::jsonb) || jsonb_build_object('clock_source','PRO_ACTIVATION','initialized_at',now()),
      updated_at=now();
  elsif tg_op='UPDATE' and old.tier='PRO' and new.tier<>'PRO' then
    update public.pro_profiles
    set review_state='PAUSED',next_review_at=null,updated_at=now(),
        review_metadata=coalesce(review_metadata,'{}'::jsonb)||jsonb_build_object('paused_at',now())
    where user_id=new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists user_access_sync_pro_review_clock on public.user_access;
create trigger user_access_sync_pro_review_clock
before insert or update of tier on public.user_access
for each row execute function private.sync_pro_review_clock_from_access();

insert into public.pro_profiles(user_id,next_review_at,review_state,review_metadata)
select ua.user_id,
       coalesce(ua.pro_active_since,now()) + interval '14 days',
       'ACTIVE_PENDING_INITIAL_REVIEW',
       jsonb_build_object('clock_source','PRO_BACKFILL','initialized_at',now())
from public.user_access ua
where ua.tier='PRO'
on conflict(user_id) do update set
  next_review_at=coalesce(public.pro_profiles.next_review_at,excluded.next_review_at),
  review_state=case when public.pro_profiles.review_state in ('INACTIVE','PAUSED') then 'ACTIVE_PENDING_INITIAL_REVIEW' else public.pro_profiles.review_state end,
  review_metadata=coalesce(public.pro_profiles.review_metadata,'{}'::jsonb)||jsonb_build_object('clock_source','PRO_BACKFILL','initialized_at',now()),
  updated_at=now();

create or replace function private.run_due_pro_reviews(p_limit integer default 100)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  r record;
  v_period_start date;
  v_period_end date;
  v_progress_count integer;
  v_workout_count integer;
  v_confidence text;
  v_snapshot_id uuid;
  v_metrics jsonb;
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
            'new_issue_count',v_new_issue_count,'pain_count',v_pain_count,'discomfort_count',v_discomfort_count
          ),
          jsonb_build_object('action','HUMAN_EXCEPTION_REVIEW','program_change_authorized',false),
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
              'last_cycle_key',v_cycle_key,'last_route','EXCEPTION','last_snapshot_id',v_snapshot_id,'updated_at',now()
            ),
            updated_at=now()
        where user_id=r.user_id;
        v_exceptions := v_exceptions + 1;
      else
        v_screen := private.persist_consult_screening(
          v_snapshot_id,r.user_id,
          'KEEP',
          jsonb_build_object('decision','KEEP','data_confidence',v_confidence,'reason',case when v_confidence='LIMITED' then 'INSUFFICIENT_DATA_FOR_MATERIAL_CHANGE' else 'NO_MATERIAL_EXCEPTION_SIGNAL' end),
          jsonb_build_object('action','KEEP','program_change_authorized',false),
          false,'[]'::jsonb,false,null,null,null,null
        );
        v_analysis_id := (v_screen->>'analysis_id')::uuid;

        v_report_id := private.publish_routine_consult_report(
          v_snapshot_id,v_analysis_id,
          case when v_confidence='LIMITED' then 'ข้อมูลยังไม่พอสำหรับปรับ Program' else 'Program ยังเหมาะสม' end,
          case when v_confidence='LIMITED' then 'รอบนี้ยังมีข้อมูลไม่พอสำหรับการเปลี่ยน Program อย่างมีเหตุผล' else 'ยังไม่พบสัญญาณสำคัญที่ทำให้ต้องเปลี่ยน Program ในรอบนี้' end,
          'ใช้ Program ปัจจุบันต่อและติดตาม performance, control, tolerance และ recovery ตามข้อมูลจริง',
          'คงเป้าหมาย Nutrition ปัจจุบันไว้จนกว่าจะมีแนวโน้มและ adherence เพียงพอสำหรับการตัดสินใจ',
          'LAB ใช้เป็นข้อมูลประกอบและไม่เปลี่ยน Program โดยตรง',
          'รอบนี้ยังไม่มีเหตุผลพอสำหรับการเปลี่ยน Program ระดับ material',
          null,
          jsonb_build_array('ทำ Program ปัจจุบันต่อ','บันทึกผลการฝึกและการฟื้นตัวตามปกติ'),
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
              'last_report_id',v_report_id,'data_confidence',v_confidence,'updated_at',now()
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

  return jsonb_build_object(
    'status','OK','processed',v_processed,'keep',v_kept,'exceptions',v_exceptions,'errors',v_errors
  );
end;
$$;

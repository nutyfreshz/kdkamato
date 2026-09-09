-- Production migration ledger version: 20260909030427
-- Purpose: preference-only feedback must not count as substantive positive response evidence.

create or replace function private.refresh_exercise_memory(p_user_id uuid, p_exercise_key text)
returns text
language plpgsql
set search_path to ''
as $function$
declare
  v_candidate_id uuid;
  v_response_count integer;
  v_positive_count integer;
  v_poor_tolerance_count integer;
  v_dislike_count integer;
  v_latest_at timestamptz;
  v_status text;
begin
  select ec.candidate_id into v_candidate_id
  from private.exercise_candidates ec
  where ec.user_id=p_user_id and ec.exercise_key=p_exercise_key
  order by ec.created_at desc limit 1;

  select
    count(*),
    count(*) filter (
      where (er.performance_status is not null or er.tolerance_status is not null or er.recovery_status is not null)
        and coalesce(er.tolerance_status,'OK') in ('GOOD','OK')
        and coalesce(er.performance_status,'SAME') in ('BETTER','SAME')
        and coalesce(er.recovery_status,'OK') in ('GOOD','OK')
    ),
    count(*) filter (where er.tolerance_status='POOR'),
    count(*) filter (where er.preference_status='DISLIKE'),
    max(er.updated_at)
  into v_response_count,v_positive_count,v_poor_tolerance_count,v_dislike_count,v_latest_at
  from (
    select * from public.exercise_response_entries e
    where e.user_id=p_user_id and e.exercise_key=p_exercise_key
    order by e.entry_date desc,e.updated_at desc
    limit 6
  ) er;

  if v_response_count>=2 and (v_poor_tolerance_count>=2 or v_dislike_count>=2) then
    v_status:='DEPRIORITIZED';
  elsif v_response_count>=2 and v_positive_count>=2 and v_poor_tolerance_count=0 then
    v_status:='CONFIRMED_GOOD_FIT';
  elsif v_candidate_id is not null or v_response_count>0 then
    v_status:='TRY';
  else
    v_status:='UNTESTED';
  end if;

  insert into private.exercise_memory(user_id,exercise_key,memory_status,evidence_summary,source_candidate_id,last_observed_at,updated_at)
  values(
    p_user_id,p_exercise_key,v_status,
    jsonb_build_object(
      'response_window',least(v_response_count,6),
      'positive_response_count',v_positive_count,
      'poor_tolerance_count',v_poor_tolerance_count,
      'dislike_count',v_dislike_count,
      'authority','ACTUAL_RESPONSE_OVER_LAB_CANDIDATE'
    ),
    v_candidate_id,v_latest_at,now()
  )
  on conflict(user_id,exercise_key) do update set
    memory_status=excluded.memory_status,
    evidence_summary=excluded.evidence_summary,
    source_candidate_id=coalesce(excluded.source_candidate_id,private.exercise_memory.source_candidate_id),
    last_observed_at=excluded.last_observed_at,
    updated_at=now();

  return v_status;
end;
$function$;

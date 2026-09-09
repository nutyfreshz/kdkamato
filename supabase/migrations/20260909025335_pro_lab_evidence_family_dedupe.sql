-- Production migration ledger version: 20260909025335
-- Purpose: deduplicate LAB recommendation evidence by biological evidence family
-- rather than by tool_key. Q3/Q5/C2 remain suppressed as independent PRO votes
-- until their rules encode distinct, direction-sensitive evidence.

create or replace function private.build_pro_exercise_suggestions(p_user_id uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
with latest_results as (
  select distinct on (
    case
      when lr.result_payload->'output'->>'result_code' like 'C1_SQUAT_%' then 'FEMUR_TIBIA'
      when lr.result_payload->'output'->>'result_code' like 'C1_BENCH_%' then 'ARM_SPAN_HEIGHT'
      when lr.result_payload->'output'->>'result_code' = 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY' then 'DEADLIFT_GEOMETRY'
    end
  )
    lr.result_id, lr.tool_key, lr.measured_at,
    case
      when lr.result_payload->'output'->>'result_code' like 'C1_SQUAT_%' then 'FEMUR_TIBIA'
      when lr.result_payload->'output'->>'result_code' like 'C1_BENCH_%' then 'ARM_SPAN_HEIGHT'
      when lr.result_payload->'output'->>'result_code' = 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY' then 'DEADLIFT_GEOMETRY'
    end as evidence_family
  from public.lab_results lr
  where lr.user_id = p_user_id
    and lr.result_status = 'VALID'
    and lr.tool_key = 'exercise-fit'
    and (lr.result_payload->'output'->>'result_code') in (
      'C1_SQUAT_FEMUR_RELATIVE_LONGER', 'C1_SQUAT_FEMUR_RELATIVE_SHORTER',
      'C1_BENCH_REACH_NEGATIVE', 'C1_BENCH_REACH_NONNEGATIVE',
      'C1_DEADLIFT_CONSERVATIVE_GEOMETRY'
    )
  order by
    case
      when lr.result_payload->'output'->>'result_code' like 'C1_SQUAT_%' then 'FEMUR_TIBIA'
      when lr.result_payload->'output'->>'result_code' like 'C1_BENCH_%' then 'ARM_SPAN_HEIGHT'
      when lr.result_payload->'output'->>'result_code' = 'C1_DEADLIFT_CONSERVATIVE_GEOMETRY' then 'DEADLIFT_GEOMETRY'
    end,
    lr.measured_at desc, lr.result_id desc
),
raw as (
  select private.exercise_slot_for_candidate(ec.exercise_key) as movement_slot,
    ec.exercise_key, ec.priority_order, ec.rationale_code,
    lr.tool_key, lr.measured_at, lr.evidence_family
  from private.exercise_candidates ec
  join latest_results lr on lr.result_id = ec.source_result_id
  where ec.user_id = p_user_id
    and ec.ruleset_version = 'EXERCISE_CANDIDATE_RULESET_V2'
    and private.exercise_slot_for_candidate(ec.exercise_key) is not null
),
agg as (
  select r.movement_slot, r.exercise_key,
    sum(greatest(1, 4-r.priority_order))::integer as lab_score,
    count(distinct r.evidence_family)::integer as evidence_count,
    jsonb_agg(distinct r.evidence_family) as source_tools,
    max(r.measured_at) as latest_lab_at,
    jsonb_agg(distinct r.rationale_code) as rationale_codes
  from raw r
  group by r.movement_slot, r.exercise_key
),
scored as (
  select a.*, em.memory_status, em.evidence_summary,
    case em.memory_status
      when 'CONFIRMED_GOOD_FIT' then 1000
      when 'TRY' then 50
      when 'DEPRIORITIZED' then -1000
      else 0
    end + a.lab_score as total_score
  from agg a
  left join private.exercise_memory em on em.user_id=p_user_id and em.exercise_key=a.exercise_key
),
ranked as (
  select s.*, row_number() over (
    partition by s.movement_slot
    order by s.total_score desc, s.evidence_count desc, s.latest_lab_at desc, s.exercise_key
  ) as suggestion_rank
  from scored s
),
active_program as (
  select p.program_id from public.programs p
  where p.user_id=p_user_id and p.status='ACTIVE'
  order by p.activated_at desc nulls last, p.created_at desc limit 1
),
current_slots as (
  select tpi.movement_slot,
    jsonb_agg(distinct jsonb_build_object('exercise_key',tpi.exercise_key,'display_name',coalesce(tpi.metadata->>'display_name',tpi.exercise_key))) as current_exercises
  from public.training_program_items tpi
  join active_program ap on ap.program_id=tpi.program_id
  group by tpi.movement_slot
),
slots as (select distinct movement_slot from ranked)
select jsonb_build_object(
  'schema_version','PRO_EXERCISE_SUGGESTION_V2',
  'authority_rule','ACTUAL_RESPONSE > MOVEMENT_TOLERANCE > GOAL_FIT > LAB_PREDICTION > GENERIC_RECOMMENDATION',
  'generated_at',now(),
  'suggestions',coalesce((
    select jsonb_agg(jsonb_build_object(
      'movement_slot',sl.movement_slot,
      'current_exercises',coalesce(cs.current_exercises,'[]'::jsonb),
      'suggested',(
        select jsonb_build_object(
          'exercise_key',r.exercise_key,
          'display_name',private.exercise_name_for_candidate(r.exercise_key),
          'status',case when r.memory_status='CONFIRMED_GOOD_FIT' then 'RECOMMENDED_FROM_RESPONSE' else 'TRY_AND_EVALUATE' end,
          'memory_status',coalesce(r.memory_status,'UNTESTED'),
          'evidence_count',r.evidence_count,
          'source_tools',r.source_tools,
          'rationale_codes',r.rationale_codes
        ) from ranked r where r.movement_slot=sl.movement_slot and r.suggestion_rank=1
      ),
      'alternatives',coalesce((
        select jsonb_agg(jsonb_build_object(
          'exercise_key',r.exercise_key,
          'display_name',private.exercise_name_for_candidate(r.exercise_key),
          'status','ALTERNATIVE',
          'memory_status',coalesce(r.memory_status,'UNTESTED'),
          'evidence_count',r.evidence_count
        ) order by r.suggestion_rank)
        from ranked r where r.movement_slot=sl.movement_slot and r.suggestion_rank between 2 and 3
      ),'[]'::jsonb)
    ) order by sl.movement_slot)
    from slots sl left join current_slots cs on cs.movement_slot=sl.movement_slot
  ),'[]'::jsonb)
);
$function$;

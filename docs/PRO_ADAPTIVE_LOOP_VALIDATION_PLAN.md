# KDKAMATO PRO Adaptive Loop Validation Plan

Status: CONTROLLED ACCEPTANCE PASS
Date: 2026-09-09

## Purpose

Preserve and validate the exact PRO adaptation loop without forcing real user Program changes merely to make a test pass.

## Target Journey

1. User trains under current Active Program.
2. User submits lightweight Exercise Feedback only when useful; full exercise-by-exercise weekly logging is not required.
3. Backend persists actual response and refreshes Exercise Memory.
4. Saved validated Lab results are normalized into movement/anatomy signals and candidate rankings.
5. Scheduled PRO review cycle combines Progress, Exercise Feedback, Exercise Memory, relevant saved Lab signals, current Program/history, and Nutrition context.
6. If evidence is insufficient or current strategy is working, outcome = KEEP and no new Program version is created.
7. If evidence supports a material change, system proposes the adjustment.
8. Material Program changes require Professional Human Gate approval.
9. After approval, backend creates immutable PRO Program vNext, archives prior Active Program, and preserves history.
10. Future response is evaluated against the new version and the loop repeats.

## Core Authority

`ACTUAL_RESPONSE > MOVEMENT_TOLERANCE > GOAL_FIT > LAB_PREDICTION > GENERIC_RECOMMENDATION`

Lab is an initiation / candidate-selection signal, not final truth.

## Controlled Test Result

| Scenario | Status | Validation |
|---|---|---|
| A. KEEP path | PASS | Real pilot with Machine Chest Press retained current Program; no unnecessary vNext. |
| B. ADAPT path | PASS | Synthetic transactional fixture produced approved versioned writeback: prior v1 archived, immutable v2 created, exactly one ACTIVE Program. |
| C. Preference-only guard | PASS after fix | LIKE-only x2 originally reproduced a defect (`CONFIRMED_GOOD_FIT`). Migration `20260909030427_exercise_memory_preference_only_guard` now keeps LIKE-only at `TRY`; substantive positive feedback still confirms normally. |
| D. Lab-vs-response conflict | PASS | Real-response Exercise Memory outranked the LAB-first candidate; positive LEG_PRESS response moved it above LAB prediction. |
| E. Safety / uncertainty path | PASS | Synthetic conflicting/poor-tolerance screening routed to `CONFLICTING_SIGNALS`, priority `HIGH`, status `PENDING` Human Review. No silent Program mutation occurred. |
| F. Version integrity | PASS | Approved synthetic writeback archived prior Active Program, created vNext, retained history, and left exactly one ACTIVE Program. Invalid writeback failed atomically. |

## LAB Evidence Deduplication

A controlled stress test reproduced a separate recommendation defect: overlapping LAB tools could turn one biological measurement family into multiple votes because ranking aggregated by `tool_key`.

Production migration `20260909025335_pro_lab_evidence_family_dedupe` now:

- selects evidence by explicit biological family rather than tool alias;
- keeps direction-sensitive C1 Exercise Fit as the current recommendation source;
- prevents Q3 / Q5 / C2 from adding independent recommendation weight until they encode genuinely distinct direction-sensitive evidence;
- preserves Exercise Memory authority over LAB prediction;
- returns `PRO_EXERCISE_SUGGESTION_V2`.

Rule:

`ONE BIOLOGICAL SIGNAL != MULTIPLE VOTES JUST BECAUSE IT APPEARED IN MULTIPLE TOOLS`

## Preference-only Guard Fix

The controlled review after Work handoff discovered that the prior positive-response count treated missing performance/tolerance/recovery as neutral defaults. Two LIKE-only entries could therefore become two positive responses.

Migration `20260909030427_exercise_memory_preference_only_guard` requires at least one substantive response field (`performance_status`, `tolerance_status`, or `recovery_status`) before an entry may count as positive.

Regression results:

- LIKE-only x2 -> `TRY`
- full positive x2 -> `CONFIRMED_GOOD_FIT`
- tolerance-only positive x2 -> `CONFIRMED_GOOD_FIT`
- mixed positive/poor -> `TRY`
- poor tolerance x2 -> `DEPRIORITIZED`
- dislike-only x2 -> `DEPRIORITIZED`

## Pass Criteria

Controlled acceptance passes because all scenarios preserve:

- no browser self-upgrade or privileged writeback;
- no silent material Program mutation;
- no fabricated real-user evidence;
- correct Exercise Memory transitions;
- correct review routing;
- required Human Gate behavior;
- immutable version history;
- no relinking of historical user evidence.

## Production Safety Readback

- Synthetic fixtures were transaction-wrapped and rolled back.
- Post-test readback found zero synthetic invalid-domain auth users, programs, LAB results, or review rows remaining.
- Real pending review rows and real Active Programs were not used for synthetic testing.
- Source migrations are stored under `supabase/migrations/` using the actual Production migration ledger versions.

## Ongoing Operating Boundary

Controlled backend acceptance is complete. Real-world PRO adaptation remains human-gated by design: LAB and Exercise Memory may inform a review, but no material Active Program change occurs without professional approval.

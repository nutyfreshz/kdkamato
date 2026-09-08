# KDKAMATO PRO Adaptive Loop Validation Plan

Status: PARKED FOR CONTROLLED LOOP TEST
Date: 2026-09-08

## Purpose

Preserve the exact PRO adaptation loop for a later end-to-end validation. Do not force additional program versions merely to make the test pass.

## Target Journey

1. User trains under current Active Program.
2. User submits lightweight Exercise Feedback only when useful; full exercise-by-exercise weekly logging is not required.
3. Backend persists actual response and refreshes Exercise Memory.
4. Saved validated Lab results are normalized into movement/anatomy signals and candidate rankings.
5. Scheduled PRO review cycle (approximately every 14 days / twice per calendar month) combines:
   - Progress
   - Exercise Feedback
   - Exercise Memory
   - relevant saved Lab signals
   - current Program and history
   - Nutrition context
6. If evidence is insufficient or current strategy is working, outcome = KEEP and no new Program version is created.
7. If evidence supports a material change, system proposes the adjustment.
8. Material Program changes require Professional Human Gate approval.
9. After approval, backend creates immutable PRO Program vNext, archives prior Active Program, and preserves history.
10. Future response is evaluated against the new version and the loop repeats.

## Core Authority

`ACTUAL_RESPONSE > MOVEMENT_TOLERANCE > GOAL_FIT > LAB_PREDICTION > GENERIC_RECOMMENDATION`

Lab is an initiation / candidate-selection signal, not final truth.

## Required Controlled Test Scenarios

### A. KEEP path
- positive or stable response
- insufficient evidence for material change
- expected: review completes, no vNext created

### B. ADAPT path
- enough repeated evidence that one exercise is better tolerated / performs better than another candidate
- expected: Exercise Memory diverges, proposed replacement is created, Human Gate required, approved writeback creates vNext

### C. Preference-only guard
- user likes ExB but performance/tolerance evidence does not support a swap
- expected: no automatic replacement from LIKE alone

### D. Lab-vs-response conflict
- Lab predicts ExA, real response supports ExB
- expected: real response outranks Lab prediction over time

### E. Safety / uncertainty path
- poor tolerance, conflicting signals, new issue, or insufficient confidence
- expected: no silent auto-swap; route to review / request information as appropriate

### F. Version integrity
- vNext activation archives previous Active Program
- historical Progress / Exercise Feedback remains linked to the Program version under which it occurred
- exactly one Active Program after writeback

## Pass Criteria

PASS only when all scenarios preserve:
- no browser self-upgrade or privileged writeback
- no silent material Program mutation
- no fabricated evidence
- correct Exercise Memory transition
- correct scheduled review routing
- correct Human Gate behavior
- immutable version history
- no relinking of historical user evidence

## Current State

Real PRO pilot already validated the KEEP path with actual Machine Chest Press feedback. The full ADAPT/writeback loop remains intentionally parked until sufficient real evidence or a controlled synthetic test fixture is used.

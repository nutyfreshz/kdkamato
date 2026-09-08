# PRO Lab → Exercise Suggestion Bridge

Status: BACKEND + PROGRAM UI IMPLEMENTED / REAL USER LAB INPUT PENDING
Date: 2026-09-08

## Purpose

Connect validated saved Lab results to conservative PRO exercise suggestions without changing the FREE engine or silently swapping the Active Program.

## Runtime Flow

Saved Lab result
→ normalize Lab signals
→ rank exercise candidates with `EXERCISE_CANDIDATE_RULESET_V2`
→ aggregate latest relevant Lab evidence by movement slot
→ apply Exercise Memory authority
→ expose authenticated PRO-only `get_my_pro_exercise_suggestions()`
→ show suggestion in Active Program
→ future PRO review may use this evidence for a versioned Program update.

Authority remains:

`ACTUAL_RESPONSE > MOVEMENT_TOLERANCE > GOAL_FIT > LAB_PREDICTION > GENERIC_RECOMMENDATION`

## Important Guardrail

This bridge does NOT auto-swap an exercise immediately after a Lab save.

Lab creates a starting hypothesis / Try & Evaluate suggestion. Confirmed real response can override Lab ranking. A material Program change remains part of the controlled PRO review/versioning path.

## Controlled Validation

All synthetic tests were wrapped in transactions and rolled back; no synthetic Lab data remains on the real UAT account.

### Profile A — relatively longer measured femur segment

Result code: `C1_SQUAT_FEMUR_RELATIVE_LONGER`

Top suggestion: `HACK_SQUAT`
Alternatives: `LEG_PRESS`, `SMITH_SQUAT`

PASS.

### Profile B — relatively shorter measured femur segment

Result code: `C1_SQUAT_FEMUR_RELATIVE_SHORTER`

Top suggestion: `SMITH_SQUAT`
Alternatives: `HACK_SQUAT`, `LEG_PRESS`

PASS.

### Actual-response authority test

Lab profile initially ranked `HACK_SQUAT` first.
Synthetic Exercise Memory then marked `LEG_PRESS` as `CONFIRMED_GOOD_FIT`.

Result: `LEG_PRESS` became `RECOMMENDED_FROM_RESPONSE` and outranked the Lab-first candidate.

PASS.

## Security

`public.get_my_pro_exercise_suggestions()`:
- requires authenticated user;
- requires active PRO entitlement;
- only `authenticated` and `postgres` have EXECUTE;
- does not expose raw private tables to the browser.

## Current Human Gate

The UAT PRO account currently has zero real saved Lab results.

Required next validation:
1. User completes one relevant Lab tool with real measurements.
2. User presses Save to account.
3. Read back persisted Lab result, normalized signals, candidate rows and Program suggestion.
4. Confirm the Program UI displays the same backend suggestion.

Do not fabricate the user's measurement values for this gate.

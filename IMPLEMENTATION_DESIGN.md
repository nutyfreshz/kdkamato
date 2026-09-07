# KDKAMATO FREE ENGINE v1.1 — IMPLEMENTATION DESIGN

Status: APPROVED PRODUCT ARCHITECTURE / PRE-PRODUCTION CANDIDATE
Date: 2026-09-07

## Product boundary

FREE = Strong Adaptive Foundation.
PRO = Personalized Longitudinal Professional System.

The two tiers share the same stable exercise identities and Program Engine foundation. FREE uses deterministic broadly applicable rules. PRO later adds validated Lab signals, longitudinal exercise response, Exercise Memory, nutrition response, and professional judgment.

## FREE core inputs

- Goal
- Weight
- Training Experience
- Training Days: 2–6
- Equipment Profile
- Session Duration
- Training Focus: BALANCED / CHEST / BACK / ARMS / LEGS / REPOSTURE

Optional nutrition inputs remain progressive.

## Training architecture

Program family:
- 2 days → Full Body A/B
- 3 days → Full Body A/B/C
- 4 days → Upper/Lower 4-Day
- 5 days → Upper/Lower + Focus Day
- 6 days → Push/Pull/Legs ×2

The engine builds a weekly direct-set budget first, then distributes it across training days, then selects exercises from the equipment-specific stable exercise catalog.

Training Focus changes actual direct-set allocation and exercise exposure. It is not a cosmetic label and it does not use randomness.


## Reposture focus

REPOSTURE is a posture-support / shoulder-balance training emphasis, not a rehabilitation or diagnosis mode. It increases useful exposure for upper back, rear delts, rotator cuff, and lower-trap/scapular-control work while preserving the main bodybuilding program.

Approved generic exercise roles include:
- posture accessory: Face Pull first; Wide-Grip Cable Upright Row may appear as a tolerance-sensitive alternative with shoulder-friendly ROM;
- external rotation: cable/band/side-lying dumbbell external rotation;
- lower trap/scapular: Cable Y Raise / Incline Y Raise / Prone Y Raise;
- rear-delt / upper-back work remains part of the normal catalog.

Behind-neck pulling is intentionally not a generic FREE default. The lower-trap role uses Y-raise/scapular-control patterns instead. Persistent pain, numbness, weakness, or unexplained symptoms are outside the Reposture focus and should route to review rather than be treated as an "office syndrome" prescription.

## Session-time guardrails

- 45 min → max 6 exercises / 16 working sets per day
- 60 min → max 7 exercises / 20 working sets per day
- 75 min → max 8 exercises / 24 working sets per day
- 90 min → max 9 exercises / 28 working sets per day

## Progression

Each exercise carries a user-facing NEXT rule. Double progression is the default:

Top of rep range on all working sets at target RIR → increase load.

Generic load guidance:
- heavy barbell compound: ~+2–3%
- machine compound: ~+3–5%
- dumbbell compound: smallest practical increment, commonly ~+2–5%
- isolation: smallest practical increment, commonly ~+2–5%
- bodyweight: add reps, harder variation, or small external load

Exact next kg becomes possible later when exercise-level load history and available equipment increments are captured.

## Exercise catalog / future PRO compatibility

Each exercise has a stable exercise_key plus neutral attributes intended for future PRO ranking and professional visual guidance. The FREE engine never uses anatomy to claim one exercise is individually optimal.

The professional Motion Card visual system is NOT included in this patch. No placeholder/cheap artwork should be exposed. A separate visual prototype must pass a professional quality gate before production use.

## PRO extension path

Validated Lab Results
→ Normalized Lab / Movement Signals
→ Exercise Candidate Ranking
→ Recommended / Good Alternative / Try and Evaluate
→ Train
→ Observe Performance + Tolerance + Recovery + Preference
→ Confirm / Maintain / Deprioritize
→ Exercise Memory
→ Future Program Versions + Professional Review

Actual longitudinal response has more authority than the initial Lab/anatomy prediction.

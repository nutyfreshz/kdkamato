# KDKAMATO LAB Function Overlap Audit

Status: REVIEWED + CLIENT SAVE SCOPING FIXED / BACKEND DEDUPE PENDING DIGITAL TWIN
Date: 2026-09-09

## Objective

Prevent duplicate user effort, duplicate persistence, and duplicate interpretation across LAB Core and Quick tools while preserving reusable measurement primitives.

## Current Tool Map

| Tool | Role | Inputs | Derived value / interpretation | Overlap status |
|---|---|---|---|---|
| C1 Exercise Fit Explorer | CORE decision/context | height, arm span, femur, tibia, torso | Ape Index + Femur:Tibia + movement-specific copy for Squat/Bench/Deadlift | HIGH overlap with Q4 and Q5; currently over-collects visible inputs for each selected movement |
| C2 Squat Geometry | CORE scenario | height, femur, tibia, torso; imports Knee-to-Wall if available | Femur:Tibia + heel/stance/variant/knee-travel scenario | MEDIUM overlap with Q5 and Q3; desired as consumer, but current visual is not actually parameterized by entered segment lengths |
| C3 Physique Goal Explorer | CORE scenario | shoulder, waist + target shoulder/waist | V-Taper ratio current vs target + scenario meaning | HIGH measurement overlap with Q1; acceptable only if Q1 is treated as primitive and C3 as scenario consumer |
| Q1 V-Taper Snapshot | QUICK measurement primitive | shoulder, waist | current shoulder:waist ratio | Primitive for C3 |
| Q2 FFMI Snapshot | QUICK standalone primitive | height, weight, body-fat estimate | FFM + FFMI | No Core duplicate today |
| Q3 Knee-to-Wall | QUICK measurement primitive | left/right knee-to-wall distance | side difference + ankle-motion context | Primitive for C2 |
| Q4 Ape Index | QUICK measurement primitive | height, arm span | arm-span minus height + ratio | Primitive for C1; current meaning substantially overlaps C1 Bench/Deadlift |
| Q5 Femur:Tibia | QUICK measurement primitive | femur, tibia | segment ratio + relative difference | Primitive for C1/C2; current meaning substantially overlaps C1 Squat and C2 |

## Confirmed Shared Calculations

The code already uses shared calculation functions, which is good and prevents formula drift:

- `computeApeIndex()` is used by Q4 and C1.
- `computeFemurTibia()` is used by Q5, C1, and C2.
- `computeVTaper()` is used by Q1 and C3.
- `computeKneeToWall()` is used by Q3 and imported by C2.
- `computeFFMI()` is currently unique to Q2.

The problem is therefore not duplicate formulas. The problem is duplicate collection, duplicate interpretation, and duplicate evidence ownership.

## Specific Findings

### C1 vs Q4

Overlap is material.

- Q4 collects `height + armSpan` and calculates Ape Index.
- C1 also collects the same two values and calculates the same Ape Index.
- C1 Bench exposes essentially the same metric, then adds Bench-specific application.
- C1 Deadlift also consumes Ape Index as one input to its movement context.

Decision boundary should be:

- Q4 = measurement only: "What is my reach relative to height?"
- C1 = decision/context only: "How should this measurement change what I test in this movement?"

### C1 vs Q5

Overlap is also material.

- Q5 collects `femur + tibia` and computes Femur:Tibia.
- C1 Squat computes the same ratio and gives Squat meaning.
- C1 Deadlift also consumes the same ratio.

Decision boundary should be:

- Q5 = measurement only.
- C1 = movement application only.

### C2 vs Q3/Q5

This is mostly a desired producer → consumer relationship, but one implementation issue exists.

- C2 correctly imports Q3 Knee-to-Wall context when available.
- C2 correctly reuses Femur:Tibia from the same stored measurement keys used by Q5.
- However, C2 currently asks for `height` although height does not affect the rendered schematic or result logic beyond validation.
- More importantly, the current Squat schematic is driven by `kneeTravel`, `heel`, `stance`, and `variant`, but not by the entered `femur`, `tibia`, or `torso` values. The copy says "with your entered proportions", so the visual claim is stronger than the actual model.

This should be fixed before calling C2 a personalized geometry model.

### C3 vs Q1

Overlap is intentional but should be made explicit.

- Q1 = snapshot of current V-Taper ratio.
- C3 = scenario explorer using the same current shoulder/waist values plus target values.

No second interpretation layer should restate the same current-ratio meaning. C3 should focus on "what changes if...".

### Q2

No meaningful duplicate found.

## Persistence Audit

### Previous behavior

`LabSaveResult` previously scanned every `kdkamato.lab.v1.*` key in session storage and placed all of them into every saved LAB payload.

Example risk:

- user opens Q4 Ape Index;
- session already contains femur, waist, or Knee-to-Wall values from earlier tools;
- pressing Save on Q4 could persist unrelated measurements together with the Q4 result.

This was unnecessary data collection and blurred measurement ownership.

### Fix applied

Client save is now scoped by tool and, for C1, by result code.

Saved measurement ownership is now:

- C1 Bench → `height`, `armSpan`
- C1 Deadlift → `height`, `armSpan`, `femur`, `tibia`
- C1 Squat → `femur`, `tibia`, `torso`
- C2 → `femur`, `tibia`, `torso`
- C3 → `shoulder`, `waist`
- Q1 → `shoulder`, `waist`
- Q2 → `height`, `weight`, `bodyFat`
- Q3 → `kneeWallLeft`, `kneeWallRight`
- Q4 → `height`, `armSpan`
- Q5 → `femur`, `tibia`

Shared session keys remain reusable for prefill, but unrelated measurements are no longer bundled into a save payload.

## PRO Bridge / Evidence Audit

### Current normalization

The backend intentionally normalizes shared measurement families across multiple source tools:

- `ARM_SPAN_HEIGHT` from `ape-index` or `exercise-fit`
- `FEMUR_TIBIA` from `femur-tibia`, `exercise-fit`, or `squat-geometry`
- `SHOULDER_WAIST_RATIO` from `v-taper` or `physique-goal`
- `KNEE_TO_WALL` from `knee-to-wall` or `squat-geometry`

This is acceptable for signal normalization only if downstream evidence is deduplicated by measurement family.

### Current PRO ranking problem

`build_pro_exercise_suggestions()` currently keeps the latest result per `tool_key`, then aggregates candidate evidence across tools. This means multiple tools can contribute separate evidence counts even when they represent the same underlying measurement family.

Current active candidate-rule sources include:

- `exercise-fit`
- `femur-tibia`
- `knee-to-wall`
- `squat-geometry`

This creates a real double-counting risk.

Additional correctness issues:

- Q5 uses one generic result code `Q5_FEMUR_TIBIA`; its candidate rule always ranks `HACK_SQUAT > LEG_PRESS > SMITH_SQUAT`, regardless of whether femur is relatively longer or shorter.
- Q3 uses one generic `Q3_KNEE_TO_WALL` result code; its candidate rule always ranks the same three exercises and does not branch on side difference or magnitude.
- C2 uses generic `C2_SCENARIO_COMPARE`; its candidate rule is fixed even though C2 is a user-controlled scenario explorer.
- C1 is currently the only source whose Squat result code actually distinguishes relative femur direction and changes candidate priority accordingly.

Therefore Q3, Q5, and C2 should not currently be counted as independent recommendation evidence in PRO ranking.

## Recommended Ownership Model

### Measurement Primitives

These own measurement + one deterministic derived value only:

- Q1 V-Taper
- Q2 FFMI
- Q3 Knee-to-Wall
- Q4 Ape Index
- Q5 Femur:Tibia

### Decision / Scenario Tools

These consume primitives and add context, comparison, or recommendations:

- C1 Exercise Fit
- C2 Squat Geometry
- C3 Physique Goal

## Required Refactor

1. C1 should ask the user to choose movement first.
2. C1 should request only measurements required for that movement:
   - Squat: femur, tibia, torso. Optionally consume Q3 Knee-to-Wall context.
   - Bench: height, arm span.
   - Deadlift: height, arm span, femur, tibia. Do not require torso unless the model actually uses it.
3. Q4/Q5 should stop doing movement-level interpretation beyond a short handoff sentence to C1/C2.
4. C2 should remove unused height input.
5. C2 must either:
   - actually parameterize the visual with femur/tibia/torso measurements, or
   - relabel the visual as a generic scenario illustration and stop claiming it represents the entered proportions.
6. C3 should consume Q1 values as current state and focus only on target scenario deltas.
7. Preserve shared `useLabMeasurement()` keys so users never have to type the same measurement twice in one browser profile/session.
8. In the Digital Twin, remove Q3/Q5/C2 as independent PRO candidate-score sources until their result codes and rules encode genuinely distinct evidence.
9. Change PRO evidence aggregation from `distinct tool_key` to explicit evidence families / signal dimensions so the same measurement family cannot gain extra weight merely by being saved through multiple tools.
10. Re-run the Exercise Fit → candidate ranking → Exercise Memory → PRO suggestion integration tests after dedupe.

## Product Rule Going Forward

A LAB value may have one measurement owner and multiple consumers, but only one tool should own the primary interpretation for a given question.

`MEASURE ONCE → DERIVE ONCE → REUSE EVERYWHERE → INTERPRET BY PURPOSE`

For PRO evidence:

`ONE BIOLOGICAL SIGNAL ≠ MULTIPLE VOTES JUST BECAUSE IT APPEARED IN MULTIPLE TOOLS`

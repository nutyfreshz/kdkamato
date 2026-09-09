# KDKAMATO LAB Function Overlap Audit

Status: REVIEWED
Date: 2026-09-09

## Objective

Prevent duplicate user effort and duplicate interpretation across LAB Core and Quick tools while preserving reusable measurement primitives.

## Current Tool Map

| Tool | Role | Inputs | Derived value / interpretation | Overlap status |
|---|---|---|---|---|
| C1 Exercise Fit Explorer | CORE decision/context | height, arm span, femur, tibia, torso | Ape Index + Femur:Tibia + movement-specific copy for Squat/Bench/Deadlift | HIGH overlap with Q4 and Q5; currently over-collects inputs for each selected movement |
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

The problem is therefore not duplicate formulas. The problem is duplicate collection and duplicate interpretation/positioning in the UX.

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

## Product Rule Going Forward

A LAB value may have one measurement owner and multiple consumers, but only one tool should own the primary interpretation for a given question.

`MEASURE ONCE → DERIVE ONCE → REUSE EVERYWHERE → INTERPRET BY PURPOSE`

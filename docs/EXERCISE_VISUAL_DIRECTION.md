# Exercise Visual Direction

## Status

Abstract SVG Motion Card v0 prototype: **FAILED USER RECOGNITION GATE** on 2026-09-08.

RepDB replacement visual quality gate: **ACCEPTED AS GOOD ENOUGH FOR BASE LIBRARY** on 2026-09-08.

## Failure reason for abstract SVG v0

The user could not reliably understand the exercise/movement from the simplified human + equipment abstraction. This format must not be scaled or shipped.

## Accepted replacement direction

Use a visually recognizable technical exercise card:

1. Realistic or high-fidelity illustrated human figure.
2. Recognizable gym equipment silhouette/model.
3. Separate START and FINISH frames instead of ghosted overlays where source media supports it.
4. One clear movement arrow between frames.
5. Minimal labels only: SETUP / MOVE / AVOID.
6. Exercise identity must be obvious without reading the title first.
7. Mobile-first readability.

## Source hierarchy

### Primary — RepDB

Use RepDB as the main exercise visual library when a direct or defensible semantic match exists.

Why:
- consistent flat illustration style,
- start/peak assets,
- commercially usable in-app with attribution,
- broad coverage of the current KDKAMATO exercise catalog.

Important license constraints:
- visible RepDB attribution is required for the free tier,
- do not redistribute RepDB as a dataset,
- do not use RepDB images as generative-AI reference / conditioning / style-transfer input.

### Secondary gap source — Gym Visual

Use Gym Visual only for exercise identities not adequately covered by RepDB.

Current search confirms close/direct candidates for the main gap classes, including leverage-machine row/pullover, dumbbell external rotation, cable/band Y-raise variants, cable overhead triceps extension, leverage-machine dip, dumbbell squeeze press, dumbbell rear-delt row, slider leg curl, and multiple band variants such as face pull, straight-arm pulldown, lat pulldown, row, rear-delt fly, high row, leg extension/curl, and lateral raise.

Why it is the preferred secondary source:
- very broad catalog,
- consistent visual family,
- PNG illustration and GIF options,
- commercial app use is available under its paid royalty-free license.

Important license constraints:
- only purchased non-watermarked media may be used commercially,
- do not redistribute raw media,
- do not use Gym Visual media as generative-AI input/reference.

## Format normalization rule

Source art may differ, but the KDKAMATO presentation shell must stay consistent.

Every exercise visual should be normalized into one Motion Card system:
- fixed card aspect ratio,
- fixed figure scale / safe area,
- consistent background treatment,
- START / FINISH labeling,
- consistent movement arrow treatment,
- SETUP / MOVE / AVOID copy area,
- mobile-first sizing,
- source attribution handled centrally where required.

Do not attempt AI restyling to make RepDB and Gym Visual look identical. Normalize through layout/composition only so licensing stays clean and visual recognition is preserved.

## Acceptance gate

A user unfamiliar with the exercise name should be able to identify:
- which equipment is used,
- body setup,
- movement direction,
- start vs finish position,
within a few seconds.

Bulk production may proceed only from assets that pass this recognition gate.

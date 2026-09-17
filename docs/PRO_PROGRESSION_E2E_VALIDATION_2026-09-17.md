# PRO Progression E2E validation, 2026-09-17

Result: `PRO_PROGRESSION_E2E_VALIDATED`

- Production source (read-only): `lmyofrjwmwhuppvejgfx`
- Isolated synthetic project: `dgazltepkniwqqbxvksp`
- GitHub base: `4bd3c71bc86186251bf0465c1832a0076693358a`
- Production data was not modified.

## Harness method

The isolated project used a minimum current-schema harness reconstructed from
Production catalog definitions for the dependency closure. The real current
`build_pro_consult_snapshot`, `persist_consult_screening`, policy, gate,
executor, report and required supporting functions were installed. This is an
E2E harness, not a claim that the repository contains a complete canonical
Production schema baseline.

## Synthetic Nutrition success path

Synthetic PRO user and active Program v1 were seeded only in the isolated
project. The snapshot `3fbf573a-281e-40d3-b0b0-dc59d9ee9c40` bound to Program
`22222222-2222-4222-8222-222222222222` (v1).

| Assertion | Result |
| --- | --- |
| PRO access and active Program | PASS |
| v5 policy result | `AUTO_CANDIDATE_SHADOW`, NUTRITION / `ADJUST_CALORIES` |
| exact gate | `EXECUTION_READY` with both authorization flags true |
| executor | `AUTO_WRITE_APPLIED` |
| Program transition | v1 archived; v2 `c2a4990c-862b-4dfa-be8e-bc3920f15b2c` created |
| calorie mutation | 2150-2250 to 2050-2150, exactly -100 kcal/day |
| training items | equivalent before and after |
| unrelated nutrition macros | equivalent before and after |
| decision audit | one `PRO_AUTO_NUTRITION` decision `0d103e3a-b4a9-47e7-8fa2-fa0756f4f1bf` |
| screening | `AUTO_ADAPTED`, no escalation and no bloodwork consideration |
| report | report `1dd414cc-c4d1-48ce-afad-f194e7064783`, `ADAPT`, `PUBLISHED`, next review 2026-10-01 |
| review queue | zero rows for the successful snapshot/analysis |

## Guards

- Replaying the successful snapshot did not create a second Program, decision,
  report, or material mutation. The executor returned
  `BLOCKED_SNAPSHOT_PROGRAM_STALE`: its stale-program guard is evaluated before
  the replay lookup after the successful write has changed the active Program.
- A second snapshot, `2c30d1b8-0991-4ac6-bac6-d8b0dbcbbffd`, was bound to v2.
  An isolated legitimate Program v3 drift was then introduced. Execution
  returned `BLOCKED_SNAPSHOT_PROGRAM_STALE`, with zero decision and report side
  effects.

## Defects and debt

No current implementation defect was found and no production migration or
application code was changed. The repository baseline debt remains: historical
migrations are not self-contained because there is no canonical initial schema.
The isolated minimum harness must not be labelled a full Production schema
baseline.

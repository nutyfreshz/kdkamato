# Client Release Acceptance, 2026-09-17

Status: `CLIENT_RELEASE_ACCEPTED`

## Release identity

- GitHub release SHA: `9f56b708ad9e8b6fab1e0837a41148247ddc2e82`
- Production web deployment SHA: `e2468d86410ec184b939b6f4e2ba6712342ae2b7`
- Production web deployment: `dpl_8wW4n9fS3u1c1tspmomD94CE2NgH`, `READY`
- Production Supabase: `lmyofrjwmwhuppvejgfx`
- Production migration head: `20260917035556_pro_autowrite_runner_v2`

The web deployment intentionally remains on `e2468d86`. The later GitHub delta
contains only PRO database migrations, the E2E report, and `vercel.json`; it
contains no application runtime source change, so a cosmetic redeploy is not
required.

## Acceptance matrix

| Area | Result | Evidence |
| --- | --- | --- |
| GitHub release state | PASS | `e2468d86..9f56b708` has only migrations, docs, and `vercel.json` |
| Production Supabase alignment | PASS | migration ledger ends at `pro_autowrite_runner_v2` |
| PRO Progression E2E | PASS | `PRO_PROGRESSION_E2E_VALIDATED`, commit `9f56b708` |
| Cron / runner | PASS | one active hourly runner: `7 * * * *`, calling `run_due_pro_reviews_v2(100)` |
| Security acceptance | PASS | client RPCs use `auth.uid()`, accept no caller user ID, use controlled search paths, and do not use dynamic SQL |
| Production smoke | PASS | home, program, progress, LAB, Physical Consult, Physical Consult Program, and PRO Review render without server/not-found errors |
| Runtime health | PASS | Vercel recorded no runtime-error clusters in the preceding 24 hours |
| Regression acceptance | PASS | guarded executor remains service-role only; active Production Programs: 2; no synthetic E2E user or snapshot found |
| Synthetic isolation | PASS | all synthetic fixtures stayed in paused project `dgazltepkniwqqbxvksp` |

## Production component verification

The current Production database contains the required v5 policy, v2 execution
gate, v1 executor, screening persistence, automatic report publisher, and v2
runner. Internal PRO functions are in `private`, have controlled empty
`search_path`, and are executable only by `service_role` where required.

The seven authenticated `SECURITY DEFINER` client RPCs are intentional:
each derives identity from `auth.uid()`, exposes no caller-controlled user ID,
uses a controlled search path, and contains no dynamic SQL. Private tables with
RLS and no policies deny direct `anon` and `authenticated` SELECT access, so
those advisor notices are `PASS_INTENTIONAL`.

## Non-blocking debt

- Leaked password protection is recommended but unavailable on the current
  Supabase Free plan.
- `private.physical_consult_exercise_trials` has no direct anon/authenticated
  access, but RLS is not enabled. This remains defense-in-depth hardening debt.
- Performance advisor findings are unindexed foreign keys and unused indexes;
  they are informational and show no current release failure signal.
- Historical migrations still lack a canonical self-contained initial schema.

Production was read-only throughout this acceptance audit. No synthetic user,
Program, snapshot, report, or test artifact was created in Production.

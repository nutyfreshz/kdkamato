# Validation Status

Validated against live Supabase project `KDKAMATO_PROGRAM`:
- project status ACTIVE_HEALTHY
- expected public/private tables exist
- `persist_free_program_version` exists and is service-role executable only
- `get_my_progress_summary` exists and is authenticated-user executable
- user-facing RLS ownership policies are present on baseline, nutrition, programs, program items, nutrition targets, and progress
- `kdk-free-program` Edge Function deployed ACTIVE with JWT verification enabled
- security advisor warning for public execution of `rls_auto_enable()` fixed via migration `revoke_public_execute_rls_auto_enable`

Remaining production-readiness note:
- Supabase Auth leaked-password protection is disabled and should be enabled before broad public launch.
- Private-schema RLS tables intentionally have no client policies; they are not client-facing.

Local build validation:
- dependency installation did not complete in the artifact runtime, so a full `next build` could not be executed here.
- run `npm install && npm run typecheck && npm run build` in the deployment environment before promotion.

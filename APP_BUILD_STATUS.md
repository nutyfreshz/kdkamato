# KDKAMATO PROGRAM APP BUILD STATUS

## v0.2

Completed:
- Next.js App Router shell: Home / Program / Lab / Progress / Account
- Supabase SSR auth foundation
- Minimum onboarding writes only client-safe baseline/nutrition inputs
- Live Supabase schema readback completed
- Live privileged RPC contract resolved: `persist_free_program_version`
- Live Edge Function deployed: `kdk-free-program`
- Preview is generated server-side from stored foundation inputs
- Activate Program persists an immutable/versioned ACTIVE Free program through privileged server path
- Program page reads ACTIVE program + training items + nutrition target from Supabase
- Progress Quick Check writes low-friction observations under RLS
- Progress summary uses live `get_my_progress_summary` RPC
- FREE → PRO remains admin/server controlled; no payment automation added

Deliberately deferred:
- automatic payment/subscription lifecycle
- PRO pilot workflow UI
- biweekly PRO automation
- calorie/maintenance estimate until measurable-input algorithm is locked; no subjective activity multiplier guess
- full Lab tool UI

Security boundary:
- browser cannot self-upgrade tier
- browser cannot write generated programs directly
- Edge Function validates caller identity, then performs privileged program persistence
- package contains no secret/service-role key

# KDKAMATO Program App

Application Build vertical slice on top of the existing Supabase foundation.

## Implemented in this slice

- Next.js 16 App Router shell
- Supabase SSR cookie clients + `proxy.ts`
- Google OAuth + email/password login UI
- Client-safe minimum onboarding writing only to `user_baseline` + `nutrition_profiles`
- Deterministic Free training program preview
- Home / Program / Lab / Progress / Account mobile-first information architecture
- No client write to `user_access`, generated program tables, consult reports, or private schema

## Required runtime env

Copy `.env.example` to `.env.local` and use the project's public values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never expose a secret/service-role key to the browser.

## Boundary intentionally preserved

This slice does **not** activate/write an authoritative program version yet. The Supabase implementation spec says generated program structure is a privileged write, and the documented function names are conceptual. Live foundation introspection must resolve the actual privileged function/RPC contract before activation is wired.

## Next deterministic build step

After live function contract readback:

1. wire `Activate Program` to the actual privileged server/Edge function;
2. read the returned active `programs` + `training_program_items` + `nutrition_targets` version;
3. replace preview-only Program page with active program rendering;
4. implement lightweight `progress_entries` write path.

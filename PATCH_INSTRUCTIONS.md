# KDKAMATO WEB TRUE PATCH — Program v0.2.1

## End state

Keep the original KDKAMATO website intact and add the Program routes on top.

## Browser-only apply procedure

You do NOT need a local repo.

### Step 1 — Delete exactly 3 conflicting files in GitHub
From `nutyfreshz/kdkamato` → `main`, delete and commit:

1. `app/page.tsx`
2. `app/layout.tsx`
3. `app/lab/page.tsx`

Do not delete the `.jsx` versions.

### Step 2 — Upload this patch folder to repository root
Upload the CONTENTS of this patch, preserving folder paths.
Replace files when GitHub asks.

Important restored files:
- `app/page.jsx`
- `app/layout.jsx`
- `app/globals.css`

Important integration files:
- `/program`, `/progress`, `/account`, `/home`, `/login`, `/auth/callback`
- `components/program-app.module.css`
- `lib/supabase/*`
- `proxy.ts`
- merged `package.json`
- `tsconfig.json`

### Step 3 — Commit to main
Vercel should auto-deploy. Do not manually redeploy the old failed deployment.

## Expected smoke test

Public website:
- `/` = original KDKAMATO homepage
- `/manga` = original Manga
- `/knowledge` = original Knowledge
- `/lab` = original LAB
- `/training` = original Training

Program:
- `/login`
- `/home`
- `/program/start`
- `/program/preview`
- `/program`
- `/progress`
- `/account`

## Important

Supabase Edge Function `kdk-free-program` is already deployed.
Do NOT upload `supabase/functions/kdk-free-program` as part of this web patch.

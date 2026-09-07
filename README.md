# KDKAMATO Website v0.2 + Program Integration v0.2.1

The existing KDKAMATO website remains the primary application:
Homepage / Manga / Knowledge / LAB / Training are preserved.

## Program add-on routes

- `/login`
- `/home`
- `/program`
- `/program/start`
- `/program/preview`
- `/progress`
- `/account`
- `/auth/callback`

The existing `/lab` remains the original public LAB and is not replaced by Program.

## Existing website data

- `MANGA_WEB` and `ARTICLES_WEB` continue to come from `KDKAMATO_Web_Content`.
- Google Drive image proxy and service-account flow remain unchanged.

## Program backend

Supabase project: `KDKAMATO_PROGRAM`
- Auth + RLS foundation
- `kdk-free-program` Edge Function is already deployed in Supabase
- `persist_free_program_version`
- `get_my_progress_summary`
- FREE → PRO is admin/server controlled

## Required Vercel public env for Program

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Existing Google environment variables must remain unchanged.

## Safety boundary

Do not upload a standalone Program App snapshot over the website root.
Future Program changes must be delivered as merge-safe patches that preserve:
`app/page.jsx`, `app/layout.jsx`, `app/globals.css`, existing `/lab`, Manga, Knowledge, and website content integrations.

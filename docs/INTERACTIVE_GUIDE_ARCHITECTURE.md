# KDKAMATO Interactive Guide Architecture

## Purpose

`/guide` is the reader-facing usage guide for KDKAMATO LAB, Program, Progress, PRO Review, Knowledge, and Manga.

The guide is intentionally implemented as a thin presentation layer over one central content registry. This avoids maintaining the same labels, explanations, tier markers, and destination links in multiple UI files.

## Source of truth

Primary guide content and destination mapping:

`lib/guide-registry.ts`

Keep these fields there:

- Thai and English labels
- FREE / PRO / ALL audience state
- Why the feature exists
- When to use it
- Usage steps
- Expected outcome
- Destination routes / deep links

The visual page should render these values rather than duplicate them.

## Rendering layers

- `app/guide/page.tsx` renders the guide experience.
- `app/guide/guide.module.css` owns layout, visual treatment, responsive behavior, and CSS motion.
- `components/guide-motion.tsx` owns progressive reveal only.
- `components/SiteHeader.jsx` provides the public Guide entry point.
- `components/app-shell.tsx` provides the Program-side Guide entry point.

Motion must remain optional. `prefers-reduced-motion` is supported and the guide must remain fully usable without animation.

## Backend maintenance rule

Do not add a database table merely because the guide exists.

Current content changes are code-managed, so a typed registry is the lowest-maintenance source of truth. No Supabase schema or Program/LAB calculation logic is required for Guide v1.

When a feature route, tier, wording, or explanation changes:

1. Update the feature itself if required.
2. Update its record in `lib/guide-registry.ts`.
3. Do not hardcode a second copy of the same guide text in `/guide`.
4. Verify destination links and mobile rendering.

## When a CMS becomes justified

Move guide content behind Supabase or another CMS only when one of these becomes true:

- non-developers need to edit guide content frequently
- guide copy needs scheduled publishing or revision history
- many contextual-help surfaces require remote content updates without deploys
- guide analytics or experimentation requires server-managed variants

If that happens, preserve the existing registry interface as an adapter so the page and contextual-help components do not need a redesign.

## Contextual help contract

Future in-feature help should reference the same guide identity, for example:

- LAB help → `/guide#lab`
- Program help → `/guide#program`
- Progress help → `/guide#progress`
- PRO Review help → `/guide#pro`
- Knowledge help → `/guide#knowledge`

Do not create independent mini-manual copy unless the content is genuinely specific to that screen.

## Change-safety boundary

Guide maintenance must not silently change:

- Program generation rules
- LAB formulas or result logic
- Supabase data contracts
- entitlement logic
- PRO review logic

The guide explains current product behavior. It is not an authority that changes product behavior.

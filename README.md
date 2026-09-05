# KDKAMATO Website v0.2

Custom Next.js web app prepared for Vercel.

## What is already wired

- Approved A01–A11 homepage visuals are bundled locally in `/public/assets`.
- Homepage, Manga library/reader, Knowledge library/article page, LAB shell, Training shell.
- `MANGA_WEB` and `ARTICLES_WEB` are read server-side from `KDKAMATO_Web_Content`.
- Manga page images are read from the Google Drive folder in `Final_Asset_Folder` and served through a private server-side image proxy.
- The browser never receives Google service-account credentials.

## One-time Google setup

The website must be able to read the private Google Sheet and the `WEBSITE_PUBLISH` Drive folder.

1. Create a Google Cloud service account.
2. Enable **Google Sheets API** and **Google Drive API** in that Google Cloud project.
3. Copy the service-account email.
4. Share these two items with that email as **Viewer**:
   - `KDKAMATO_Web_Content`
   - `WEBSITE_PUBLISH` folder (sharing the parent gives access to episode subfolders)
5. Add the environment variables from `.env.example` in Vercel.

No daily service-account work is needed after that.

## Daily Manga workflow

1. Run the existing `01 → 05` workflow.
2. If the 05 final images are truly final, place/copy them into an episode folder under `WEBSITE_PUBLISH/MANGA_FINAL/EPxx`.
3. If images were edited externally, upload those corrected final images instead.
4. Add/update one row in `MANGA_WEB`:
   - `Episode_ID`
   - `Title`
   - `Slug`
   - `Topic`
   - `Publish_Date`
   - `Status`
   - `Asset_Source`
   - `Final_Asset_Folder`
   - `Cover_File` (optional; first image is used if blank)
   - `Page_Count`
   - `Short_Description`
   - `Caption`
   - `Featured`
5. Set `Status = PUBLISHED` when it should appear live.

The site refreshes content at most every ~5 minutes by default (`revalidate = 300`). No rebuild is required for each episode.

## Article workflow

The separate Article chat can consolidate one or many episodes, then upsert one row into `ARTICLES_WEB`. Set `Status = PUBLISHED` when ready. Daily Manga does not require an article.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Vercel

Import the folder/repository into Vercel, add environment variables, then deploy. No custom build configuration is required for a standard Next.js project.

## Content safety boundary

The LAB frame score on the homepage is explicitly a UI preview only. The public Frame Analyzer calculation is intentionally not implemented until its scientific scoring logic is validated.

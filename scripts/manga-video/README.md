# KDKAMATO Motion Manga Video Pipeline v0.1

## Goal
Convert approved static Manga pages into a deterministic 9:16 video without regenerating or redesigning artwork.

## Default production rule
ARTWORK LOCKED means pixels are never sent through generative image-to-video. Motion is editorial only: hold, center zoom-in, center zoom-out, timing, narration, captions, and optional BGM.

## Flow
1. Export one approved Manga episode as ordered PNG/JPG/WebP files.
2. Run `npm run video:manifest -- <episode-folder> <manifest.json>`.
3. ChatGPT fills or revises `narration`, `audio`, `duration`, and `motion` per scene.
4. Narration audio can come from an approved TTS/voice provider or recorded human audio. Keep voice generation outside the renderer so providers can change without touching artwork logic.
5. Run `npm run video:render -- <manifest.json> <output.mp4>`.
6. Renderer outputs MP4 plus SRT when narration text exists.
7. QC before publish.

## Manifest fields
- `episode.id`: episode identifier
- `format`: defaults to 1080x1920 at 30 fps
- `scenes[].image`: page image path
- `scenes[].audio`: optional narration audio for that scene
- `scenes[].duration`: minimum scene duration in seconds
- `scenes[].motion`: `hold`, `zoom-in`, or `zoom-out`
- `scenes[].narration`: narration/caption text
- `bgm`: optional background music file
- `bgmVolume`: default 0.10

If scene audio is longer than the declared duration, the renderer extends that scene automatically.

## Shorts-first format
Start with 9:16 Shorts because KDKAMATO Manga is already 9:16. Do not create a separate 16:9 production engine until the Shorts pilot proves retention.

Target first pilot:
- 45–120 seconds
- Hook within first 2–3 seconds
- Voiceover adds interpretation; do not merely read text already visible on page
- Captions supplied as SRT
- CTA points to the matching Knowledge/LAB/Program destination

## Automation boundary
ChatGPT can automate:
- episode selection
- scene ordering
- narration draft
- scene timing
- motion choice
- TTS request through an approved provider
- manifest generation
- render command
- QC checklist
- title/description/CTA packaging

Human gate remains for:
- first approved narrator/voice identity
- first 2–3 pilot videos
- any upload/publish action until performance and visual QC are accepted

## Dependencies
- Node.js
- FFmpeg and ffprobe available on PATH

No runtime dependency is added to the KDKAMATO website. This is an offline content-production tool.

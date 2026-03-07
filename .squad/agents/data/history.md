# Project Context

- **Owner:** Gisela Torres
- **Project:** sopla-el-cartucho-jsconf
- **Stack:** TypeScript, Node.js, (WebLLM optional)
- **Created:** 2026-03-07

## Learnings

- **2026-03-07 — Deterministic 8-bit avatars:** Implemented a build-time, Sharp-based pipeline that (1) center-crops + downsizes to 64×64, (2) maps each pixel to the nearest color in a fixed 16-color palette, then (3) upscales with nearest-neighbor to keep crisp pixels. Output contract: `public/assets/avatars/{speakerSlug}.png`, with placeholder generation derived from a stable slug hash (no randomness, no network).

- **2026-03-07 — assets.json glue + caching:** Added `npm run generate:assets` which downloads originals to `public/assets/avatars/original/` and generates 8‑bit PNGs to `public/assets/avatars/`, then writes `src/data/assets.json` with web paths (`/assets/avatars/...`). Script is deterministic and cached by default; `--force` re-downloads/regenerates.

- **2026-03-07 — Deterministic cartridge covers:** Added `npm run generate:covers` (`scripts/generate-covers.ts`) to generate 600×400 (3:2) PNG covers at `public/assets/covers/{talkId}.png` for rendered talk types (`talk` + `lightning`). Covers are deterministic from `talkId` (stable hash → fixed retro palette + pattern), composite the local 8‑bit avatar when present, render wrapped title + optional speaker, and write `cover: /assets/covers/{talkId}.png` back into `src/data/assets.json` (cached by default; `--force` overwrites).

<!-- Append new learnings below. Each entry is something lasting about the project. -->

# Project Context

- **Owner:** Gisela Torres
- **Project:** sopla-el-cartucho-jsconf — web retro 80/90 en Astro basada en la agenda de JSConf ES
- **Stack:** Astro, TypeScript, Node.js
- **Created:** 2026-03-07

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-07 — Design Review (Session 1)

- **JSConf agenda structure:** ~15 talks + breaks/ceremonies on a single day (March 14, 2026). HTML is plain rendered cards — no API, no JSON endpoint. One talk (Rita Kozlov) is still TBD.
- **Reference site aesthetic:** "Sopla el Cartucho" uses CRT scanlines, neon glow (#00ff00, #00ffff, #ff00ff), retro fonts (VT323, Press Start 2P), dark backgrounds (#0a0a0a), pixel borders. Each product is a "cartridge card" in a grid.
- **WebLLM is text-only:** It runs LLMs (Llama/Mistral) in-browser via WebGPU but cannot generate images. Not the right tool for 8-bit faces. Sharp-based deterministic pipeline is the practical MVP path.
- **Data contract is critical:** Three agents (Brand, Andy, Data) all touch the data shape. Defined `talks.json` and `assets.json` with `talkId` as the join key. Speakers is always an array.
- **Ingestion strategy:** One-shot scrape → committed JSON → manual re-run. Never depend on jsconf.es at build time.
- **Cartridge cover sizing:** 256×384 (2:3 ratio) for covers, 128×128 for avatars. NES 16-color palette for pixel art.

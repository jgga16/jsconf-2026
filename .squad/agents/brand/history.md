# Project Context

- **Owner:** Gisela Torres
- **Project:** sopla-el-cartucho-jsconf
- **Stack:** Node.js, TypeScript, Astro (build pipeline)
- **Created:** 2026-03-07

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **2026-03-07**: `src/data/talks.json` is generated via `npm run fetch-agenda` from https://www.jsconf.es/, parsed from `section#agenda` using stable card selectors (`div.bg-dark-surface/50` for talks/ceremonies, `div.py-6` for breaks).
- **2026-03-07**: Upstream slot titles repeat (e.g. coffee breaks), so the ingestion step de-duplicates `talks[].id` by suffixing `-2`, `-3`, ... (see `brand-001-talk-id-collisions.md`).

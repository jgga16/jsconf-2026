# Project Context

- **Owner:** Gisela Torres
- **Project:** sopla-el-cartucho-jsconf
- **Stack:** Astro, TypeScript
- **Created:** 2026-03-07

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **MVP test focus:** Treat `src/data/talks.json` + `src/data/assets.json` as the contract; enforce with Zod validation so ingestion/schema drift fails fast.
- **Smoke coverage sweet spot:** `astro check` + `astro build` catches most regressions; add *one* Playwright smoke only if we need to detect broken asset URLs (`img.naturalWidth`) and basic rendering count.
- **Criteria to decide early:** whether `break`/`ceremony` items render as cards, and the explicit fallback rules when assets are missing, to avoid ambiguous “works on my machine” behavior.


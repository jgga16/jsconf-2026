# Project Context

- **Owner:** Gisela Torres
- **Project:** sopla-el-cartucho-jsconf
- **Stack:** Astro, TypeScript, CSS
- **Created:** 2026-03-07

## Learnings

- **Vertical slice UI:** Keep the first shipable slice as a single `index.astro` rendering a grid of `CartridgeCard`s; avoid early routing/filtering complexity.
- **Design system first:** Centralize palette/typography/effects as CSS tokens in `src/styles/global.css` so the retro vibe stays coherent while components evolve.
- **Assets are optional:** `CartridgeCard` should render cleanly without generated covers/avatars by falling back to SVG placeholders, so the UI isn’t blocked by the image pipeline.

<!-- Append new learnings below. Each entry is something lasting about the project. -->

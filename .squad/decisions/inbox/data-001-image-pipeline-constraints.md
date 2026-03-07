# Decision: Deterministic Avatar Pipeline Constraints

**Author:** Data (AI/Image Pipeline)
**Date:** 2026-03-07
**Status:** proposed
**Affects:** Andy (UI), Brand (ingestion), build tooling

## Context

We need a boring, deterministic, build-time way to turn speaker photos (or placeholders) into crisp, pixelated avatars that UI can rely on, without external APIs.

## Decision

Use a Sharp-based script (`scripts-generate-avatars.mjs`) that:

- Downscales/crops to a fixed **base grid**: **64×64** by default.
- Performs a deterministic **nearest-color mapping** to a fixed **16-color NES-ish palette**.
- Upscales to **128×128** by default (**scale=2**) using **nearest-neighbor**.
- Writes to a stable, UI-friendly path: **`public/assets/avatars/{speakerSlug}.png`**.

### Defaults

- `baseSize`: 64
- `scale`: 2 → `outputSize`: 128
- `palette`: `nes16` (16 colors)
- `outDir`: `public/assets/avatars`

### Palette (`nes16`)

```
#000000 #1D2B53 #7E2553 #008751
#AB5236 #5F574F #C2C3C7 #FFF1E8
#FF004D #FFA300 #FFEC27 #00E436
#29ADFF #83769C #FF77A8 #FFCCAA
```

### Determinism rules

- No network calls, no randomness.
- Crop uses `fit=cover` + `position=centre`.
- Placeholder colors derive from a stable hash of the slug.

## Performance expectations

- For ~15 speakers, should complete in **well under a second** on typical dev hardware (Sharp/libvips is fast; pixel mapping is only 4096 pixels per image at baseSize=64).
- Output is small PNGs (generally a few KB to a few 10s of KB each).

## How to run

```bash
npm install
npm run generate:avatars:demo
npm run generate:avatars -- --input ./path/to/photo.jpg --slug speaker-slug
npm run generate:avatars -- --inputDir ./input/avatars
```

## Consequences

- UI can treat avatar paths as stable and static.
- We can later swap in a different palette/mapping strategy without changing UI contracts (only outputs).
- WebLLM is not used here (it’s not an image generator); generative options are explicitly out-of-scope for MVP.

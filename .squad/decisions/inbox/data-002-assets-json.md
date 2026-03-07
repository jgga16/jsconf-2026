# Decision: Generate assets.json + download originals

**Author:** Data (AI/Image Pipeline)
**Date:** 2026-03-07
**Status:** proposed
**Affects:** Andy (UI), Brand (ingestion), build tooling

## Context

UI needs stable, web-path-friendly avatar URLs on `talk.assets.avatar8bit`, but `talks.json` only contains remote `speaker.avatarUrl` values. We also want caching so builds/dev don’t depend on the network after the first run.

## Decision

Add a deterministic “glue” script: `scripts/generate-assets.ts` (run via `npm run generate:assets`) that:

1. Reads `src/data/talks.json`.
2. For each talk’s first speaker with `avatarUrl`, downloads the original image to:
   - `public/assets/avatars/original/{speakerSlug}.{ext}`
3. Runs the existing deterministic pixel pipeline (`scripts-generate-avatars.mjs`) to create:
   - `public/assets/avatars/{speakerSlug}.png`
4. Writes/updates `src/data/assets.json` with **web paths**:
   - `avatarOriginal: /assets/avatars/original/{speakerSlug}.{ext}`
   - `avatar8bit: /assets/avatars/{speakerSlug}.png`

### Caching

- By default, downloads and avatar generation are skipped if the target files already exist.
- `--force` re-downloads and regenerates (passes `--overwrite` through to the avatar generator).

### Merge behavior

- Existing `cover` values in `assets.json` are preserved (future cover generator can coexist).

## Consequences

- `CartridgeCard.astro` can reliably use `talk.assets.avatar8bit` as a web path with no extra logic.
- Repo gets a local, committed cache of both originals and 8-bit outputs; subsequent runs are fast and deterministic.

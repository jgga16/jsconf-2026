# Decision: UI Tokens + CartridgeCard API

**Author:** Andy (Frontend)
**Date:** 2026-03-07
**Status:** proposed

## Context

We need a fast vertical slice in Astro that keeps the retro vibe coherent, without coupling UI too tightly to the future asset pipeline.

## Decision

### 1) CSS tokens (global)

Define a small set of global CSS custom properties in `src/styles/global.css`:

- `--bg`, `--panel`, `--text`
- `--neon-green`, `--neon-cyan`, `--neon-pink`
- `--border`, `--radius`, `--shadow`
- `--font-body` (VT323), `--font-display` (Press Start 2P)

This keeps spacing/typography/colors consistent and makes the retro skin easy to iterate.

### 2) CartridgeCard component API

`<CartridgeCard talk={talk} />`

- `talk` follows Mikey’s `talks.json` schema.
- Optional `talk.assets` can provide `cover` and `avatar8bit` paths.
- If assets are missing, the component falls back to:
  - `/placeholders/cover.svg`
  - `/placeholders/avatar.svg`

This allows Brand/Data to ship assets later without changing the UI API.

## Consequences

- UI stays stable even if the asset pipeline changes.
- Retro skin evolves via token changes, not one-off per-component tweaks.

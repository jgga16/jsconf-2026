# Decision: Minimum Viable Vertical Slice

**Author:** Mikey (Lead)  
**Date:** 2026-03-07  
**Status:** proposed  
**Affects:** Andy, Brand, Data, Mouth

## Context

We need to ship a working Astro site that presents the JSConf España 2026 agenda as retro game cartridges. The reference site "Sopla el Cartucho" gives us the aesthetic: CRT scanlines, neon colors (#00ff00, #00ffff, #ff00ff), retro fonts (VT323, Press Start 2P), dark backgrounds, pixelated borders.

## Decision

The MVP vertical slice is **one page that renders all ~15 talks as cartridge cards**, each with:

1. **Talk title** (cartridge game name)
2. **Speaker name + role** (publisher)
3. **Time slot** (e.g. "09:40 – 10:20")
4. **8-bit avatar** (deterministic pixel art from speaker photo)
5. **Placeholder cover** (template-based, not generative)

### Slice layers

| Layer | Owner | Deliverable |
|-------|-------|-------------|
| Data ingestion | Brand | `src/data/talks.json` — scraped + committed |
| 8-bit avatar pipeline | Data | `scripts/generate-avatars.ts` — Sharp-based pixelate |
| Cartridge card component | Andy | `src/components/CartridgeCard.astro` |
| Agenda page | Andy | `src/pages/index.astro` — grid of CartridgeCards |
| Retro CSS baseline | Andy | CRT scanlines, neon text, pixel borders (ported from reference) |
| Tests | Mouth | Data schema validation, component smoke tests |

### What is NOT in the MVP

- No multi-page routing (single index page)
- No e-commerce / cart / checkout
- No AI-generated covers (deterministic only)
- No workshop or hackathon sections
- No console-based filtering (all talks in one flat grid)

## Consequences

- We can ship and demo within one work cycle
- Generative covers become a separate iteration (v2)
- The data schema must be stable before Andy and Data start work

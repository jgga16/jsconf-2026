# Decision: 8-Bit Image Pipeline

**Author:** Mikey (Lead)  
**Date:** 2026-03-07  
**Status:** proposed  
**Affects:** Data, Andy

## Context

The concept: each talk = a game cartridge. The cartridge cover needs an 8-bit style portrait of the speaker. Gisela mentioned WebLLM or similar for generating these.

## Decision

### Two-tier approach: deterministic baseline now, generative experiment later.

---

### Tier 1: Deterministic Pipeline (MVP) — Data owns this

**Input:** Speaker avatar images (webp/jpg from jsconf.es, ~200-400px)

**Pipeline (`scripts/generate-8bit.ts`):**

```
for each speaker avatar:
  1. Download original → public/avatars/{speaker-slug}.webp
  2. Resize to 64×64 px (Sharp, nearest-neighbor interpolation)
  3. Reduce palette to 16 colors (NES-inspired palette)
  4. Upscale to 128×128 px (nearest-neighbor — keeps pixels crispy)
  5. Save as public/avatars/{speaker-slug}-8bit.png
```

**Cover composition (`scripts/generate-covers.ts`):**

```
for each talk:
  1. Create 256×384 canvas (2:3 retro cartridge ratio)
  2. Fill background with console-style gradient (dark → darker)
  3. Place 8-bit avatar (centered, top half)
  4. Render talk title in retro font (bottom half, word-wrapped)
  5. Add pixel border frame (4px, NES-style)
  6. Optional: add "JSConf ES 2026" header badge
  7. Save as public/covers/{talk-slug}.png
```

**Dependencies:**
- `sharp` — image resize, palette reduction, compositing
- `@napi-rs/canvas` — text rendering with custom fonts (alternative: sharp's SVG overlay)

**Palette (NES-inspired, 16 colors):**
```
#000000 #1D2B53 #7E2553 #008751
#AB5236 #5F574F #C2C3C7 #FFF1E8
#FF004D #FFA300 #FFEC27 #00E436
#29ADFF #83769C #FF77A8 #FFCCAA
```

---

### Tier 2: Generative Experiment (v2, optional) — Data explores feasibility

**WebLLM assessment:**
- WebLLM is a **text** LLM runtime (runs models like Llama/Mistral in-browser via WebGPU)
- It **cannot generate images** — it's the wrong tool for this job
- Verdict: **not suitable** for 8-bit face generation

**Viable generative alternatives:**

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **Replicate API** (flux-pixelart, sdxl-pixelart) | Send avatar + prompt → get pixel art | High quality, many pixel art models available | API cost (~$0.01/image), non-deterministic, API dependency |
| **Transformers.js + small model** | Run a small image model in Node.js at build time | No API cost, runs offline | Slow (~30s/image), limited quality, heavy dependencies |
| **CSS/Canvas pixel filter** | Client-side pixelation via CSS `image-rendering: pixelated` + canvas manipulation | Zero build cost, instant | Not true pixel art, limited aesthetic control |

**Recommendation for v2:** If Gisela wants true AI-generated pixel art, Replicate with a pixel art SDXL model is the most practical path. Budget: ~$0.15 for all 15 speakers. But this is iteration 2 — the deterministic pipeline ships first.

---

## Consequences

- Data can start immediately with Sharp (zero API dependencies)
- Covers will look consistent and deterministic
- Generative experiment is scoped and doesn't block MVP
- Andy needs to know the output paths/sizes to build the CartridgeCard component

# Mouth — MVP Acceptance Criteria + Test Scenarios (Agenda → Cards → Assets)

**Author:** Mouth (Tester)  
**Date:** 2026-03-07  
**Status:** proposed  
**Scope:** MVP vertical slice (per `mikey-001-vertical-slice.md`)

## References (source of truth)

- MVP slice: `.squad/decisions/inbox/mikey-001-vertical-slice.md`
- Data contract: `.squad/decisions/inbox/mikey-002-data-schema.md`
- Ingestion script: `.squad/decisions/inbox/mikey-003-ingestion-approach.md`
- Image pipeline: `.squad/decisions/inbox/mikey-004-image-pipeline.md`

## MVP Acceptance Criteria

### A) Agenda ingestion correctness

**A1 — Output locations + committed artifacts**
- `src/data/talks.json` exists and is committed to git (builds never depend on `jsconf.es`).
- Speaker avatar originals are downloaded into `public/avatars/` and committed.

**A2 — Data contract is enforced**
- `talks.json` validates against Zod schema (`src/schemas/talk.ts`) at build time (or via an explicit `npm run validate-data`).
- Validation fails the build on contract violations (missing required fields, wrong types, invalid times, etc.).

**A3 — Stable join key + determinism**
- Every `talks[].id` is kebab-case, deterministic, and unique within the file.
- `assets.json` uses `talkId` to reference `talks[].id` (1:1 preferred; 1:0 allowed with fallback behavior defined below).

**A4 — Resilience to upstream gaps**
- If upstream has incomplete content (e.g., talk description is missing / TBD), ingestion still succeeds and represents it explicitly (e.g., empty string allowed, or `"TBD"` surfaced via UI rule).
- Missing speaker role is allowed (empty string) without breaking ingestion.

**A5 — Speaker array invariants**
- `speakers` is always an array (even for single-speaker talks).
- Multi-speaker talks render with multiple names (see Rendering AC).

**A6 — Time normalization**
- `time.start` and `time.end` are normalized to `HH:MM` 24h format.
- If upstream provides weird separators (en-dash, em-dash, hyphen), we still parse to the normalized form.

**A7 — Type classification**
- Each item has `type ∈ {talk, break, ceremony, lightning}`.
- **Missing AC callout:** Decide now whether the index page renders only `talk`/`lightning` or includes `break`/`ceremony` as cartridges. (My recommendation: default to render `talk` + `lightning`; exclude others.)

---

### B) Rendering cards (CartridgeCard + index page)

**B1 — Grid renders from JSON (no manual duplication)**
- `src/pages/index.astro` renders cards by iterating `talks.json`.

**B2 — Required fields visibly present**
- Each rendered card includes:
  - Talk title
  - Speaker name(s)
  - Speaker role(s) (or a safe fallback label)
  - Time slot (normalized format, e.g. `09:40 – 10:20`)
  - Avatar (8-bit preferred) and cover (placeholder allowed)

**B3 — Filtering rules are consistent**
- If breaks/ceremonies are excluded, they never appear in the grid.
- If included, they must be visually distinct (badge or style) so users don’t confuse them with talks.

**B4 — Accessibility baseline**
- All images have meaningful `alt` text.
- Card title is a semantic heading (`h2`/`h3`) and the page has a single `h1`.
- Keyboard navigation works (tab order is sane; no focus traps).

---

### C) Assets present / fallbacks

**C1 — Build does not ship broken links**
- For every asset path referenced by `assets.json`, a real file exists under `public/`.
- No card should render a broken `<img>` due to missing files.

**C2 — Fallback behavior is explicit**
- **Missing AC callout:** Define what happens when `assets.json` has no entry for a talk (recommended behavior):
  - cover: use a deterministic placeholder cover (same layout for all missing)
  - avatar: use `avatarOriginal` if `avatar8bit` missing; otherwise use a generic placeholder
  - the UI should still render the card (do not crash)

**C3 — Cross-platform paths**
- Asset paths in JSON are URL paths (start with `/covers/...` or `/avatars/...`), never OS file paths.

## Concrete Test Scenarios (MVP)

> These are phrased so they can be automated later; for now they are also runnable as manual checks.

### 1) Ingestion (scripts/fetch-agenda.ts)

**ING-01 — Happy path scrape produces valid talks.json**
- Run ingestion.
- Assert `src/data/talks.json` exists.
- Assert Zod validation passes.

**ING-02 — IDs are unique + kebab-case**
- Assert every `talk.id` matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Assert no duplicates.

**ING-03 — Speakers always array**
- Assert `Array.isArray(talk.speakers)` for all talks.
- Assert each speaker has `name` (non-empty after trim).

**ING-04 — Time format normalization**
- Assert `time.start` and `time.end` match `^\d{2}:\d{2}$`.
- Assert `start < end` for normal talks (allow equality only if explicitly allowed for ceremonies).

**ING-05 — Handles missing description / TBD**
- Pick a talk with missing/TBD fields (known risk).
- Assert ingestion completes and produces a safe placeholder in JSON (empty string or `"TBD"` per rule).

**ING-06 — Avatar download**
- For each speaker avatar URL, assert a corresponding file exists in `public/avatars/`.
- Assert file extensions are consistent (webp/jpg/png as decided).

**ING-07 — Upstream HTML changes fail loudly but safely**
- Simulate parse failure (e.g., by pointing to a local HTML fixture missing expected selectors).
- Assert script exits non-zero with a clear error, and does not partially overwrite `talks.json`.

**ING-08 — Non-talk agenda items**
- Ensure breaks/ceremonies are correctly labeled as `type`.
- If excluded from rendering, ensure they still can exist in `talks.json` without breaking UI.

### 2) Rendering (Astro page/component)

**REN-01 — Build renders index without runtime data fetch**
- Run `astro build`.
- Assert build succeeds offline (no network required).

**REN-02 — Page renders expected card count**
- Assert number of rendered cards equals number of items in `talks.json` after applying the filter rule.

**REN-03 — Card fields show correct values**
- For 1 representative talk, assert title/speaker/time match JSON.

**REN-04 — Multi-speaker talk renders all speakers**
- Given a talk with 2+ speakers, assert all names render and don’t overlap (layout).

**REN-05 — A11y quick pass**
- Manual: use keyboard only to navigate cards; ensure focus visible.
- Automated (optional): run a single axe check if tooling exists.

### 3) Assets + fallbacks

**ASS-01 — Every referenced asset exists**
- For each record in `assets.json`, verify `public${cover}`, `public${avatar8bit}`, `public${avatarOriginal}` exist.

**ASS-02 — Missing cover falls back**
- Remove/rename one cover in a local run.
- Assert UI still renders that card with placeholder cover (and no console errors).

**ASS-03 — Missing 8-bit avatar falls back**
- Remove/rename one `avatar8bit`.
- Assert UI uses `avatarOriginal` (or generic placeholder) and still renders.

**ASS-04 — No broken images in browser**
- Open index page.
- Assert every `<img>` has `naturalWidth > 0` (Playwright can check this).

## Proposed light-weight smoke checks (only if npm scripts exist)

> Goal: catch regressions (bad data, broken build, missing assets) with minimal flake.

1. **Type + data contract**
   - `astro check` (or `tsc -p .`) to catch TypeScript and Astro issues.
   - `npm run validate-data` (or as part of `astro check`) to run Zod validation of `talks.json` and (optionally) `assets.json`.

2. **Build**
   - `astro build` (fast, deterministic, no browser).

3. **One E2E smoke test (only if justified)**
   - Playwright: visit `/`, assert at least N cards render, and `ASS-04` (no broken images).
   - Justification: catches the highest-impact failures that static build won’t (broken asset URLs, hydration regressions if any).

4. **Do NOT run fetch-agenda in CI by default**
   - Per decision, `fetch-agenda` should be manual / on-demand.
   - Optional: nightly job (non-blocking) that runs ingestion and reports diffs.

## Open questions / missing acceptance criteria

- **Breaks/ceremonies rendering:** are they excluded, included as special cards, or excluded from `talks.json` entirely?
- **Fallback policy:** what is the canonical placeholder cover + avatar? (Should be deterministic and in-repo.)
- **Multi-speaker avatar:** if multiple speakers, do we show the first avatar only, a stacked avatar UI, or a generic multi-speaker badge?

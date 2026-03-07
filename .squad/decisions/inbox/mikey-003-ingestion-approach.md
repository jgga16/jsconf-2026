# Decision: Agenda Ingestion Approach

**Author:** Mikey (Lead)  
**Date:** 2026-03-07  
**Status:** proposed  
**Affects:** Brand

## Context

The JSConf agenda lives at https://www.jsconf.es/#agenda as rendered HTML. We need it as structured JSON.

## Decision

**Approach: One-shot scrape → committed JSON → manual refresh on demand.**

### Pipeline

```
scripts/fetch-agenda.ts
  ├── fetch https://www.jsconf.es/
  ├── parse HTML (cheerio or node-html-parser)
  ├── extract talk blocks → map to Talk schema
  ├── download speaker avatar images → save to public/avatars/
  ├── validate with Zod schema
  └── write src/data/talks.json
```

### Trigger

- **Not** wired into `astro build`. Run manually: `npm run fetch-agenda`
- Output is committed to git so builds never depend on jsconf.es availability
- Re-run only when the upstream agenda changes (pre-event updates)

### HTML structure observed (2026-03-07)

Each talk block follows this pattern:
```
<time start> <time end>
<h4> title </h4>
<p> description </p>
<img> speaker avatar
<speaker name>
<speaker role>
```

The page uses a consistent card layout per talk with times in adjacent elements.

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| JSConf changes HTML structure | Medium | Committed JSON is the fallback; script warns on parse failure |
| Missing speaker data (TBD talks) | Confirmed (Rita Kozlov's talk is TBD) | Schema allows empty description; UI shows "TBD" badge |
| Avatar images become unavailable | Low | Downloaded at scrape time and committed to repo |
| New talks added after initial scrape | High (event is March 14) | Re-run `fetch-agenda` script; diff JSON for review |

## Rejected alternatives

- **Build-time fetch**: Too fragile. One DNS blip = broken deploy.
- **Manual JSON only**: Too tedious for 15+ talks with descriptions.
- **CMS / headless**: Overkill for a one-day event.

## Consequences

- Brand owns this script
- First run produces the "golden" talks.json that everyone else depends on
- Subsequent runs are diffable via git — changes are reviewable

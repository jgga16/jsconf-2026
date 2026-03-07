# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Frontend UI (Astro) | Andy | Layout, components, CSS retro, pages | 
| Content model & agenda ingestion | Brand | Fetch/parse https://www.jsconf.es/#agenda, normalize data, build-time caching | 
| AI / 8-bit avatar + cover pipeline | Data | WebLLM feasibility, image/sprite pipeline, build tooling | 
| Code review | Mikey | Review PRs, check quality, suggest improvements |
| Testing | Mouth | Write tests, find edge cases, verify fixes |
| Scope & priorities | Mikey | What to build next, trade-offs, decisions |
| Async issue work (bugs, tests, small features) | @copilot 🤖 | Well-defined tasks matching capability profile |
| Session logging | Scribe | Automatic — never needs routing |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, evaluate @copilot fit, assign `squad:{member}` label | Mikey |
| `squad:{name}` | Pick up issue and complete the work | Named member |
| `squad:copilot` | Assign to @copilot for autonomous work (if enabled) | @copilot 🤖 |

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.

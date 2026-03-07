# Decision: Handling duplicate `talks[].id` collisions

**Author:** Brand (Backend/Content Dev)
**Date:** 2026-03-07
**Status:** proposed
**Affects:** Brand, Data, Andy

## Context

The upstream JSConf agenda includes repeated slot titles (e.g. `Pausa de Café`, `Inicio Bloque + Sorteos`).
The canonical schema requires `talks[].id` to be a unique kebab-case join key.

## Decision

When generating `talks.json`, `id` is derived from the slot title via kebab-case **and then de-duplicated** deterministically:

- First occurrence keeps the base slug: `pausa-de-cafe`
- Subsequent occurrences append an incrementing suffix: `pausa-de-cafe-2`, `pausa-de-cafe-3`, ...

This keeps IDs stable across runs as long as the agenda order remains stable.

## Consequences

- Asset pipelines and UI joins must use the final, de-duplicated `talks[].id`.
- Break / ceremony slots can still be referenced uniquely if needed.

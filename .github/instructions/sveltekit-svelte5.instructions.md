---
description: "Use when implementing, refactoring, or debugging SvelteKit + Svelte 5 code. Enforces runes-first state patterns, canonical type alignment, lazy Tauri plugin usage, layout-level toolbar ownership, and bun run check validation."
name: "SvelteKit Svelte 5 Usage Rules"
applyTo:
  '- "src/routes/**/*.svelte"
  - "src/routes/**/*.ts"
  - "src/lib/components/**/*.svelte"
  - "src/lib/hooks/**/*.svelte.ts"'
---
# SvelteKit + Svelte 5 Usage Rules

## Core Rules
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for app state and derived values.
- Do not add new legacy `writable` stores unless explicitly requested.
- Keep shared mutable state in `.svelte.ts` hooks, route-local state in route/component files.
- Use getter inputs for hooks when values can change over time (for example active workspace/board).

## Type and Domain Alignment
- `src/lib/components/app/types.ts` is the single source of truth for domain types.
- Do not duplicate or redefine domain interfaces in route/component files.
- Keep status literals exactly: `todo | in_progress | done`.
- Use snake_case domain fields (`board_id`, `created_at`, `updated_at`, `timestamp`).

## SvelteKit Structure
- Keep app shell concerns in `src/routes/+layout.svelte`.
- Keep toolbar mounted at layout level, not duplicated in pages.
- Use route pages for feature-specific state and rendering.

## Async and Tauri Safety
- Do not initialize plugin APIs with top-level awaits in module scope.
- Lazy-load Tauri plugin APIs inside functions/effects and guard failures with `try/catch`.
- Do not leave fire-and-forget async calls in effects without rejection handling.

## UI and Style Consistency
- Reuse tokens and theme aliases from `src/routes/layout.css`.
- Prefer existing shadcn-svelte primitives before custom controls.
- Maintain compact desktop density, keyboard-first interaction, and predictable state transitions.

## Validation Requirement
- After meaningful frontend or type edits, run `bun run check`.
- Resolve introduced errors/warnings before finalizing.

## Quick Checklist
- [ ] Runes used correctly (`$derived` for computed values, not effect-sync anti-patterns)
- [ ] Canonical types respected
- [ ] No stale captured hook inputs
- [ ] No unsafe top-level plugin init
- [ ] Toolbar/layout ownership preserved
- [ ] `bun run check` clean

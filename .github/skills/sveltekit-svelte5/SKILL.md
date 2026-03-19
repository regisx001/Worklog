---
name: sveltekit-svelte5
description: 'Build, refactor, and debug features in SvelteKit + Svelte 5 runes. Covers route/layout wiring, component splitting, hook design, type alignment, Tauri plugin safety, toolbar integration, and runtime error triage with bun run check.'
argument-hint: 'Describe the SvelteKit/Svelte 5 task — be specific about the file, symptom, or goal'
---

# SvelteKit + Svelte 5 Skill

## Outcome

Produce production-ready SvelteKit code that is:
- Aligned with canonical types in `src/lib/components/app/types.ts`
- Written with Svelte 5 runes and `.svelte.ts` reactive hooks where appropriate
- Consistent with layout-level UI tokens, desktop-first density, and dark glassy surfaces
- Free of type errors and warnings (`bun run check` passes clean)
- Safe in Tauri contexts: all plugin APIs lazy-loaded and fallback-guarded


## When to Use

Use this skill when tasks include:
- Implementing or migrating features in `+page.svelte`, `+layout.svelte`, or shared components
- Splitting large Svelte components into smaller, typed, composable units
- Moving state ownership between route, layout, or shared hook layers
- Debugging runtime issues (unhandled promise rejections, stale state, broken reactivity)
- Fixing type drift after domain model changes in `types.ts`
- Hardening Tauri plugin calls against non-Tauri or early-load failures
- Improving debug tooling pages (`/debug`) without breaking app conventions


## Project Guardrails

These rules are non-negotiable. Violating any of them is a bug, not a style choice.

- **Canonical types**: `src/lib/components/app/types.ts` is the single source of truth. Never introduce parallel local types for domain objects.
- **Field naming**: Use snake_case for all domain fields (`board_id`, `created_at`, `updated_at`). Never camelCase domain fields.
- **Status values**: Must be exactly `todo | in_progress | done`. Never `in-progress`, `InProgress`, or any variant.
- **Runes over stores**: Prefer `$state`, `$derived`, `$effect` over legacy `writable`/`readable` Svelte stores for app state.
- **Side effects belong in hooks**: Keep repositories, API calls, and plugin interactions out of presentational components.
- **Toolbar at layout level**: The toolbar must be mounted in the layout, never duplicated at route level.
- **No top-level plugin awaits**: Never call Tauri plugin APIs at module load time — lazy-load inside functions or effects.


## Procedure

### 1. Gather Context
- Read all files involved: the target route/component, its parent layout, any hooks it imports, and `types.ts`.
- Identify failure mode: compile-time error, runtime exception, or behavioral regression.
- Reproduce failures before touching code — use `bun run check` for type errors and browser/Tauri logs for runtime issues.

### 2. Align Types
- Diff current code against `types.ts`. List every field or type that has drifted.
- Update all usages consistently: component props, hook signatures, server load return shapes, API call payloads.
- Remove all local re-declarations of canonical types.
- After updates, re-run `bun run check` to confirm alignment before proceeding.

### 3. Design State Ownership
- Ask: is this state needed by more than one route or by the layout?
  - **Yes** → place in a shared `.svelte.ts` hook using `$state` at module scope.
  - **No** → keep it route-local with `$state` inside the component.
- Use getter functions as hook inputs when values can change (e.g., `() => workspacePath` not `workspacePath`).
- Never capture workspace path, active IDs, or user-derived values at initialization time.
- Derived values (filtered lists, computed labels) belong in `$derived`, not re-computed in effects.

### 4. Implement UI in Composable Units
- If a component exceeds ~200 lines or mixes behavior with presentation, split it.
- Parent/hook owns: data fetching, mutations, state, event handlers.
- Child components own: rendering, local interaction, emitting typed events via `$props()`.
- Type all props explicitly — no implicit `any` from `$$props` or untyped destructuring.
- Preserve keyboard accessibility for all primary actions (buttons, form submissions, navigation).

### 5. Harden Async and Plugin Behavior
- Wrap all `$effect` bodies that contain async calls in try/catch. Surface errors to UI state, not just console.
- Lazy-import Tauri plugin APIs inside the function or effect that uses them:
  ```ts
  // Good
  $effect(() => {
    (async () => {
      try {
        const { readDir } = await import('@tauri-apps/plugin-fs');
        files = await readDir(path);
      } catch (e) {
        error = String(e);
      }
    })();
  });

  // Bad — fails at module load outside Tauri
  import { readDir } from '@tauri-apps/plugin-fs';
  ```
- Provide meaningful fallback state when plugin calls are unavailable (empty list, error message, disabled UI).

### 6. Apply Style Consistency
- Import tokens only from `src/routes/layout.css` — do not hardcode color or spacing values.
- Use compact desktop density: tight padding, small font sizes, subtle `1px` borders.
- Prefer existing shadcn-svelte primitives (`Button`, `Input`, `Badge`, etc.) before writing custom elements.
- Dark glassy surfaces: use established background/blur token classes, not arbitrary Tailwind values.

### 7. Validate End-to-End
- Run `bun run check` — fix all errors and warnings before considering the task done.
- Manually verify all changed routes: `/`, `/debug`, any toolbar-linked routes.
- Confirm toolbar still renders correctly and no layout regressions exist.
- Test keyboard paths for primary actions on changed pages.

### 8. Report Changes
- List every changed file with a one-line description of what changed and why.
- Call out any behavior change the user needs to verify manually.
- Note any unresolved risks (e.g., plugin unavailable in browser dev mode).


## Decision Reference

| Situation | Decision |
|---|---|
| State shared across routes or needed by layout | Shared `.svelte.ts` hook with module-level `$state` |
| State used only by one route | Route-local `$state` inside the component |
| Computed/derived value from existing state | `$derived`, not re-computed in `$effect` |
| Plugin call that may fail outside Tauri | Lazy dynamic import inside function/effect with try/catch |
| Field name conflicts with `types.ts` | Migrate all usages — never cast or alias around it |
| Child needs to modify parent state | Pass a typed callback prop, not a writable store |
| Large component (>~200 lines) | Split: parent holds behavior, children hold rendering |


## Completion Checklist

- [ ] No `any` introduced for core domain logic
- [ ] All domain fields and status values match `types.ts` exactly
- [ ] No parallel local type declarations for domain objects
- [ ] No stale hook inputs — dynamic getters used where values can change
- [ ] No unhandled async rejections in effects or server actions
- [ ] All Tauri plugin imports are lazy and fallback-guarded
- [ ] `bun run check` passes with 0 errors and 0 warnings
- [ ] Toolbar mounted at layout level only
- [ ] UI remains keyboard-usable and visually consistent with layout tokens


## Common Pitfalls

- `in-progress` instead of `in_progress` in status values
- Reading removed or renamed fields (e.g., `label` instead of `labels`, `name` instead of `title`)
- Top-level `await` or direct imports of Tauri plugin APIs at module scope
- Mounting toolbar inside a route instead of the shared layout
- Using `$effect` to sync derived state instead of `$derived`
- Passing raw values (not getters) to hooks when the value can change later
- Forgetting to propagate type fixes from `types.ts` to server load functions and API payloads


## Example Prompts

- `/sveltekit-svelte5 migrate this route to canonical ticket types after types.ts update`
- `/sveltekit-svelte5 split this 400-line component into typed subcomponents`
- `/sveltekit-svelte5 fix unhandled promise rejection in workspace hooks`
- `/sveltekit-svelte5 move toolbar state to a runes-based shared hook`
- `/sveltekit-svelte5 harden all plugin calls for use in browser dev mode`
- `/sveltekit-svelte5 debug stale derived state not updating after board switch`
```

***

## Key Improvements Made

- **Guardrails reframed** as non-negotiable rules with explicit reasoning ("this is a bug, not a style choice"), making the AI less likely to compromise on them.
- **Async/plugin section** now includes a concrete code example contrasting good vs. bad Tauri import patterns — the most common failure mode in your stack.
- **State ownership** added a `$derived` vs `$effect` rule, which is a very common Svelte 5 anti-pattern.
- **Decision reference table** condenses all branching logic into one scannable block instead of buried prose.
- **Checklist** expanded with Tauri safety and type-declaration checks.
- **Pitfalls** added three new entries: `$effect` used for derived state, raw values passed to hooks, and missing propagation to server load functions.
- **Example prompts** added two new ones covering browser dev mode hardening and stale derived state debugging.
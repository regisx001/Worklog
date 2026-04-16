# Copilot Instructions — Worklog

## Mission
Worklog is a local-first desktop project manager for small dev teams.
It must feel fast, predictable, and keyboard-first.

## Architecture Snapshot (Current Repo)

### Runtime
- **Shell**: Tauri v2 desktop app
- **Frontend**: SvelteKit + TypeScript
- **UI**: PicoCSS v2 with semantic HTML-first components
- **Package manager**: Bun

### App Shell
- Root shell is in `src/routes/+layout.svelte`.
- `AppToolbar` is mounted at layout level and persists across routes.
- Main product page and debug tools are route-based (`/`, `/debug`).

### Frontend Layers
- `src/lib/components/app/`: app-level feature components (toolbar, kanban, sidebar, detail panel).
- Reusable UI should be authored in-repo with semantic HTML and PicoCSS v2 patterns (no generated shadcn primitives).
- `src/lib/hooks/`: domain hooks (`workspace`, `boards`, `tickets`, `toolbar`) using Svelte runes.
- `src/lib/db/`: local persistence and repository layer (`workspace.repo`, `board.repo`, `ticket.repo`).

### Data Flow
- UI -> hooks -> repo layer -> local storage.
- Keep side effects in hooks/repositories, not inside presentational components.
- Repositories are the source of truth for persistence format and serialization.

### Persistence Note
- Current implementation uses local Tauri SQL plugin and repository adapters in `src/lib/db`.
- Product direction remains local-first and Git-native.
- Never add cloud dependencies or remote backends.

## Canonical Domain Model
- Use `src/lib/components/app/types.ts` as the only canonical type source.
- Hierarchy: `Workspace -> Board -> Ticket`.
- Ticket status values: `todo | in_progress | done`.
- Ticket uses snake_case fields in domain objects (`board_id`, `created_at`, `updated_at`).
- Comments use `author`, `body`, `timestamp`.

## Style System and Visual Language
- Global tokens and theme mapping live in `src/routes/layout.css`.
- Base framework styling comes from PicoCSS v2 (`static/css/pico.min.css`) and semantic HTML elements.
- Primary visual direction:
	- dark, glassy surfaces
	- subtle layered borders
	- small-radius controls
	- compact density for desktop workflows
- Use existing token aliases (`--color-*`, `--color-surface-*`, `--font-display`, etc.) instead of introducing ad-hoc colors.
- Prefer Pico's semantic patterns and minimal custom CSS over utility-heavy styling.
- Maintain typography hierarchy used in app shell/tooling pages:
	- display text for headers
	- compact mono for IDs/debug output
	- muted text for metadata

## Svelte and TypeScript Conventions
- Prefer Svelte 5 runes (`$state`, `$derived`, `$effect`) and `.svelte.ts` hook modules.
- Do not introduce new `writable` stores for app state unless explicitly requested.
- Keep props and callback signatures fully typed. Avoid `any`.
- Handle async failures explicitly (`try/catch`, user-visible errors, or logged context).
- Avoid top-level plugin calls that can fail during module evaluation; initialize lazily in actions/hooks.

## UX and Interaction Rules
- Keyboard-first remains mandatory. Every key action must have a non-mouse path.
- No silent automation for destructive sync/data operations.
- Keep actions explicit and user-triggered.
- Preserve predictable state transitions and immediate local feedback.

## Rust and Tauri Conventions
- Rust command logic stays in `src-tauri/src/lib.rs`.
- Return `Result<T, String>` from Tauri commands.
- Use `serde`/`serde_json` and `git2`; do not shell out to git.
- If using custom titlebar/window controls, ensure matching Tauri capability permissions are defined.

## Quality Gates
- Run `bun run check` after meaningful frontend/type changes.
- Prefer small, composable components and minimal API surface changes.
- Keep debug tooling (`/debug`) operational when touching hooks or persistence.

## Core Principles (Never Violate)
1. Local-first: fully offline, instant startup, no cloud dependency.
2. Predictable: no hidden magic, no silent data mutation.
3. Minimal: features must be useful for daily small-team workflows.
4. Fast: local interactions should feel instant.
5. Git-native direction: data should remain transparent and portable.

## Do Not Suggest
- Cloud sync services, OAuth flows, or remote SaaS dependencies.
- Electron or non-Tauri shells.
- Auto-commit/auto-push without explicit user action.
- Features requiring internet connectivity for core usage.
- shadcn-svelte primitives or generated UI kits.
- Replacing existing architecture with a new framework unless explicitly requested.

# Agent Rules — Worklog

This file defines architectural rules for AI agents (Copilot, Cursor, etc.)
working on the Worklog codebase. These rules are non-negotiable.

---

## Route Structure Rules

- `src/routes/+layout.svelte` — boot gate ONLY
  - Its only job: check workspace status and gate rendering
  - No UI chrome, no data fetching, no component composition here
  - Valid states to handle: `idle`, `loading`, `no_workspace`, `error`, `ready`

- `src/routes/(workspace)/+layout.svelte` — shell ONLY
  - Renders AppToolbar, Sidebar, SyncStatusBar as structural chrome
  - No hook calls, no data fetching, no business logic here
  - Only receives and passes down what it needs for layout

- `src/routes/(workspace)/+page.svelte` — composition ONLY
  - Must contain a single component: `<KanbanWorkspaceView />`
  - No logic, no state, no imports beyond the component itself

- `src/routes/onboarding/+page.svelte` — open folder screen
  - Handles the workspace.pick() flow
  - Shown when status is `no_workspace` or `error`

---

## Component Rules

### Data Flow — Never Violate
- Only `KanbanWorkspaceView` and `Sidebar` may call hooks directly
- All child components receive data via props only
- All child components emit changes via callback props only
- No component below the orchestrator level imports from `$lib/db` or `$lib/hooks`

### Component Responsibilities
- `KanbanWorkspaceView.svelte` — state owner, calls hooks, passes props down
- `KanbanBoard.svelte`         — renders 3 columns, receives tickets[]
- `KanbanColumn.svelte`        — single column, receives filtered tickets by status
- `TicketCard.svelte`          — single ticket display, emits onClick
- `TicketDetailPanel.svelte`   — receives activeTicket, emits onSave / onClose
- `Sidebar.svelte`             — shell with collapsible state
- `SidebarWorkspaceHeader.svelte` — workspace name and meta display
- `SidebarBoardList.svelte`    — board list, active state, create board action

### When to Split a Component
Split only when a component:
1. Has its own independent state
2. Could be reused in another context
3. Has a clearly different job from its parent

Never split by size alone.

---

## Hook Rules

- Hook files must use `.svelte.ts` extension — never plain `.ts`
- Hooks live in `src/lib/hooks/`
- Module-level `$state` is a singleton — intentional for single active board
- Hooks call repositories only — never raw SQL or `$lib/db` connection directly
- Every hook exposes getters, never raw state variables
- No UI side effects inside hooks (no toasts, no navigation, no DOM access)

### Hook Hierarchy
```
useWorkspace      ← boots first, owns path and status
    │
    ├── useBoards(path)
    │       │
    │       └── useTickets(path, boardId)
```

---

## DB / Repository Rules

- All SQL lives in `src/lib/db/repositories/`
- One file per entity: `workspace.repo.ts`, `board.repo.ts`, `ticket.repo.ts`
- Repository functions are pure async functions — no state, no side effects
- `labels` and `comments` are stored as JSON strings in SQLite — always
  serialize on write and deserialize on read inside the repo
- `getDb(path)` is a singleton — never instantiate Database directly outside connection.ts
- Never bypass the repo layer — no direct `db.execute()` calls outside repositories

---

## Type Rules

- All shared types live in `src/lib/components/app/types.ts` — single source of truth
- Never redefine types locally in a component or hook
- Input types use `Pick` or `Partial` — never duplicate full interface fields
- `labels: string[]` and `comments: Comment[]` are always arrays in TypeScript,
  never raw JSON strings (deserialization is the repo's responsibility)

---

## Naming Conventions

| Pattern | Convention |
|---|---|
| Route groups | `(groupname)` — SvelteKit parentheses syntax |
| Hook files | `noun.svelte.ts` — e.g. `tickets.svelte.ts` |
| Repo files | `noun.repo.ts` — e.g. `ticket.repo.ts` |
| Components | PascalCase — e.g. `TicketCard.svelte` |
| State vars | `_noun` prefix — e.g. `_tickets`, `_loading` |
| IDs | `PREFIX-XXXXXX` — e.g. `TKT-A1B2C3`, `BRD-X9Y8Z7` |

---

## What Never Belongs in This Codebase

- No database other than SQLite (no IndexedDB, no PouchDB, no external DB)
- No cloud sync, no OAuth, no external API calls in Phase 1
- No auto-commit or auto-push without explicit user action
- No analytics, charts, or reporting features
- No Agile/Scrum constructs (sprints, story points, velocity)
- No real-time collaboration features
- No Electron — Tauri only
- No feature that requires an internet connection in Phase 1
- No drag-and-drop as the sole interaction method for status change

---

## Phase Awareness

The codebase is in **Phase 1 — Local Core**.
- Git operations are stubbed (get_sync_status returns empty, push/pull are no-ops)
- JSON export/import mapper does not exist yet — do not build it in Phase 1
- All features must work fully offline with zero network access

Do not introduce Phase 2 or Phase 3 code unless explicitly instructed.
```

***

Two notes on this file:

- The **"What Never Belongs"** section is the most valuable part for agents — it prevents Copilot and Cursor from suggesting Electron patterns, cloud dependencies, or over-engineered features mid-autocomplete.
- The **Phase Awareness** section at the bottom explicitly prevents agents from implementing Git sync stubs as real features — a common mistake when AI tools try to "complete" your architecture.
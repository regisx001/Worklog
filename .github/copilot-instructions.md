# Copilot Instructions — Worklog

## Project Overview
Worklog is a local-first, Git-backed project management desktop application
for solo developers and small teams (2–5 people). It replaces bloated SaaS
tools by storing all data as JSON files inside a Git repository and syncing
via standard Git push/pull.

## Tech Stack
- **Shell**: Tauri (Rust backend + WebView frontend)
- **Frontend**: SvelteKit + TypeScript
- **UI**: TailwindCSS + shadcn-svelte
- **Data**: JSON files on the filesystem (no database)
- **Git ops**: `git2` Rust crate (no shelling out to git binary)
- **Package manager**: Bun

## Project Structure
- `src/` — SvelteKit frontend
- `src/lib/components/app/` — core app components (Kanban, Sidebar, etc.)
- `src/lib/components/ui/` — shadcn-svelte primitives (do not modify directly)
- `src/lib/hooks/` — Svelte stores and Tauri invoke wrappers
- `src/lib/components/app/types.ts` — canonical shared types
- `src-tauri/src/lib.rs` — all Tauri commands (Rust)
- `src-tauri/src/main.rs` — Tauri app entry point

## Core Data Model
- **Hierarchy**: Project → Board → Tickets
- **Ticket statuses**: `todo` | `in_progress` | `done`
- **Storage path**: `.Worklog/tickets/TKT-XXX.json` inside any Git repo
- **Ticket fields**: `id`, `title`, `status`, `labels`, `description`, `comments`, `created_at`, `updated_at`
- One JSON file per ticket — never batch tickets into a single file

## Coding Conventions

### TypeScript / Svelte
- Use types from `src/lib/components/app/types.ts` — never redefine them locally
- Prefer `writable` Svelte stores with explicit `load()`, `save()`, `remove()` functions
- No reactive auto-save — all persistence is intentional and user-triggered
- Component props must be typed; avoid `any`
- Use `invoke()` from `@tauri-apps/api/core` for all backend calls

### Rust
- All filesystem and Git operations live in `src-tauri/src/lib.rs`
- Return `Result<T, String>` from all Tauri commands — serialize errors as plain strings
- Use `serde`, `serde_json`, `std::fs` for file operations
- Use `git2` crate for Git operations — never use `std::process::Command` to call git
- Use `uuid` crate (v4) for generating ticket IDs

### General
- No external network calls — this app is fully offline
- No hidden automation or background processes except a 30-second Git status poll
- Keyboard-first UX: every action must be reachable without a mouse
- If a feature won't be used daily by a small dev team, do not add it

## Core Principles (never violate)
1. **Local-first** — fully offline, instant startup, no cloud dependency
2. **Git-native** — all data lives as human-readable files in the repo
3. **Minimal** — only features a small dev team uses every day
4. **Predictable** — no hidden magic, no silent auto-merges
5. **Fast** — every interaction is instant; no loading spinners for local ops

## What This App Is NOT
- Not real-time collaboration
- Not an analytics or reporting tool
- Not an Agile/Scrum framework enforcer
- Not a SaaS or cloud-dependent product
- Not an Electron app (Tauri only)

## Tauri Command Naming Convention
- init_repo(path) → initialize .Worklog/ in a Git repo
- list_tickets(path) → return Vec<Ticket>
- save_ticket(path, ticket) → write TKT-XXX.json
- delete_ticket(path, id) → remove TKT-XXX.json
- git_status(path) → return { ahead, behind, dirty }



## Do Not Suggest
- Any database (SQLite, IndexedDB, etc.)
- Any cloud sync service or OAuth flow
- Electron or any non-Tauri shell
- Auto-commit or auto-push without explicit user action
- Drag-and-drop as the *only* way to change ticket status
- Any feature that requires an internet connection

# Worklog

[![CI](https://github.com/regisx001/Worklog/actions/workflows/ci.yml/badge.svg)](https://github.com/regisx001/Worklog/actions/workflows/ci.yml)
[![Publish](https://github.com/regisx001/Worklog/actions/workflows/release.yml/badge.svg)](https://github.com/regisx001/Worklog/actions/workflows/release.yml)


Worklog is a local-first desktop project manager for small development teams.
It is built for fast, keyboard-first planning with a Kanban workflow and zero cloud dependency for core usage.

<img width="1577" height="820" alt="Screenshot From 2026-03-20 03-16-53" src="https://github.com/user-attachments/assets/ed933e6d-9265-4572-99f0-183d2d1681ae" />


## Core Principles

- Local-first: data is stored locally and available offline.
- Predictable: explicit actions, no hidden automation.
- Minimal: focused on everyday team task tracking.
- Fast: desktop-native shell and local storage.
- Git-native direction: transparent, portable project data.

## Stack

- Desktop shell: Tauri v2
- Frontend: SvelteKit + TypeScript
- Styling: TailwindCSS v4 + shadcn-svelte UI primitives
- Runtime and package manager: Bun
- Local persistence: SQLite via Tauri SQL plugin

## Current Features

- Workspace, board, and ticket hierarchy
- Kanban board with Todo, In Progress, Done columns
- Ticket detail panel with inline editing and comments
- Command palette and keyboard shortcuts
- Board and ticket context menus with actions
- Local workspace persistence and auto-restore behavior

## Project Structure

- [src](src): SvelteKit frontend app
- [src/lib/components/app](src/lib/components/app): App feature components
- [src/lib/components/ui](src/lib/components/ui): Reusable UI primitives
- [src/lib/hooks](src/lib/hooks): Runes-based state and domain hooks
- [src/lib/db](src/lib/db): Repository and local database layer
- [src-tauri](src-tauri): Rust and Tauri desktop runtime
- [.github/workflows](.github/workflows): CI and release pipelines

## Prerequisites

- Bun
- Rust stable toolchain
- Tauri system dependencies for your OS

Linux dependencies used in CI:

```bash
sudo apt-get update
sudo apt-get install -y \
	build-essential \
	pkg-config \
	libgtk-3-dev \
	libwebkit2gtk-4.1-dev \
	libappindicator3-dev \
	librsvg2-dev \
	patchelf
```

## Getting Started

Install dependencies:

```bash
bun install --frozen-lockfile
```

Run frontend only:

```bash
bun run dev
```

Run desktop app in development mode:

```bash
bun run tauri dev
```

## Development Commands

Type and Svelte checks:

```bash
bun run check
```

Frontend build:

```bash
bun run build
```

Desktop build:

```bash
bun run tauri:build
```

## Keyboard Shortcuts

- Ctrl/Cmd + K: open command palette
- Ctrl/Cmd + N: create ticket
- Ctrl/Cmd + B: open create board dialog
- Ctrl/Cmd + S: manual sync action
- M on focused ticket: quick move to next status
- Escape: close ticket detail panel

## Local Data

Worklog stores app data in a local SQLite database under the selected workspace path:

- .worklog/worklog.db

No cloud backend is required for normal operation.

## CI

The CI workflow is in [ci.yml](.github/workflows/ci.yml).

It runs on pushes to master and pull requests only when core code files change, including:

- frontend source
- Tauri source
- core build config files
- CI workflow file itself

## Releases

The publish workflow is in [release.yml](.github/workflows/release.yml).

Releases are tag-driven and trigger when a tag matching app-v* is pushed.

### Release Steps

1. Update version in all three files:
	 - [package.json](package.json)
	 - [src-tauri/Cargo.toml](src-tauri/Cargo.toml)
	 - [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)
2. Commit and push changes.
3. Create and push a release tag:

```bash
git tag -a app-v0.1.0 -m "Release app-v0.1.0"
git push origin app-v0.1.0
```

4. GitHub Actions builds and uploads artifacts for macOS, Linux, and Windows.
5. The workflow also builds and uploads AUR-ready artifacts (PKGBUILD, .SRCINFO, package tarball).

## Recommended IDE Setup

- VS Code
- Svelte extension
- Tauri extension
- rust-analyzer extension

## License

MIT

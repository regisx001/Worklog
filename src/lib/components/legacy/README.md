# Legacy UI Components

This folder stores UI components moved out of the active app layer during the Carbon migration.

## Why these files are here

The active UI is being rebuilt on Carbon components. Files in this folder remain for:
- rollback safety,
- migration reference,
- temporary route compatibility.

## Current legacy scope

- `app/kanban/*`
- `app/layout/drawer/AppDrawer.svelte`
- `app/layout/modal/AppModal.svelte`
- `app/layout/toolbar/AppToolbar.legacy.svelte`
- `routes/workspace/boards/[board_id]/+page.legacy.svelte`
- `routes/workspace/boards/[board_id]/+page.legacy.ts`

## Migration policy

- New feature work should target `src/lib/components/app/*`.
- Legacy files are removed only after the Carbon replacement ships and route imports no longer reference this folder.

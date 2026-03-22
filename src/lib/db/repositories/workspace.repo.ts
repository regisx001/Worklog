import type Database from '@tauri-apps/plugin-sql';
import type { WorkspaceMeta } from '$lib/components/app/types';
import { SCHEMA_VERSION } from '$lib/db/schema';

export async function initWorkspace(db: Database, name: string): Promise<void> {
    await db.execute(
        `INSERT OR IGNORE INTO workspace_meta (id, name, schema_version, sync_mode, created_at)
     VALUES (1, ?, ?, 'local', ?)`,
        [name, SCHEMA_VERSION, new Date().toISOString()]
    );

    await db.execute(
        `UPDATE workspace_meta SET schema_version = ? WHERE id = 1`,
        [SCHEMA_VERSION],
    );
}

export async function getWorkspaceMeta(db: Database): Promise<WorkspaceMeta | null> {
    const rows = await db.select<WorkspaceMeta[]>(
        `SELECT name, schema_version, sync_mode, created_at FROM workspace_meta WHERE id = 1`
    );
    return rows[0] ?? null;
}

export async function updateWorkspaceName(db: Database, name: string): Promise<void> {
    await db.execute(
        `UPDATE workspace_meta SET name = ? WHERE id = 1`,
        [name]
    );
}

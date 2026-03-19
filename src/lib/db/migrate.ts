import type Database from '@tauri-apps/plugin-sql';
import { SCHEMA_VERSION } from './schema';

export async function runMigrations(db: Database): Promise<void> {
    const rows = await db.select<{ schema_version: number }[]>(
        `SELECT schema_version FROM workspace_meta WHERE id = 1`
    );

    const current = rows[0]?.schema_version ?? 0;

    if (current === SCHEMA_VERSION) return;

    // Future migrations slot in here as if/else blocks:
    // if (current < 2) { await migrate_v2(db); }
    // if (current < 3) { await migrate_v3(db); }

    await db.execute(
        `UPDATE workspace_meta SET schema_version = ? WHERE id = 1`,
        [SCHEMA_VERSION]
    );
}

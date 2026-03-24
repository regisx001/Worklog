import type Database from '@tauri-apps/plugin-sql';
import { SCHEMA_VERSION } from './schema';

async function migrate_v2(db: Database): Promise<void> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS app_settings (
            id                INTEGER PRIMARY KEY CHECK (id = 1),
            author_name       TEXT NOT NULL DEFAULT '',
            default_branch    TEXT NOT NULL DEFAULT 'main',
            autosave_seconds  INTEGER NOT NULL DEFAULT 10,
            created_at        TEXT NOT NULL,
            updated_at        TEXT NOT NULL
        )
    `);
}

async function migrate_v3(db: Database): Promise<void> {
    const columns = await db.select<Array<{ name: string }>>(`PRAGMA table_info(tickets)`);
    const hasPriority = columns.some((column) => column.name === 'priority');

    if (!hasPriority) {
        await db.execute(`
            ALTER TABLE tickets
            ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
            CHECK (priority IN ('low', 'medium', 'high'))
        `);
    }

    await db.execute(
        `CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority)`
    );
}

export async function runMigrations(db: Database): Promise<void> {
    const rows = await db.select<{ schema_version: number }[]>(
        `SELECT schema_version FROM workspace_meta WHERE id = 1`
    );

    const current = rows[0]?.schema_version ?? 0;

    if (current === SCHEMA_VERSION) return;

    if (current < 2) {
        await migrate_v2(db);
    }

    if (current < 3) {
        await migrate_v3(db);
    }

    await db.execute(
        `UPDATE workspace_meta SET schema_version = ? WHERE id = 1`,
        [SCHEMA_VERSION]
    );
}

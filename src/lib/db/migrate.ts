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

async function migrate_v4(db: Database): Promise<void> {
    const columns = await db.select<Array<{ name: string }>>(
        `PRAGMA table_info(tickets)`
    );

    if (columns.length === 0) {
        return;
    }

    const hasStatus = columns.some((column) => column.name === 'status');
    const hasPriority = columns.some((column) => column.name === 'priority');
    const hasTicketType = columns.some((column) => column.name === 'ticket_type');
    const hasDueDate = columns.some((column) => column.name === 'due_date');

    const statusExpr = hasStatus
        ? `CASE
            WHEN status IN ('backlog', 'todo', 'in_progress', 'done') THEN status
            ELSE 'todo'
          END`
        : `'todo'`;

    const priorityExpr = hasPriority
        ? `CASE
            WHEN priority = 'p1' THEN 'p1'
            WHEN priority = 'p2' THEN 'p2'
            WHEN priority = 'p3' THEN 'p3'
            WHEN priority = 'high' THEN 'p1'
            WHEN priority = 'medium' THEN 'p2'
            WHEN priority = 'low' THEN 'p3'
            ELSE 'p2'
          END`
        : `'p2'`;

    const ticketTypeExpr = hasTicketType
        ? `CASE
            WHEN ticket_type IN ('feature', 'bug', 'chore') THEN ticket_type
            ELSE 'feature'
          END`
        : `'feature'`;

    const dueDateExpr = hasDueDate ? `due_date` : `NULL`;

    await db.execute(`PRAGMA foreign_keys = OFF`);
    await db.execute(`BEGIN TRANSACTION`);

    try {
        await db.execute(`ALTER TABLE tickets RENAME TO tickets_legacy`);

        await db.execute(`
            CREATE TABLE tickets (
                id          TEXT PRIMARY KEY,
                board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
                title       TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status      TEXT NOT NULL DEFAULT 'todo'
                            CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')),
                priority    TEXT NOT NULL DEFAULT 'p2'
                            CHECK (priority IN ('p1', 'p2', 'p3')),
                ticket_type TEXT NOT NULL DEFAULT 'feature'
                            CHECK (ticket_type IN ('feature', 'bug', 'chore')),
                due_date    TEXT,
                labels      TEXT NOT NULL DEFAULT '[]',
                comments    TEXT NOT NULL DEFAULT '[]',
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )
        `);

        await db.execute(`
            INSERT INTO tickets (
                id,
                board_id,
                title,
                description,
                status,
                priority,
                ticket_type,
                due_date,
                labels,
                comments,
                created_at,
                updated_at
            )
            SELECT
                id,
                board_id,
                title,
                description,
                ${statusExpr},
                ${priorityExpr},
                ${ticketTypeExpr},
                ${dueDateExpr},
                labels,
                comments,
                created_at,
                updated_at
            FROM tickets_legacy
        `);

        await db.execute(`DROP TABLE tickets_legacy`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tickets_board_id ON tickets(board_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority)`);
        await db.execute(
            `CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON tickets(ticket_type)`
        );
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date)`);

        await db.execute(`COMMIT`);
    } catch (error) {
        await db.execute(`ROLLBACK`);
        throw error;
    } finally {
        await db.execute(`PRAGMA foreign_keys = ON`);
    }
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

    if (current < 4) {
        await migrate_v4(db);
    }

    await db.execute(
        `UPDATE workspace_meta SET schema_version = ? WHERE id = 1`,
        [SCHEMA_VERSION]
    );
}

import type Database from '@tauri-apps/plugin-sql';
import type { AppSettings, UpdateAppSettingsInput } from '$lib/components/app/types';

function toSettings(row: AppSettings): AppSettings {
    return {
        author_name: row.author_name,
        default_branch: row.default_branch,
        autosave_seconds: Number(row.autosave_seconds),
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

export async function initSettings(db: Database): Promise<void> {
    const now = new Date().toISOString();

    await db.execute(
        `INSERT OR IGNORE INTO app_settings (
            id,
            author_name,
            default_branch,
            autosave_seconds,
            created_at,
            updated_at
        ) VALUES (1, '', 'main', 10, ?, ?)`,
        [now, now],
    );
}

export async function getSettings(db: Database): Promise<AppSettings> {
    await initSettings(db);

    const rows = await db.select<AppSettings[]>(
        `SELECT author_name, default_branch, autosave_seconds, created_at, updated_at
         FROM app_settings
         WHERE id = 1`,
    );

    return toSettings(rows[0]);
}

export async function updateSettings(
    db: Database,
    input: UpdateAppSettingsInput,
): Promise<AppSettings> {
    const existing = await getSettings(db);

    const next: AppSettings = {
        ...existing,
        ...input,
        autosave_seconds:
            input.autosave_seconds ?? existing.autosave_seconds,
        updated_at: new Date().toISOString(),
    };

    await db.execute(
        `UPDATE app_settings
         SET author_name = ?,
             default_branch = ?,
             autosave_seconds = ?,
             updated_at = ?
         WHERE id = 1`,
        [
            next.author_name,
            next.default_branch,
            next.autosave_seconds,
            next.updated_at,
        ],
    );

    return next;
}

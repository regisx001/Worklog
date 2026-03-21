import Database from '@tauri-apps/plugin-sql';
import { mkdir, exists } from '@tauri-apps/plugin-fs';
import { CREATE_TABLES } from './schema';

let _db: Database | null = null;
let _dbWorkspacePath: string | null = null;

export async function getDb(workspacePath: string): Promise<Database> {
    if (_db && _dbWorkspacePath === workspacePath) return _db;

    if (_db && _dbWorkspacePath !== workspacePath) {
        await _db.close();
        _db = null;
        _dbWorkspacePath = null;
    }

    // ── Ensure .worklog/ directory exists ──────────────
    const dirPath = `${workspacePath}/.worklog`;
    const dirExists = await exists(dirPath);
    if (!dirExists) {
        await mkdir(dirPath, { recursive: true });
    }

    // ── Open or create the SQLite database ─────────────
    _db = await Database.load(`sqlite:${workspacePath}/.worklog/worklog.db`);
    _dbWorkspacePath = workspacePath;
    await _db.execute(CREATE_TABLES);
    return _db;
}

export async function closeDb(): Promise<void> {
    if (_db) {
        await _db.close();
        _db = null;
        _dbWorkspacePath = null;
    }
}

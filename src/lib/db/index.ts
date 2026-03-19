import Database from '@tauri-apps/plugin-sql';
import { CREATE_TABLES } from './schema';

let _db: Database | null = null;

export async function getDb(workspacePath: string): Promise<Database> {
    if (_db) return _db;
    _db = await Database.load(`sqlite:${workspacePath}/.worklog/worklog.db`);
    await _db.execute(CREATE_TABLES);
    return _db;
}

export async function closeDb(): Promise<void> {
    if (_db) {
        await _db.close();
        _db = null;
    }
}

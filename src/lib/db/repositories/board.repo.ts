import type Database from '@tauri-apps/plugin-sql';
import type { Board, CreateBoardInput } from '$lib/components/app/types';
import { generateId } from '$lib/utils';

export async function listBoards(db: Database): Promise<Board[]> {
    return db.select<Board[]>(
        `SELECT * FROM boards ORDER BY created_at ASC`
    );
}

export async function getBoardById(db: Database, id: string): Promise<Board | null> {
    const rows = await db.select<Board[]>(
        `SELECT * FROM boards WHERE id = ?`, [id]
    );
    return rows[0] ?? null;
}

export async function createBoard(db: Database, input: CreateBoardInput): Promise<Board> {
    const board: Board = {
        id: generateId('BRD'),
        name: input.name,
        description: input.description ?? '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    await db.execute(
        `INSERT INTO boards (id, name, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
        [board.id, board.name, board.description, board.created_at, board.updated_at]
    );

    return board;
}

export async function deleteBoard(db: Database, id: string): Promise<void> {
    // Tickets cascade-deleted automatically via FK
    await db.execute(`DELETE FROM boards WHERE id = ?`, [id]);
}

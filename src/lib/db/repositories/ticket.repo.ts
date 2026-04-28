import type Database from '@tauri-apps/plugin-sql';
import type { Ticket, CreateTicketInput, UpdateTicketInput } from '$lib/components/app/types';
import { generateId } from '$lib/utils';

// SQLite stores labels/comments as JSON strings — deserialize on read
function deserialize(row: any): Ticket {
    return {
        ...row,
        priority: row.priority ?? 'p2',
        ticket_type: row.ticket_type ?? 'feature',
        due_date: row.due_date ?? null,
        labels: typeof row.labels === 'string' ? JSON.parse(row.labels) : row.labels,
        comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : row.comments,
    };
}

export async function listTickets(db: Database, board_id: string): Promise<Ticket[]> {
    const rows = await db.select<any[]>(
        `SELECT * FROM tickets WHERE board_id = ? ORDER BY position ASC, created_at ASC`,
        [board_id]
    );
    return rows.map(deserialize);
}

export async function getTicketById(db: Database, id: string): Promise<Ticket | null> {
    const rows = await db.select<any[]>(
        `SELECT * FROM tickets WHERE id = ?`, [id]
    );
    return rows[0] ? deserialize(rows[0]) : null;
}

export async function createTicket(db: Database, input: CreateTicketInput): Promise<Ticket> {
    let position = input.position;
    if (position === undefined) {
        const rows = await db.select<{maxPos: number | null}[]>(
            `SELECT MAX(position) as maxPos FROM tickets WHERE board_id = ? AND status = ?`,
            [input.board_id, input.status ?? 'todo']
        );
        const maxPos = rows[0]?.maxPos ?? 0;
        position = maxPos + 1000;
    }

    const ticket: Ticket = {
        id: generateId('TKT'),
        board_id: input.board_id,
        title: input.title,
        description: input.description ?? '',
        status: input.status ?? 'todo',
        priority: input.priority ?? 'p2',
        ticket_type: input.ticket_type ?? 'feature',
        position,
        due_date: input.due_date ?? null,
        labels: input.labels ?? [],
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    await db.execute(
        `INSERT INTO tickets (id, board_id, title, description, status, priority, ticket_type, position, due_date, labels, comments, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ticket.id, ticket.board_id, ticket.title, ticket.description,
            ticket.status,
            ticket.priority,
            ticket.ticket_type,
            ticket.position,
            ticket.due_date,
            JSON.stringify(ticket.labels),
            JSON.stringify(ticket.comments),
            ticket.created_at, ticket.updated_at
        ]
    );

    return ticket;
}

export async function updateTicket(db: Database, id: string, input: UpdateTicketInput): Promise<Ticket> {
    const existing = await getTicketById(db, id);
    if (!existing) throw new Error(`Ticket ${id} not found`);

    const updated: Ticket = {
        ...existing,
        ...input,
        updated_at: new Date().toISOString(),
    };

    await db.execute(
        `UPDATE tickets
     SET title = ?, description = ?, status = ?, priority = ?, ticket_type = ?, position = ?, due_date = ?, labels = ?, comments = ?, updated_at = ?
     WHERE id = ?`,
        [
            updated.title, updated.description, updated.status,
            updated.priority,
            updated.ticket_type,
            updated.position,
            updated.due_date,
            JSON.stringify(updated.labels),
            JSON.stringify(updated.comments),
            updated.updated_at, id
        ]
    );

    return updated;
}

export async function deleteTicket(db: Database, id: string): Promise<void> {
    await db.execute(`DELETE FROM tickets WHERE id = ?`, [id]);
}

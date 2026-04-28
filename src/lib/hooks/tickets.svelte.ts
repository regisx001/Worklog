import type { Ticket, CreateTicketInput, UpdateTicketInput } from '$lib/components/app/types';
import { getDb, TicketRepo } from '$lib/db';


let _tickets = $state<Ticket[]>([]);
let _loading = $state(false);

export function useTickets(
    getWorkspacePath: () => string | null,
    getBoardId: () => string | null,
) {
    function requireWorkspacePath(): string {
        const path = getWorkspacePath();
        if (!path) throw new Error('No workspace selected');
        return path;
    }

    function requireBoardId(): string {
        const boardId = getBoardId();
        if (!boardId) throw new Error('No active board selected');
        return boardId;
    }

    async function load() {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();
        if (!workspacePath || !boardId) {
            _tickets = [];
            return;
        }

        _loading = true;
        const db = await getDb(workspacePath);
        _tickets = await TicketRepo.listTickets(db, boardId);
        _loading = false;
    }

    async function create(input: CreateTicketInput) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        const ticket = await TicketRepo.createTicket(db, input);
        _tickets = [..._tickets, ticket].sort((a, b) => a.position - b.position);       // ← state update
        return ticket;
    }

    async function update(id: string, input: UpdateTicketInput) {
        const workspacePath = requireWorkspacePath();
        requireBoardId();
        const db = await getDb(workspacePath);
        const ticket = await TicketRepo.updateTicket(db, id, input);
        _tickets = _tickets.map(t => t.id === id ? ticket : t).sort((a, b) => a.position - b.position); // ← state update
        return ticket;
    }

    async function remove(id: string) {
        const workspacePath = requireWorkspacePath();
        requireBoardId();
        const db = await getDb(workspacePath);
        await TicketRepo.deleteTicket(db, id);
        _tickets = _tickets.filter(t => t.id !== id); // ← state update
    }

    return {
        get tickets() { return _tickets },
        get loading() { return _loading },
        load, create, update, remove
    };
}

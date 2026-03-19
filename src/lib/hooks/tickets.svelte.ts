import type { Ticket, CreateTicketInput, UpdateTicketInput } from '$lib/components/app/types';
import { getDb, TicketRepo } from '$lib/db';


let _tickets = $state<Ticket[]>([]);
let _loading = $state(false);

export function useTickets(workspacePath: string, boardId: string) {

    async function load() {
        _loading = true;
        const db = await getDb(workspacePath);
        _tickets = await TicketRepo.listTickets(db, boardId);
        _loading = false;
    }

    async function create(input: CreateTicketInput) {
        const db = await getDb(workspacePath);
        const ticket = await TicketRepo.createTicket(db, input);
        _tickets = [..._tickets, ticket];       // ← state update
        return ticket;
    }

    async function update(id: string, input: UpdateTicketInput) {
        const db = await getDb(workspacePath);
        const ticket = await TicketRepo.updateTicket(db, id, input);
        _tickets = _tickets.map(t => t.id === id ? ticket : t); // ← state update
        return ticket;
    }

    async function remove(id: string) {
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

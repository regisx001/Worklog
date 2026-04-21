import type { Ticket, TicketStatus } from "$lib/components/app/types.js";

export type TaskStatus = TicketStatus;

export type Task = Ticket;

export interface BoardSidebarItem {
    id: string;
    name: string;
    description: string;
    issueCount: number;
}

export interface KanbanColumnConfig {
    status: TaskStatus;
    label: string;
    hint: string;
}

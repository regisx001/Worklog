import type { TicketPriority, TicketStatus } from "$lib/components/app/types.js";

export type TaskStatus = TicketStatus;

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TicketPriority;
    labels: string[];
    updatedAt: string;
}

export interface KanbanColumnConfig {
    status: TaskStatus;
    label: string;
    hint: string;
}

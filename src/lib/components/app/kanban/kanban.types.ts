import type { TicketPriority, TicketStatus } from "$lib/components/app/types.js";

export type TaskStatus = TicketStatus;

export interface Task {
    id: string;
    board_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TicketPriority;
    labels: string[];
    updatedAt: string;
}

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

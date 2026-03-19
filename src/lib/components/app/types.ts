export type TicketStatus = "todo" | "in-progress" | "done";

export type SyncState = "up_to_date" | "pending_changes" | "syncing";

export interface TicketComment {
    id: string;
    author: string;
    body: string;
    createdAt: string;
}

export interface Ticket {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: TicketStatus;
    label: string;
    assignee?: string;
    comments: TicketComment[];
}

export interface Project {
    id: string;
    name: string;
    localChanges: number;
    lastSyncedAt: string;
}

export interface CommandAction {
    id: string;
    label: string;
    subtitle: string;
    shortcut: string;
    run: () => void;
}

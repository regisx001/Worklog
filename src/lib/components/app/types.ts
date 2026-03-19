export type TicketStatus = "todo" | "in_progress" | "done";

export type SyncState = "up_to_date" | "pending_changes" | "syncing";

export interface TicketComment {
    id: string;
    author: string;
    body: string;
    createdAt: string;
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



export type SyncMode = "local" | "git";

export interface WorkspaceMeta {
    name: string;
    schema_version: number;
    sync_mode: SyncMode;
    created_at: string;
}

export interface Board {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Comment {
    author: string;
    body: string;
    timestamp: string;
}

export interface Ticket {
    id: string;
    board_id: string;
    title: string;
    description: string;
    status: TicketStatus;
    labels: string[];
    comments: Comment[];
    created_at: string;
    updated_at: string;
}

// Input types — no id, no timestamps (generated internally)
export type CreateBoardInput = Pick<Board, "name" | "description">;
export type CreateTicketInput = Pick<Ticket, "board_id" | "title" | "description" | "labels">;
export type UpdateTicketInput = Partial<Pick<Ticket, "title" | "description" | "status" | "labels" | "comments">>;

export type TicketStatus = "backlog" | "todo" | "in_progress" | "done";
export type TicketPriority = "p1" | "p2" | "p3";
export type TicketType = "feature" | "bug" | "chore" | "improvement" | "epic" | "spike";

export type SyncState = "up_to_date" | "pending_changes" | "syncing";

// ── Ticket Type Config ─────────────────────────────────────────────────────
// Centralized display config for ticket types, statuses, and priorities.
// Carbon icon components are imported by consumers — we reference by string key here.

export interface TicketTypeConfig {
    label: string;
    /** Carbon Tag type color */
    tagColor: "teal" | "blue" | "magenta" | "purple" | "cyan" | "green" | "red" | "warm-gray" | "cool-gray" | "high-contrast";
}

export const TICKET_TYPE_CONFIG: Record<TicketType, TicketTypeConfig> = {
    feature:     { label: "Feature",     tagColor: "teal" },
    bug:         { label: "Bug",         tagColor: "red" },
    chore:       { label: "Chore",       tagColor: "warm-gray" },
    improvement: { label: "Improvement", tagColor: "cyan" },
    epic:        { label: "Epic",        tagColor: "purple" },
    spike:       { label: "Spike",       tagColor: "magenta" },
};

export const TICKET_TYPE_OPTIONS: TicketType[] = ["feature", "bug", "chore", "improvement", "epic", "spike"];

export interface TicketStatusConfig {
    label: string;
    accentColor: string;
}

export const TICKET_STATUS_CONFIG: Record<TicketStatus, TicketStatusConfig> = {
    backlog:     { label: "Backlog",     accentColor: "magenta" },
    todo:        { label: "To Do",       accentColor: "teal" },
    in_progress: { label: "In Progress", accentColor: "blue" },
    done:        { label: "Done",        accentColor: "green" },
};

export const TICKET_STATUS_ORDER: TicketStatus[] = ["backlog", "todo", "in_progress", "done"];

export interface TicketPriorityConfig {
    label: string;
    tagColor: "green" | "teal" | "red";
}

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, TicketPriorityConfig> = {
    p3: { label: "Low",    tagColor: "green" },
    p2: { label: "Medium", tagColor: "teal" },
    p1: { label: "High",   tagColor: "red" },
};

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

export interface AppSettings {
    author_name: string;
    default_branch: string;
    autosave_seconds: number;
    created_at: string;
    updated_at: string;
}

export type UpdateAppSettingsInput = Partial<
    Pick<AppSettings, "author_name" | "default_branch" | "autosave_seconds">
>;

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
    priority: TicketPriority;
    ticket_type: TicketType;
    position: number;
    due_date: string | null;
    labels: string[];
    comments: Comment[];
    created_at: string;
    updated_at: string;
}

// Input types — no id, no timestamps (generated internally)
export type CreateBoardInput = Pick<Board, "name" | "description">;
export type CreateTicketInput = Pick<
    Ticket,
    "board_id" | "title" | "description" | "labels"
> &
    Partial<Pick<Ticket, "status" | "priority" | "ticket_type" | "position" | "due_date">>;
export type UpdateTicketInput = Partial<
    Pick<
        Ticket,
        | "title"
        | "description"
        | "status"
        | "priority"
        | "ticket_type"
        | "position"
        | "due_date"
        | "labels"
        | "comments"
    >
>;

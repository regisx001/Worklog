export type TicketStatus = "backlog" | "todo" | "in_progress" | "done";
export type TicketPriority = "p1" | "p2" | "p3";
export type TicketType = "feature" | "bug" | "chore" | "improvement" | "epic" | "spike" | "story" | "task" | "subtask" | "incident" | "design" | "documentation";

export type SyncState = "up_to_date" | "pending_changes" | "syncing";

import * as m from "$lib/paraglide/messages.js";

// ── Ticket Type Config ─────────────────────────────────────────────────────
// Centralized display config for ticket types, statuses, and priorities.
// Carbon icon components are imported by consumers — we reference by string key here.

export interface TicketTypeConfig {
    label: string;
    /** Carbon Tag type color */
    tagColor: "teal" | "blue" | "magenta" | "purple" | "cyan" | "green" | "red" | "warm-gray" | "cool-gray" | "high-contrast";
}

export const TICKET_TYPE_CONFIG: Record<TicketType, TicketTypeConfig> = {
    feature: { get label() { return m.ticket_type_feature(); }, tagColor: "teal" },
    bug: { get label() { return m.ticket_type_bug(); }, tagColor: "red" },
    chore: { get label() { return m.ticket_type_chore(); }, tagColor: "warm-gray" },
    improvement: { get label() { return m.ticket_type_improvement(); }, tagColor: "cyan" },
    epic: { get label() { return m.ticket_type_epic(); }, tagColor: "purple" },
    spike: { get label() { return m.ticket_type_spike(); }, tagColor: "magenta" },
    story: { get label() { return m.ticket_type_story(); }, tagColor: "blue" },
    task: { get label() { return m.ticket_type_task(); }, tagColor: "cool-gray" },
    subtask: { get label() { return m.ticket_type_subtask(); }, tagColor: "cool-gray" },
    incident: { get label() { return m.ticket_type_incident(); }, tagColor: "high-contrast" },
    design: { get label() { return m.ticket_type_design(); }, tagColor: "magenta" },
    documentation: { get label() { return m.ticket_type_documentation(); }, tagColor: "green" },
};

export const TICKET_TYPE_OPTIONS: TicketType[] = ["feature", "bug", "chore", "improvement", "epic", "spike", "story", "task", "subtask", "incident", "design", "documentation"];

export interface TicketStatusConfig {
    label: string;
    accentColor: string;
}

export const TICKET_STATUS_CONFIG: Record<TicketStatus, TicketStatusConfig> = {
    backlog: { get label() { return m.status_backlog(); }, accentColor: "magenta" },
    todo: { get label() { return m.status_todo(); }, accentColor: "teal" },
    in_progress: { get label() { return m.status_in_progress(); }, accentColor: "blue" },
    done: { get label() { return m.status_done(); }, accentColor: "green" },
};

export const TICKET_STATUS_ORDER: TicketStatus[] = ["backlog", "todo", "in_progress", "done"];

export interface TicketPriorityConfig {
    label: string;
    tagColor: "green" | "teal" | "red";
}

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, TicketPriorityConfig> = {
    p3: { get label() { return m.modal_priority_low(); }, tagColor: "green" },
    p2: { get label() { return m.modal_priority_medium(); }, tagColor: "teal" },
    p1: { get label() { return m.modal_priority_high(); }, tagColor: "red" },
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
    /** Category for grouping in the palette (e.g. "Navigation", "Actions") */
    category?: string;
    /** Carbon icon component to display next to the label */
    icon?: any;
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

export type TabType = "kanban" | "table" | "timeline" | "calendar" | "docs";

// Default tabs for a new board — only Kanban is enabled
// Users opt in to additional views
// Kanban is always listed first and cannot be disabled
export const DEFAULT_BOARD_TABS: TabType[] = ["kanban"];

// All available tab types
export const ALL_BOARD_TABS: TabType[] = [
    "kanban",
    "table",
    "timeline",
    "calendar",
    "docs",
];

export interface Board {
    id: string;
    name: string;
    description: string;
    tabs_config: string;
    archived_at: string | null;
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
    start_date: string | null;
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
    Partial<Pick<Ticket, "status" | "priority" | "ticket_type" | "position" | "due_date" | "start_date">>;
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
        | "start_date"
        | "labels"
        | "comments"
    >
>;

import { getContext, setContext } from 'svelte';
import {
    type Ticket,
    type TicketStatus,
    type TicketPriority,
    type TicketType,
    TICKET_STATUS_ORDER,
    TICKET_STATUS_CONFIG,
    TICKET_PRIORITY_CONFIG,
    TICKET_TYPE_CONFIG,
} from "$lib/components/app/types";
import { getTicketSort } from "$lib/hooks/ticket-sort.svelte";
import {
    Pending,
    TaskComplete,
    InProgress as InProgressIcon,
    CheckmarkFilled,
    ArrowUp,
    ArrowRight,
    ArrowDown,
    StarFilled,
    Debug,
    SettingsAdjust,
    ChartLineSmooth,
    Lightning,
    Explore,
    Bookmark,
    Checkbox,
    List,
    Warning,
    ColorPalette,
    Document,
} from "carbon-icons-svelte";
import * as m from "$lib/paraglide/messages.js";
import { formatDate } from "$lib/utils/date-format";

export const statusIconMap: Record<TicketStatus, any> = {
    backlog: Pending,
    todo: TaskComplete,
    in_progress: InProgressIcon,
    done: CheckmarkFilled,
};

export const typeIconMap: Record<TicketType, any> = {
    feature: StarFilled,
    bug: Debug,
    chore: SettingsAdjust,
    improvement: ChartLineSmooth,
    epic: Lightning,
    spike: Explore,
    story: Bookmark,
    task: Checkbox,
    subtask: List,
    incident: Warning,
    design: ColorPalette,
    documentation: Document,
};

export const priorityIconMap: Record<TicketPriority, any> = {
    p1: ArrowUp,
    p2: ArrowRight,
    p3: ArrowDown,
};

const statusAccentMap: Record<TicketStatus, string> = {
    backlog: "#e5399e",
    todo: "var(--cds-support-04)",
    in_progress: "var(--cds-interactive-01)",
    done: "var(--cds-support-02)",
};

export class TableState {
    #ticketsHook: any;
    #sortHook = getTicketSort();
    #getSearchQuery: () => string;

    constructor(ticketsHook: any, getSearchQuery: () => string = () => "") {
        this.#ticketsHook = ticketsHook;
        this.#getSearchQuery = getSearchQuery;
    }

    get filteredTickets(): Ticket[] {
        const q = this.#getSearchQuery();
        const tickets = q.trim()
            ? this.#ticketsHook.tickets.filter(
                (t: Ticket) =>
                    t.title.toLowerCase().includes(q.toLowerCase()) ||
                    t.description?.toLowerCase().includes(q.toLowerCase()) ||
                    t.labels?.some((tag: string) =>
                        tag.toLowerCase().includes(q.toLowerCase()),
                    ),
            )
            : this.#ticketsHook.tickets;

        return this.#sortHook.sortTickets(tickets);
    }

    get groupedTickets() {
        return TICKET_STATUS_ORDER.map((status) => ({
            status,
            label: TICKET_STATUS_CONFIG[status].label,
            icon: statusIconMap[status],
            accentColor: statusAccentMap[status],
            tickets: this.filteredTickets.filter((t: Ticket) => t.status === status),
        }));
    }

    get totalCount() {
        return this.filteredTickets.length;
    }

    customSort(a: any, b: any, { key }: { key: string }) {
        switch (key) {
            case "priority":
                return String(a).localeCompare(String(b));
            case "type":
                return String(a).localeCompare(String(b));
            case "dueDate":
            case "created":
                if (!a) return 1;
                if (!b) return -1;
                return new Date(a).getTime() - new Date(b).getTime();
            default:
                return String(a).localeCompare(String(b));
        }
    }

    formatRelativeDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return m.table_today();
        if (diffDays === 1) return m.table_yesterday();
        if (diffDays < 7) return m.table_days_ago({ count: diffDays });
        if (diffDays < 30) return m.table_weeks_ago({ count: Math.floor(diffDays / 7) });
        return formatDate(date, {
            month: "short",
            day: "numeric",
        });
    }

    formatDueDate(dateStr: string | null, isDone: boolean = false): {
        text: string;
        overdue: boolean;
    } {
        if (!dateStr) return { text: "—", overdue: false };
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0)
            return {
                text: m.gantt_days_overdue({ count: Math.abs(diffDays) }),
                overdue: !isDone,
            };
        if (diffDays === 0) return { text: m.table_due_today(), overdue: false };
        if (diffDays === 1) return { text: m.table_tomorrow(), overdue: false };
        if (diffDays < 7) return { text: m.table_in_days({ count: diffDays }), overdue: false };
        return {
            text: formatDate(date, {
                month: "short",
                day: "numeric",
            }),
            overdue: false,
        };
    }

    async deleteTicket(ticketId: string) {
        await this.#ticketsHook.remove(ticketId);
    }
}

const TABLE_KEY = Symbol('table');

export function setTableState(state: TableState) {
    setContext(TABLE_KEY, state);
}

export function getTableState(): TableState {
    return getContext<TableState>(TABLE_KEY);
}

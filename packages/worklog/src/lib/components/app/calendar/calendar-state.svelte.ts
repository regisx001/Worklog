import { getContext, setContext } from 'svelte';
import { type Ticket } from "$lib/components/app/types";
import { getTicketSort } from "$lib/hooks/ticket-sort.svelte";
import { formatDate } from "$lib/utils/date-format";

export type CalendarDay = {
    date: Date;
    dateKey: string;
    isToday: boolean;
    isCurrentMonth: boolean;
    tickets: Ticket[];
};

export class CalendarState {
    #ticketsHook: any;
    #sortHook = getTicketSort();
    #getSearchQuery: () => string;

    viewMode = $state<"month" | "week">("month");
    currentDate = $state<Date>((() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    })());

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
                        tag.toLowerCase().includes(q.toLowerCase())
                    )
            )
            : this.#ticketsHook.tickets;
        return this.#sortHook.sortTickets(tickets);
    }

    get ticketsByDate(): Map<string, Ticket[]> {
        const map = new Map<string, Ticket[]>();
        for (const ticket of this.filteredTickets) {
            const dateStr = ticket.due_date || ticket.start_date;
            if (!dateStr) continue;
            const key = dateStr.slice(0, 10);
            const arr = map.get(key) ?? [];
            arr.push(ticket);
            map.set(key, arr);
        }
        return map;
    }

    get calendarDays(): CalendarDay[] {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);
        // Monday-start: Mon=0 … Sun=6
        const startDow = (firstOfMonth.getDay() + 6) % 7;
        const totalCells = Math.ceil((startDow + lastOfMonth.getDate()) / 7) * 7;
        const todayKey = CalendarState.toDateKey(new Date());
        const days: CalendarDay[] = [];
        for (let i = 0; i < totalCells; i++) {
            const date = new Date(year, month, 1 - startDow + i);
            const dateKey = CalendarState.toDateKey(date);
            days.push({
                date,
                dateKey,
                isToday: dateKey === todayKey,
                isCurrentMonth: date.getMonth() === month,
                tickets: this.ticketsByDate.get(dateKey) ?? [],
            });
        }
        return days;
    }

    get weekDays(): CalendarDay[] {
        const todayKey = CalendarState.toDateKey(new Date());
        const d = this.currentDate;
        const dow = (d.getDay() + 6) % 7;
        const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
        const days: CalendarDay[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
            const dateKey = CalendarState.toDateKey(date);
            days.push({
                date,
                dateKey,
                isToday: dateKey === todayKey,
                isCurrentMonth: date.getMonth() === d.getMonth(),
                tickets: this.ticketsByDate.get(dateKey) ?? [],
            });
        }
        return days;
    }

    get activeDays(): CalendarDay[] {
        return this.viewMode === "month" ? this.calendarDays : this.weekDays;
    }

    /** Number of rows in the current month grid (4–6). Week view is always 1. */
    get rowCount(): number {
        if (this.viewMode === "week") return 1;
        return this.calendarDays.length / 7;
    }

    get displayTitle(): string {
        if (this.viewMode === "month") {
            return formatDate(this.currentDate, { month: "long", year: "numeric" });
        }
        const days = this.weekDays;
        const first = days[0].date;
        const last = days[6].date;
        return `${formatDate(first, { month: "short", day: "numeric" })} – ${formatDate(last, { month: "short", day: "numeric", year: "numeric" })}`;
    }

    get weekdayHeaders(): string[] {
        return Array.from({ length: 7 }, (_, i) => {
            const monday = new Date(2025, 0, 6 + i);
            return formatDate(monday, { weekday: "short" });
        });
    }

    prevPeriod() {
        const d = this.currentDate;
        this.currentDate = this.viewMode === "month"
            ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
            : new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
    }

    nextPeriod() {
        const d = this.currentDate;
        this.currentDate = this.viewMode === "month"
            ? new Date(d.getFullYear(), d.getMonth() + 1, 1)
            : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    }

    goToToday() {
        const now = new Date();
        this.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    static toDateKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
}

const CALENDAR_KEY = Symbol("calendar");

export function setCalendarState(state: CalendarState) {
    setContext(CALENDAR_KEY, state);
}

export function getCalendarState(): CalendarState {
    return getContext<CalendarState>(CALENDAR_KEY);
}

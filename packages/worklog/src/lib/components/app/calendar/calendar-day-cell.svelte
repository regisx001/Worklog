<script lang="ts">
    import type { Ticket } from "$lib/components/app/types";
    import { TICKET_STATUS_CONFIG } from "$lib/components/app/types";
    import type { CalendarDay } from "./calendar-state.svelte";
    import * as m from "$lib/paraglide/messages.js";
    import { formatDate } from "$lib/utils/date-format";

    const MAX_VISIBLE_TICKETS = 3;

    let {
        day,
        isWeekView = false,
        onTicketClick,
        onDateClick,
    }: {
        day: CalendarDay;
        isWeekView?: boolean;
        onTicketClick: (ticket: Ticket) => void;
        onDateClick: (date: Date) => void;
    } = $props();

    const visibleTickets = $derived(day.tickets.slice(0, MAX_VISIBLE_TICKETS));
    const overflowCount = $derived(Math.max(0, day.tickets.length - MAX_VISIBLE_TICKETS));

    let showPopover = $state(false);

    function getStatusColor(ticket: Ticket): string {
        return (TICKET_STATUS_CONFIG as any)[ticket.status]?.accentColor ?? "#6f6f6f";
    }

    function handleCellClick(e: MouseEvent) {
        if ((e.target as HTMLElement).closest(".ticket-chip, .indicator-area, .overflow-popover")) return;
        onDateClick(day.date);
    }

    function handleIndicatorClick(e: MouseEvent) {
        e.stopPropagation();
        if (day.tickets.length > 0) {
            showPopover = !showPopover;
        }
    }

    function handlePopoverKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") showPopover = false;
    }

    // Click-outside for popover
    function popoverAction(node: HTMLElement) {
        function handler(e: MouseEvent) {
            if (!node.contains(e.target as Node)) showPopover = false;
        }
        document.addEventListener("click", handler, true);
        return { destroy: () => document.removeEventListener("click", handler, true) };
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
    class="day-cell"
    class:today={day.isToday}
    class:out-of-month={!day.isCurrentMonth}
    class:week-view={isWeekView}
    onclick={handleCellClick}
    role="gridcell"
    tabindex="-1"
    aria-label={formatDate(day.date, { weekday: "long", month: "long", day: "numeric" })}
>
    <div class="day-number-row">
        <span class="day-number" class:today-badge={day.isToday}>
            {day.date.getDate()}
        </span>
    </div>

    {#if isWeekView}
        <!-- Week view: full chip-style tickets -->
        <div class="tickets-list">
            {#each day.tickets as ticket (ticket.id)}
                <button
                    class="ticket-chip"
                    style="--status-color: {getStatusColor(ticket)}"
                    onclick={(e) => { e.stopPropagation(); onTicketClick(ticket); }}
                    title={ticket.title}
                >
                    <span class="chip-dot"></span>
                    <span class="chip-title">{ticket.title}</span>
                </button>
            {/each}
        </div>
    {:else}
        <!-- Month view: chip tickets with overflow -->
        {#if day.tickets.length > 0}
            <div class="indicator-area" use:popoverAction>
                {#each visibleTickets as ticket (ticket.id)}
                    <button
                        class="ticket-chip month-chip"
                        style="--status-color: {getStatusColor(ticket)}"
                        onclick={(e) => { e.stopPropagation(); onTicketClick(ticket); }}
                        title={ticket.title}
                    >
                        <span class="chip-dot"></span>
                        <span class="chip-title">{ticket.title}</span>
                    </button>
                {/each}
                {#if overflowCount > 0}
                    <button
                        class="overflow-btn"
                        onclick={handleIndicatorClick}
                        title={m.calendar_more_tickets({ count: overflowCount })}
                    >
                        {m.calendar_more_tickets_short({ count: overflowCount })}
                    </button>
                {/if}

                {#if showPopover}
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <div
                        class="overflow-popover"
                        role="dialog"
                        tabindex="-1"
                        aria-label={m.calendar_all_tickets_for_day()}
                        onkeydown={handlePopoverKeydown}
                    >
                        <div class="popover-header">
                            {formatDate(day.date, { month: "short", day: "numeric" })}
                            <span class="popover-count">{m.calendar_ticket_count({ count: day.tickets.length })}</span>
                        </div>
                        {#each day.tickets as ticket (ticket.id)}
                            <button
                                class="popover-ticket"
                                style="--status-color: {getStatusColor(ticket)}"
                                onclick={(e) => { e.stopPropagation(); showPopover = false; onTicketClick(ticket); }}
                            >
                                <span class="chip-dot"></span>
                                <span class="chip-title">{ticket.title}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* ── Day Cell ────────────────────────────────────────────────────────── */
    .day-cell {
        height: 100%;
        padding: 0.375rem;
        border-right: 1px solid var(--cds-ui-03);
        border-bottom: 1px solid var(--cds-ui-03);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        transition: background 0.1s ease;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
    }

    .day-cell:hover {
        background: color-mix(in srgb, var(--cds-hover-ui) 60%, transparent);
    }

    .day-cell.today {
        background: color-mix(in srgb, var(--cds-interactive-01, #0f62fe) 6%, transparent);
    }

    .day-cell.today:hover {
        background: color-mix(in srgb, var(--cds-interactive-01, #0f62fe) 10%, transparent);
    }

    .day-cell.out-of-month {
        opacity: 0.4;
    }

    /* ── Day Number ─────────────────────────────────────────────────────── */
    .day-number-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
    }

    .day-number {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-02);
        line-height: 1;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .day-number.today-badge {
        background: var(--cds-interactive-01, #0f62fe);
        color: #fff;
        font-weight: 700;
    }

    /* ── Month View: Chip Indicators ────────────────────────────────────── */
    .indicator-area {
        margin-top: auto;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.1875rem;
    }

    .overflow-btn {
        all: unset;
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--cds-text-02);
        cursor: pointer;
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        transition: background 0.12s ease;
        text-align: left;
        margin-top: 0.125rem;
    }

    .overflow-btn:hover {
        background: color-mix(in srgb, var(--cds-hover-ui) 80%, transparent);
        color: var(--cds-text-01);
    }

    /* ── Week View: Chip Tickets ────────────────────────────────────────── */
    .tickets-list {
        display: flex;
        flex-direction: column;
        gap: 0.1875rem;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .tickets-list::-webkit-scrollbar {
        width: 3px;
    }
    .tickets-list::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 2px;
    }

    .ticket-chip {
        all: unset;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.1875rem 0.375rem;
        border-radius: 3px;
        font-size: 0.75rem;
        color: var(--cds-text-01);
        background: color-mix(in srgb, var(--status-color) 12%, var(--cds-ui-01));
        cursor: pointer;
        transition: background 0.12s ease;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
    }

    .ticket-chip:hover {
        background: color-mix(in srgb, var(--status-color) 22%, var(--cds-ui-01));
    }

    .chip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--status-color);
        flex-shrink: 0;
    }

    .chip-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    /* ── Popover (shared) ───────────────────────────────────────────────── */
    .overflow-popover {
        position: absolute;
        bottom: calc(100% + 4px);
        left: 0;
        z-index: 100;
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        min-width: 14rem;
        max-width: 18rem;
        max-height: 16rem;
        overflow-y: auto;
        padding: 0.375rem;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .popover-header {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--cds-text-02);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0.25rem 0.375rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .popover-count {
        font-weight: 400;
        text-transform: none;
        letter-spacing: normal;
        color: var(--cds-text-03);
    }

    .popover-ticket {
        all: unset;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        color: var(--cds-text-01);
        cursor: pointer;
        transition: background 0.12s ease;
        width: 100%;
        box-sizing: border-box;
    }

    .popover-ticket:hover {
        background: var(--cds-hover-ui);
    }
</style>

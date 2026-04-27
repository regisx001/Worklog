<!-- src/lib/components/app/kanban/kanban-column.svelte -->
<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { Button, Tag, InlineLoading } from "carbon-components-svelte";
    import {
        Add,
        Pending,
        TaskComplete,
        InProgress as InProgressIcon,
        CheckmarkFilled,
    } from "carbon-icons-svelte";
    import KanbanTicketCard from "./kanban-ticket-card.svelte";
    import type { Ticket, TicketStatus } from "$lib/components/app/types";

    let {
        label,
        status,
        tickets,
        accentColor = "blue",
        isLoading = false,
        onconsider,
        onfinalize,
        onAddTicket,
        onEditTicket,
        onDeleteTicket,
    }: {
        label: string;
        status: TicketStatus;
        tickets: Ticket[];
        accentColor?: string;
        isLoading?: boolean;
        onconsider: (e: CustomEvent) => void;
        onfinalize: (e: CustomEvent) => void;
        onAddTicket?: (status: TicketStatus) => void;
        onEditTicket?: (ticket: Ticket) => void;
        onDeleteTicket?: (id: string) => void;
    } = $props();

    const flipDurationMs = 180;

    // Color map for the column header accent
    const colorVarMap: Record<string, string> = {
        blue: "var(--cds-interactive-01)",
        green: "var(--cds-support-02)",
        yellow: "var(--cds-support-03)",
        red: "var(--cds-support-01)",
        magenta: "#e5399e",
        teal: "var(--cds-support-04)",
    };

    // Status icon map
    const statusIconMap: Record<TicketStatus, any> = {
        backlog: Pending,
        todo: TaskComplete,
        in_progress: InProgressIcon,
        done: CheckmarkFilled,
    };

    const headerColor = $derived(
        colorVarMap[accentColor] ?? colorVarMap["blue"],
    );

    const StatusIcon = $derived(statusIconMap[status]);

    // dndzone expects the zone list to be updated from event payloads.
    let zoneItems = $state<Ticket[]>(tickets);

    $effect(() => {
        zoneItems = tickets;
    });

    function handleConsider(e: CustomEvent) {
        const detail = e.detail as { items?: Ticket[] };
        zoneItems = detail.items ?? zoneItems;
        onconsider(e);
    }

    function handleFinalize(e: CustomEvent) {
        const detail = e.detail as { items?: Ticket[] };
        zoneItems = detail.items ?? zoneItems;
        onfinalize(e);
    }
</script>

<section class="kanban-column" aria-label="{label} column">
    <!-- Column header -->
    <header class="column-header" style="--accent: {headerColor}">
        <div class="column-title-row">
            <div class="column-title-group">
                <StatusIcon size={16} class="column-status-icon" />
                <h3 class="column-label">{label}</h3>
            </div>
            <Tag size="sm" type="outline">{zoneItems.length}</Tag>
        </div>
        <div class="column-accent-bar"></div>
    </header>

    <!-- Drop zone -->
    <div
        class="drop-zone"
        use:dndzone={{
            items: zoneItems,
            flipDurationMs,
            type: "kanban-ticket",
        }}
        onconsider={handleConsider}
        onfinalize={handleFinalize}
        role="list"
        aria-label="Tickets in {label}"
    >
        {#if isLoading}
            <div class="column-loading">
                <InlineLoading description="Loading tickets…" />
            </div>
        {:else}
            {#each zoneItems as ticket (ticket.id)}
                <div
                    animate:flip={{ duration: flipDurationMs }}
                    class="ticket-wrapper"
                    role="listitem"
                >
                    <KanbanTicketCard
                        {ticket}
                        onEdit={onEditTicket}
                        onDelete={onDeleteTicket}
                    />
                </div>
            {/each}

            {#if zoneItems.length === 0}
                <div class="empty-state" aria-hidden="true">
                    <span class="empty-state-text">No tickets</span>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Add ticket button -->
    <div class="column-footer">
        <Button
            kind="ghost"
            size="small"
            icon={Add}
            on:click={() => onAddTicket?.(status)}
        >
            Add ticket
        </Button>
    </div>
</section>

<style>
    .kanban-column {
        display: flex;
        flex-direction: column;
        background: var(--cds-ui-background);
        border: 1px solid var(--cds-ui-03);
        width: 340px;
        flex: 0 0 340px;
        border-radius: 2px;
        overflow: hidden;
        /* Fill parent height */
        align-self: stretch;
    }

    /* Header */
    .column-header {
        padding: 0.875rem 1rem 0;
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .column-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .column-title-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .column-title-group :global(svg) {
        color: var(--accent);
        flex-shrink: 0;
    }

    .column-label {
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--cds-text-01);
        margin: 0;
    }

    .column-accent-bar {
        height: 3px;
        background: var(--accent);
        margin: 0 -1rem;
        border-radius: 0;
    }

    /* Drop zone — fills remaining height */
    .drop-zone {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        min-height: 120px;
        overflow-y: auto;
    }

    .ticket-wrapper {
        outline: none;
    }

    /* Empty state */
    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80px;
    }

    .empty-state-text {
        font-size: 0.75rem;
        color: var(--cds-text-placeholder);
        font-style: italic;
    }

    .column-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    /* Footer */
    .column-footer {
        padding: 0.5rem;
        border-top: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-01);
    }

    .column-footer :global(.bx--btn--ghost) {
        width: 100%;
        max-width: 100%;
        justify-content: flex-start;
        color: var(--cds-text-02);
    }

    .column-footer :global(.bx--btn--ghost:hover) {
        color: var(--cds-text-01);
        background: var(--cds-hover-ui);
    }
</style>

<!-- src/lib/components/app/kanban/kanban-column.svelte -->
<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { Button, Tag, InlineLoading } from "carbon-components-svelte";
    import { Add } from "carbon-icons-svelte";
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

    const headerColor = $derived(
        colorVarMap[accentColor] ?? colorVarMap["blue"],
    );

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
            <h3 class="column-label">{label}</h3>
            <Tag size="sm" type="outline">{zoneItems.length}</Tag>
        </div>
        <div class="column-accent-bar"></div>
    </header>

    <!-- Drop zone -->
    <div
        class="drop-zone"
        class:drop-zone--empty={zoneItems.length === 0}
        use:dndzone={{ items: zoneItems, flipDurationMs, type: "kanban-ticket" }}
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
        width: 300px;
        flex: 0 0 300px;
        border-radius: 2px;
        overflow: hidden;
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

    /* Drop zone */
    .drop-zone {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        min-height: 120px;
        overflow-y: auto;
        max-height: calc(100vh - 280px);
        transition: background 0.15s ease;
    }

    /* Subtle highlight while dragging over */
    .drop-zone:focus-within {
        background: var(--cds-hover-ui);
    }

    .drop-zone--empty {
        background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 6px,
            var(--cds-ui-02) 6px,
            var(--cds-ui-02) 7px
        );
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

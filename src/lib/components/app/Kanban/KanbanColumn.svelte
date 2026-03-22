<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import TicketCard from "./TicketCard.svelte";
    import type { Ticket, TicketStatus } from "$lib/components/app/types.js";

    interface KanbanColumnProps {
        title: string;
        status: TicketStatus;
        tickets: Ticket[];
        selectedTicketId: string | null;
        onSelectTicket: (ticketId: string) => void;
        onDragTicketStart: (ticketId: string) => void;
        onDropTicket: (ticketId: string, status: TicketStatus) => void;
        onQuickMoveTicket: (ticketId: string) => void;
        onMoveTicketToStatus: (ticketId: string, status: TicketStatus) => void;
        onDeleteTicket: (ticketId: string) => void;
    }

    let {
        title,
        status,
        tickets,
        selectedTicketId,
        onSelectTicket,
        onDragTicketStart,
        onDropTicket,
        onQuickMoveTicket,
        onMoveTicketToStatus,
        onDeleteTicket,
    }: KanbanColumnProps = $props();

    let isDropTarget = $state(false);

    const columnClass = $derived.by(() =>
        isDropTarget
            ? "bg-surface-raised ring-primary/30 flex min-h-0 flex-col rounded-xl border border-primary/40 shadow-sm ring-2"
            : "bg-surface-card flex min-h-0 flex-col rounded-xl border border-border/90 shadow-xs",
    );

    function onDragOver(event: DragEvent) {
        event.preventDefault();
        isDropTarget = true;
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        const ticketId =
            event.dataTransfer?.getData("application/x-ticket-id") ||
            event.dataTransfer?.getData("text/plain") ||
            "";

        if (ticketId) {
            onDropTicket(ticketId, status);
        }

        isDropTarget = false;
    }

    function onDragLeave() {
        isDropTarget = false;
    }

    function onListKeyDown(event: KeyboardEvent) {
        if (tickets.length === 0) return;

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const currentIndex = tickets.findIndex(
                (ticket) => ticket.id === selectedTicketId,
            );
            const nextIndex =
                event.key === "ArrowDown"
                    ? Math.min(currentIndex + 1, tickets.length - 1)
                    : Math.max(currentIndex - 1, 0);
            const fallbackIndex =
                event.key === "ArrowDown" ? 0 : tickets.length - 1;
            onSelectTicket(
                tickets[currentIndex === -1 ? fallbackIndex : nextIndex].id,
            );
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
    class={columnClass}
    aria-label={`${title} column`}
    ondragover={onDragOver}
    ondrop={onDrop}
    ondragleave={onDragLeave}
>
    <header
        class="flex items-center justify-between border-b border-border/70 px-4 py-3"
    >
        <div class="flex items-center gap-2">
            <h2
                class="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
                {title}
            </h2>
            <Badge variant="outline" class="text-[10px]">{tickets.length}</Badge
            >
        </div>
    </header>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
        class="no-scrollbar min-h-0 flex-1 overflow-y-auto p-3.5"
        onkeydown={onListKeyDown}
        role="listbox"
        aria-label={`${title} tickets`}
        tabindex="0"
    >
        <div class="space-y-2">
            {#if tickets.length === 0}
                <div
                    class="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground"
                >
                    Drop a ticket here
                </div>
            {:else}
                {#each tickets as ticket (ticket.id)}
                    <TicketCard
                        {ticket}
                        isSelected={selectedTicketId === ticket.id}
                        onSelect={onSelectTicket}
                        onDragStart={onDragTicketStart}
                        onQuickMove={onQuickMoveTicket}
                        onMoveToStatus={onMoveTicketToStatus}
                        onDelete={onDeleteTicket}
                    />
                {/each}
            {/if}
        </div>
    </div>
</section>

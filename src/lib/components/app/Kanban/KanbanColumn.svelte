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

    const statusMeta = $derived.by(() => {
        if (status === "todo") {
            return {
                dotClass: "bg-slate-400",
                toneClass: "text-slate-300",
                laneRing: "ring-slate-400/20",
            };
        }

        if (status === "in_progress") {
            return {
                dotClass: "bg-blue-400",
                toneClass: "text-blue-300",
                laneRing: "ring-blue-400/20",
            };
        }

        return {
            dotClass: "bg-emerald-400",
            toneClass: "text-emerald-300",
            laneRing: "ring-emerald-400/20",
        };
    });

    const columnClass = $derived.by(() =>
        isDropTarget
            ? `bg-surface-card ${statusMeta.laneRing} flex min-h-0 flex-col rounded-xl border border-primary/45 shadow-md ring-2`
            : `bg-muted/40 ${statusMeta.laneRing} flex min-h-0 flex-col rounded-xl border border-border/85 shadow-xs ring-1`,
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
        class="flex items-center justify-between border-b border-border/80 bg-surface-panel px-3.5 py-2.5"
    >
        <div class="flex items-center gap-2.5">
            <span class={`h-2 w-2 rounded-full ${statusMeta.dotClass}`}></span>
            <h2
                class={`text-[11px] font-semibold uppercase tracking-[0.08em] ${statusMeta.toneClass}`}
            >
                {title}
            </h2>
            <Badge
                variant="outline"
                class="border-border/80 bg-background text-[10px] text-foreground/80"
                >{tickets.length}</Badge
            >
        </div>
    </header>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
        class="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2.5"
        onkeydown={onListKeyDown}
        role="listbox"
        aria-label={`${title} tickets`}
        tabindex="0"
    >
        <div class="space-y-2.5">
            {#if tickets.length === 0}
                <div
                    class="rounded-lg border border-dashed border-border/80 bg-background/40 px-3 py-6 text-center"
                >
                    <p class="text-[11px] font-medium text-foreground/85">
                        No tickets in {title}
                    </p>
                    <p class="mt-1 text-[10px] text-muted-foreground">
                        Drag a card here to move it.
                    </p>
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

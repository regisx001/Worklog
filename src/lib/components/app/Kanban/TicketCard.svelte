<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card/index.js";
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger,
    } from "$lib/components/ui/context-menu/index.js";
    import { cn } from "$lib/utils.js";
    import type { Ticket, TicketStatus } from "$lib/components/app/types.js";

    interface TicketCardProps {
        ticket: Ticket;
        isSelected?: boolean;
        onSelect: (ticketId: string) => void;
        onDragStart: (ticketId: string) => void;
        onQuickMove: (ticketId: string) => void;
        onMoveToStatus: (ticketId: string, status: TicketStatus) => void;
        onDelete: (ticketId: string) => void;
    }

    let {
        ticket,
        isSelected = false,
        onSelect,
        onDragStart,
        onQuickMove,
        onMoveToStatus,
        onDelete,
    }: TicketCardProps = $props();

    const primaryLabel = $derived.by(() => ticket.labels[0] ?? "general");

    const cardClass = $derived.by(() =>
        cn(
            "hover:bg-muted/30 focus-visible:ring-ring/50 gap-2 border border-border/80 bg-card px-0 py-0 transition-colors focus-visible:ring-2",
            isSelected && "ring-2 ring-ring",
        ),
    );

    function onKeyDown(event: KeyboardEvent) {
        if (event.key.toLowerCase() === "m") {
            event.preventDefault();
            onQuickMove(ticket.id);
        }
    }

    function onDragStartEvent(event: DragEvent) {
        event.dataTransfer?.setData("text/plain", ticket.id);
        event.dataTransfer?.setData("application/x-ticket-id", ticket.id);
        event.dataTransfer?.setDragImage(
            event.currentTarget as Element,
            24,
            24,
        );
        onDragStart(ticket.id);
    }
</script>

<ContextMenu>
    <ContextMenuTrigger class="block">
        <button
            type="button"
            draggable="true"
            aria-label={`Open ${ticket.title}`}
            onclick={() => onSelect(ticket.id)}
            onkeydown={onKeyDown}
            ondragstart={onDragStartEvent}
            class="w-full text-left outline-none"
        >
            <Card size="sm" class={cardClass}>
                <CardHeader class="px-3 pt-3 pb-0">
                    <div class="flex items-start justify-between gap-2">
                        <CardTitle class="text-sm font-medium leading-snug"
                            >{ticket.title}</CardTitle
                        >
                        <Badge
                            variant="outline"
                            class="shrink-0 text-[10px] uppercase tracking-wide"
                            >{primaryLabel}</Badge
                        >
                    </div>
                </CardHeader>
                <CardContent
                    class="flex items-center justify-between px-3 pt-2 pb-3"
                >
                    <div
                        class="text-muted-foreground flex items-center gap-1 text-[11px]"
                    >
                        <span>#{ticket.id}</span>
                        <span>•</span>
                        <span>{ticket.comments.length} comments</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <Badge
                            variant="outline"
                            class="text-[10px]"
                            title="Move ticket to next column (M)"
                        >
                            M
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </button>
    </ContextMenuTrigger>

    <ContextMenuContent>
        <ContextMenuItem
            onclick={() => {
                onSelect(ticket.id);
            }}
        >
            Open ticket
        </ContextMenuItem>
        <ContextMenuItem
            onclick={() => {
                onQuickMove(ticket.id);
            }}
        >
            Quick move
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
            disabled={ticket.status === "todo"}
            onclick={() => {
                onMoveToStatus(ticket.id, "todo");
            }}
        >
            Move to Todo
        </ContextMenuItem>
        <ContextMenuItem
            disabled={ticket.status === "in_progress"}
            onclick={() => {
                onMoveToStatus(ticket.id, "in_progress");
            }}
        >
            Move to In Progress
        </ContextMenuItem>
        <ContextMenuItem
            disabled={ticket.status === "done"}
            onclick={() => {
                onMoveToStatus(ticket.id, "done");
            }}
        >
            Move to Done
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
            variant="destructive"
            onclick={() => {
                onDelete(ticket.id);
            }}
        >
            Delete ticket
        </ContextMenuItem>
    </ContextMenuContent>
</ContextMenu>

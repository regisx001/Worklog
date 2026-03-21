<script lang="ts">
    import {
        Trash,
        FolderOpen,
        CheckCheck,
        CircleDot,
        ArrowLeftRight,
        Check,
    } from "@lucide/svelte";

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

    const ticketLabels = $derived.by(() =>
        ticket.labels.length > 0 ? ticket.labels : ["general"],
    );

    const cardClass = $derived.by(() =>
        cn(
            "hover:bg-accent/30 hover:border-primary/40 focus-visible:ring-ring/50 gap-2 rounded-lg border border-border/70 bg-gradient-to-t from-primary/5 to-card px-0 py-0 shadow-xs transition-colors focus-visible:ring-2",
            isSelected && "ring-2 ring-primary/50",
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
                        <CardTitle class="text-sm font-semibold leading-snug"
                            >{ticket.title}</CardTitle
                        >
                        <div class="flex shrink-0 flex-wrap justify-end gap-1">
                            {#each ticketLabels as label, index (`${ticket.id}-${label}-${index}`)}
                                <Badge
                                    variant="outline"
                                    class="text-[10px] uppercase tracking-[0.08em]"
                                    >{label}</Badge
                                >
                            {/each}
                        </div>
                    </div>
                </CardHeader>
                <CardContent
                    class="flex items-center justify-between px-3 pt-2 pb-3"
                >
                    <div
                        class="text-muted-foreground flex items-center gap-1 text-[11px]"
                    >
                        <span class="font-mono tracking-[0.04em]"
                            >#{ticket.id}</span
                        >
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
            class="text-[12px]"
            onclick={() => {
                onSelect(ticket.id);
            }}
        >
            <FolderOpen width="12px" />
            Open ticket
        </ContextMenuItem>
        <ContextMenuItem
            class="text-[12px]"
            onclick={() => {
                onQuickMove(ticket.id);
            }}
        >
            <ArrowLeftRight width="12px" />
            Quick move
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
            class="text-[12px]"
            disabled={ticket.status === "todo"}
            onclick={() => {
                onMoveToStatus(ticket.id, "todo");
            }}
        >
            <Check />
            Move to Todo
        </ContextMenuItem>
        <ContextMenuItem
            class="text-[12px]"
            disabled={ticket.status === "in_progress"}
            onclick={() => {
                onMoveToStatus(ticket.id, "in_progress");
            }}
        >
            <CircleDot width="12px" />
            Move to In Progress
        </ContextMenuItem>
        <ContextMenuItem
            class="text-[12px]"
            disabled={ticket.status === "done"}
            onclick={() => {
                onMoveToStatus(ticket.id, "done");
            }}
        >
            <CheckCheck width="12px" />
            Move to Done
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
            class="text-[12px]"
            variant="destructive"
            onclick={() => {
                onDelete(ticket.id);
            }}
        >
            <Trash width="12px" />
            Delete ticket
        </ContextMenuItem>
    </ContextMenuContent>
</ContextMenu>

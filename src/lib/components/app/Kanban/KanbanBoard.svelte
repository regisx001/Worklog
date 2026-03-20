<script lang="ts">
    import KanbanColumn from "$lib/components/app/Kanban/KanbanColumn.svelte";
    import type { Ticket, TicketStatus } from "$lib/components/app/types.js";

    interface KanbanBoardProps {
        todoTickets: Ticket[];
        inProgressTickets: Ticket[];
        doneTickets: Ticket[];
        selectedTicketId: string | null;
        onSelectTicket: (ticketId: string) => void;
        onDropTicket: (ticketId: string, status: TicketStatus) => void;
        onQuickMoveTicket: (ticketId: string) => void;
        onMoveTicketToStatus: (ticketId: string, status: TicketStatus) => void;
        onDeleteTicket: (ticketId: string) => void;
    }

    let {
        todoTickets,
        inProgressTickets,
        doneTickets,
        selectedTicketId,
        onSelectTicket,
        onDropTicket,
        onQuickMoveTicket,
        onMoveTicketToStatus,
        onDeleteTicket,
    }: KanbanBoardProps = $props();
</script>

<div class="grid h-full min-h-0 grid-cols-3 gap-3">
    <KanbanColumn
        title="Todo"
        status="todo"
        tickets={todoTickets}
        {selectedTicketId}
        {onSelectTicket}
        onDragTicketStart={() => {
            // Drag payload is carried through dataTransfer in TicketCard.
        }}
        {onDropTicket}
        {onQuickMoveTicket}
        {onMoveTicketToStatus}
        {onDeleteTicket}
    />
    <KanbanColumn
        title="In Progress"
        status="in_progress"
        tickets={inProgressTickets}
        {selectedTicketId}
        {onSelectTicket}
        onDragTicketStart={() => {
            // Drag payload is carried through dataTransfer in TicketCard.
        }}
        {onDropTicket}
        {onQuickMoveTicket}
        {onMoveTicketToStatus}
        {onDeleteTicket}
    />
    <KanbanColumn
        title="Done"
        status="done"
        tickets={doneTickets}
        {selectedTicketId}
        {onSelectTicket}
        onDragTicketStart={() => {
            // Drag payload is carried through dataTransfer in TicketCard.
        }}
        {onDropTicket}
        {onQuickMoveTicket}
        {onMoveTicketToStatus}
        {onDeleteTicket}
    />
</div>

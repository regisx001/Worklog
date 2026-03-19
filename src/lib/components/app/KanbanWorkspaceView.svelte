<script lang="ts">
    import KanbanColumn from "$lib/components/app/KanbanColumn.svelte";
    import Sidebar from "$lib/components/app/Sidebar.svelte";
    import SyncStatusBar from "$lib/components/app/SyncStatusBar.svelte";
    import type {
        Board,
        SyncState,
        Ticket,
        TicketStatus,
    } from "$lib/components/app/types.js";

    interface KanbanWorkspaceViewProps {
        boards: Board[];
        activeBoardId: string | null;
        syncState: SyncState;
        todoTickets: Ticket[];
        inProgressTickets: Ticket[];
        doneTickets: Ticket[];
        selectedTicketId: string | null;
        pendingChanges: number;
        onSelectBoard: (boardId: string) => void;
        onOpenPalette: () => void;
        onOpenSettings: () => void;
        onCreateTicket: () => void;
        onSelectTicket: (ticketId: string) => void;
        onDropTicket: (ticketId: string, status: TicketStatus) => void;
        onQuickMoveTicket: (ticketId: string) => void;
        onManualSync: () => void;
    }

    let {
        boards,
        activeBoardId,
        syncState,
        todoTickets,
        inProgressTickets,
        doneTickets,
        selectedTicketId,
        pendingChanges,
        onSelectBoard,
        onOpenPalette,
        onOpenSettings,
        onCreateTicket,
        onSelectTicket,
        onDropTicket,
        onQuickMoveTicket,
        onManualSync,
    }: KanbanWorkspaceViewProps = $props();
</script>

<div class="grid h-full min-h-0 grid-cols-[18rem_1fr]">
    <Sidebar
        {boards}
        {activeBoardId}
        {syncState}
        {onSelectBoard}
        {onOpenPalette}
        {onOpenSettings}
        {onCreateTicket}
    />

    <div class="flex min-h-0 min-w-0 flex-col">
        <main class="min-h-0 flex-1 p-3">
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
                />
            </div>
        </main>

        <SyncStatusBar {syncState} {pendingChanges} {onManualSync} />
    </div>
</div>

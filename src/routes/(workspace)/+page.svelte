<script lang="ts">
    import { getContext } from "svelte";
    import KanbanWorkspaceView from "$lib/components/app/KanbanWorkspaceView.svelte";
    import {
        workspaceShellContextKey,
        type WorkspaceShellContext,
    } from "$lib/components/app/workspace-shell-context.js";

    const shell = getContext<WorkspaceShellContext>(workspaceShellContextKey);
</script>

<KanbanWorkspaceView
    boards={shell.boards}
    activeBoardId={shell.activeBoardId}
    syncState={shell.syncState}
    todoTickets={shell.todoTickets}
    inProgressTickets={shell.inProgressTickets}
    doneTickets={shell.doneTickets}
    selectedTicketId={shell.selectedTicketId}
    pendingChanges={shell.pendingChanges}
    onCreateBoard={shell.onCreateBoard}
    onSelectBoard={shell.onSelectBoard}
    onCreateTicketForBoard={shell.onCreateTicketForBoard}
    onDeleteBoard={shell.onDeleteBoard}
    onOpenPalette={shell.onOpenPalette}
    onOpenSettings={shell.onOpenSettings}
    onCreateTicket={shell.onCreateTicket}
    onSelectTicket={shell.onSelectTicket}
    onDropTicket={shell.onDropTicket}
    onQuickMoveTicket={shell.onQuickMoveTicket}
    onMoveTicketToStatus={shell.onMoveTicketToStatus}
    onDeleteTicket={shell.onDeleteTicket}
    onManualSync={shell.onManualSync}
/>

<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import { goto } from "$app/navigation";

    import KanbanBoard from "$lib/components/legacy/app/kanban/KanbanBoard.svelte";
    import type {
        KanbanColumnConfig,
        Task,
        TaskStatus,
    } from "$lib/components/legacy/app/kanban/kanban.types.js";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useTickets } from "$lib/hooks/tickets.svelte";

    type LegacyPageData = { board_id: string };

    let { data }: { data: LegacyPageData } = $props();

    const columns: KanbanColumnConfig[] = [
        { status: "backlog", label: "Backlog", hint: "Backlog" },
        { status: "todo", label: "To Do", hint: "todo later" },
        { status: "in_progress", label: "In Progress", hint: "Active" },
        { status: "done", label: "Done", hint: "Completed" },
    ];

    const validColumns = new Set<TaskStatus>(
        columns.map((column) => column.status),
    );

    const { workspace, boardsApi } = getWorkspaceShellContext();
    const ticketsApi = useTickets(
        () => workspace.path,
        () => data.board_id,
    );

    let lastLoadedTicketScope = $state<string | null>(null);
    let lastResolvedInvalidBoardId = $state<string | null>(null);
    let loadingError = $state<string | null>(null);

    const activeBoard = $derived(
        boardsApi.boards.find((board) => board.id === data.board_id) ?? null,
    );

    const title = $derived(`${activeBoard?.name ?? "Board"} Board`);

    const tasks = $derived<Task[]>(ticketsApi.tickets);

    function boardPath(boardId: string) {
        return `/workspace/boards/${encodeURIComponent(boardId)}`;
    }

    async function handleCreateTicket(status: TaskStatus, title: string) {
        const boardId = activeBoard?.id;
        if (!boardId) {
            return;
        }

        await ticketsApi.create({
            board_id: boardId,
            title,
            description: "",
            labels: [],
            status,
            priority: "p2",
            ticket_type: "feature",
            due_date: null,
        });
    }

    async function handleDrop(state: DragDropState<Task>) {
        const { draggedItem, targetContainer } = state;
        if (
            !targetContainer ||
            !validColumns.has(targetContainer as TaskStatus)
        ) {
            return;
        }

        await ticketsApi.update(draggedItem.id, {
            status: targetContainer as TaskStatus,
        });
    }

    async function handleUpdateTicket(
        ticketId: string,
        updates: Partial<
            Pick<
                Task,
                | "title"
                | "description"
                | "status"
                | "priority"
                | "ticket_type"
                | "due_date"
                | "comments"
            >
        >,
    ) {
        await ticketsApi.update(ticketId, updates);
    }

    $effect(() => {
        if (workspace.status !== "ready") {
            return;
        }

        if (activeBoard) {
            if (boardsApi.active?.id !== activeBoard.id) {
                boardsApi.setActive(activeBoard);
            }

            return;
        }

        if (data.board_id === lastResolvedInvalidBoardId) {
            return;
        }

        lastResolvedInvalidBoardId = data.board_id;

        const fallbackBoard = boardsApi.active ?? boardsApi.boards[0] ?? null;
        if (!fallbackBoard) {
            void goto("/workspace", { replaceState: true });
            return;
        }

        boardsApi.setActive(fallbackBoard);
        void goto(boardPath(fallbackBoard.id), { replaceState: true });
    });

    $effect(() => {
        const workspacePath = workspace.path;
        const boardId = data.board_id;
        const ticketScope =
            workspacePath && boardId ? `${workspacePath}:${boardId}` : null;

        if (
            workspace.status !== "ready" ||
            !workspacePath ||
            !boardId ||
            !ticketScope ||
            ticketScope === lastLoadedTicketScope
        ) {
            return;
        }

        lastLoadedTicketScope = ticketScope;
        loadingError = null;

        void ticketsApi.load().catch((error) => {
            loadingError = String(error);
            lastLoadedTicketScope = null;
        });
    });
</script>

{#if !activeBoard}
    <main class="app-state">
        <article aria-busy="true">Opening board...</article>
    </main>
{:else}
    {#if loadingError}
        <aside class="board-error" role="alert">
            <strong>Unable to refresh tickets.</strong>
            <span>{loadingError}</span>
        </aside>
    {/if}

    <KanbanBoard
        {title}
        {columns}
        {tasks}
        onCreateTicket={handleCreateTicket}
        onUpdateTicket={handleUpdateTicket}
        onDrop={handleDrop}
    />
{/if}

<style>
    .app-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--pico-spacing);
    }

    .board-error {
        margin: calc(var(--pico-spacing) * 0.65) var(--pico-spacing)
            calc(var(--pico-spacing) * 0.2);
        padding: calc(var(--pico-spacing) * 0.55)
            calc(var(--pico-spacing) * 0.75);
        border: 1px solid
            color-mix(in srgb, var(--color-danger) 38%, transparent);
        border-radius: var(--radius-sm);
        background: color-mix(in srgb, var(--color-danger) 10%, transparent);
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.2);
        font-size: var(--pico-font-size-small);
    }
</style>

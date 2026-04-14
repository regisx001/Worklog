<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import KanbanBoard from "$lib/components/app/kanban/KanbanBoard.svelte";
    import { useBoards } from "$lib/hooks/boards.svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import type {
        BoardSidebarItem,
        KanbanColumnConfig,
        Task,
        TaskStatus,
    } from "$lib/components/app/kanban/kanban.types.js";

    const columns: KanbanColumnConfig[] = [
        { status: "backlog", label: "Backlog", hint: "Backlog" },
        { status: "todo", label: "To Do", hint: "todo later" },
        { status: "in_progress", label: "In Progress", hint: "Active" },
        { status: "done", label: "Done", hint: "Completed" },
    ];

    const workspace = useWorkspace();
    const boardsApi = useBoards(() => workspace.path);
    const ticketsApi = useTickets(
        () => workspace.path,
        () => boardsApi.active?.id ?? null,
    );

    let didInitWorkspace = false;
    let lastLoadedWorkspacePath = $state<string | null>(null);
    let lastLoadedBoardId = $state<string | null>(null);
    let loadingError = $state<string | null>(null);

    const activeBoardId = $derived(boardsApi.active?.id ?? "");

    const boards = $derived<BoardSidebarItem[]>(
        boardsApi.boards.map((board) => ({
            ...board,
            issueCount:
                board.id === activeBoardId ? ticketsApi.tickets.length : 0,
        })),
    );

    const activeBoardName = $derived(boardsApi.active?.name ?? "Board");

    const workspaceName = $derived(workspace.meta?.name ?? "Worklog");

    const boardDescription = $derived(
        boardsApi.active?.description ||
            "Drag and drop tasks between columns to update their status instantly.",
    );

    const tasks = $derived<Task[]>(ticketsApi.tickets);

    const validColumns = new Set<TaskStatus>(
        columns.map((column) => column.status),
    );

    async function loadBoardsAndTickets() {
        await boardsApi.load();

        if (boardsApi.active?.id) {
            await ticketsApi.load();
            lastLoadedBoardId = boardsApi.active.id;
            return;
        }

        lastLoadedBoardId = null;
    }

    async function initializeWorkspace() {
        try {
            await workspace.init();
            loadingError = null;

            if (workspace.status === "ready") {
                lastLoadedWorkspacePath = null;
                await loadBoardsAndTickets();
            }
        } catch (error) {
            loadingError = String(error);
        }
    }

    async function openBoard(boardId: string) {
        const board = boardsApi.boards.find((item) => item.id === boardId);
        if (!board) {
            return;
        }

        boardsApi.setActive(board);
        lastLoadedBoardId = null;
        await ticketsApi.load();
    }

    async function updateBoard(
        boardId: string,
        updates: { name: string; description: string },
    ) {
        const normalizedName = updates.name.trim();
        if (!normalizedName) {
            return;
        }

        await boardsApi.rename(
            boardId,
            normalizedName,
            updates.description.trim(),
        );
    }

    async function deleteBoard(boardId: string) {
        await boardsApi.remove(boardId);
        lastLoadedBoardId = null;

        if (boardsApi.active?.id) {
            await ticketsApi.load();
        }
    }

    async function handleCreateTicket(status: TaskStatus, title: string) {
        if (!activeBoardId) {
            return;
        }

        await ticketsApi.create({
            board_id: activeBoardId,
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

        const nextStatus = targetContainer as TaskStatus;

        await ticketsApi.update(draggedItem.id, {
            status: nextStatus,
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

    async function handlePickWorkspace() {
        await workspace.pick();

        if (workspace.status !== "ready") {
            return;
        }

        loadingError = null;
        lastLoadedWorkspacePath = null;
        lastLoadedBoardId = null;
        await loadBoardsAndTickets();
    }

    async function handleCreateFirstBoard() {
        const nextIndex = boardsApi.boards.length + 1;
        const board = await boardsApi.create({
            name: `Board ${nextIndex}`,
            description: "",
        });

        boardsApi.setActive(board);
        lastLoadedBoardId = null;
        await ticketsApi.load();
    }

    $effect(() => {
        if (didInitWorkspace) {
            return;
        }

        didInitWorkspace = true;
        void initializeWorkspace();
    });

    $effect(() => {
        const workspacePath = workspace.path;

        if (
            workspace.status !== "ready" ||
            !workspacePath ||
            workspacePath === lastLoadedWorkspacePath
        ) {
            return;
        }

        lastLoadedWorkspacePath = workspacePath;
        loadingError = null;

        void loadBoardsAndTickets().catch((error) => {
            loadingError = String(error);
        });
    });

    $effect(() => {
        const boardId = boardsApi.active?.id ?? null;

        if (
            workspace.status !== "ready" ||
            !boardId ||
            boardId === lastLoadedBoardId
        ) {
            return;
        }

        lastLoadedBoardId = boardId;

        void ticketsApi.load().catch((error) => {
            loadingError = String(error);
        });
    });
</script>

<svelte:head>
    <title>Worklog | Kanban</title>
    <meta
        name="description"
        content="Local-first kanban board with board sidebar and drag-and-drop workflow."
    />
</svelte:head>

{#if workspace.status === "idle" || workspace.status === "loading"}
    <main class="app-state">
        <article aria-busy="true">Loading workspace...</article>
    </main>
{:else if workspace.status === "no_workspace"}
    <main class="app-state">
        <article>
            <h2>No workspace selected</h2>
            <p>Choose a local folder to initialize Worklog.</p>
            <button type="button" onclick={handlePickWorkspace}>
                Open workspace
            </button>
        </article>
    </main>
{:else if workspace.status === "error"}
    <main class="app-state">
        <article>
            <h2>Workspace failed to load</h2>
            <p>{workspace.error || loadingError || "Unknown error"}</p>
            <div role="group">
                <button type="button" onclick={handlePickWorkspace}>
                    Choose different workspace
                </button>
                <button
                    type="button"
                    class="secondary"
                    onclick={initializeWorkspace}
                >
                    Retry
                </button>
            </div>
        </article>
    </main>
{:else if boardsApi.boards.length === 0}
    <main class="app-state">
        <article>
            <h2>No boards yet</h2>
            <p>Create your first board to start organizing tickets.</p>
            <button type="button" onclick={handleCreateFirstBoard}>
                Create first board
            </button>
        </article>
    </main>
{:else}
    <KanbanBoard
        {workspaceName}
        title={`${activeBoardName} Board`}
        description={boardDescription}
        {boards}
        {activeBoardId}
        onOpenBoard={openBoard}
        onUpdateBoard={updateBoard}
        onDeleteBoard={deleteBoard}
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

    .app-state article {
        width: min(calc(var(--pico-spacing) * 22), 100%);
    }
</style>

<script lang="ts">
    import { goto } from "$app/navigation";
    import KanbanSidebar from "$lib/components/app/kanban/KanbanSidebar.svelte";
    import type { BoardSidebarItem } from "$lib/components/app/kanban/kanban.types.js";
    import { useBoards } from "$lib/hooks/boards.svelte";
    import { setWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    let { children } = $props();

    const workspace = useWorkspace();
    const boardsApi = useBoards(() => workspace.path);

    setWorkspaceShellContext({ workspace, boardsApi });

    let didInitWorkspace = false;
    let lastLoadedWorkspacePath = $state<string | null>(null);
    let loadingError = $state<string | null>(null);

    const workspaceName = $derived(workspace.meta?.name ?? "Worklog");
    const activeBoardId = $derived(boardsApi.active?.id ?? "");

    const boards = $derived<BoardSidebarItem[]>(
        boardsApi.boards.map((board) => ({
            ...board,
            issueCount: 0,
        })),
    );

    function boardPath(boardId: string) {
        return `/workspace/boards/${encodeURIComponent(boardId)}`;
    }

    async function loadBoardsForWorkspace() {
        await boardsApi.load();
        lastLoadedWorkspacePath = workspace.path;
    }

    async function initializeWorkspace() {
        try {
            await workspace.init();
            loadingError = null;

            if (workspace.status === "ready") {
                await loadBoardsForWorkspace();
            }
        } catch (error) {
            loadingError = String(error);
        }
    }

    function handleOpenBoard(boardId: string) {
        const board = boardsApi.boards.find((item) => item.id === boardId);
        if (!board) {
            return;
        }

        boardsApi.setActive(board);
        void goto(boardPath(board.id));
    }

    async function handleUpdateBoard(
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

    async function handleDeleteBoard(boardId: string) {
        await boardsApi.remove(boardId);

        const fallbackBoard = boardsApi.active;
        if (!fallbackBoard) {
            await goto("/workspace", { replaceState: true });
            return;
        }

        await goto(boardPath(fallbackBoard.id), { replaceState: true });
    }

    async function handleCreateBoard(input: {
        name: string;
        description: string;
    }) {
        const normalizedName = input.name.trim();
        if (!normalizedName) {
            return;
        }

        const board = await boardsApi.create({
            name: normalizedName,
            description: input.description.trim(),
        });

        boardsApi.setActive(board);
        await goto(boardPath(board.id), { replaceState: true });
    }

    async function handlePickWorkspace() {
        await workspace.pick();

        if (workspace.status !== "ready") {
            return;
        }

        loadingError = null;
        await loadBoardsForWorkspace();

        if (boardsApi.active?.id) {
            await goto(boardPath(boardsApi.active.id), {
                replaceState: true,
            });
        }
    }

    async function handleCreateFirstBoard() {
        const nextIndex = boardsApi.boards.length + 1;
        await handleCreateBoard({
            name: `Board ${nextIndex}`,
            description: "",
        });
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

        loadingError = null;

        void loadBoardsForWorkspace().catch((error) => {
            loadingError = String(error);
        });
    });
</script>

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
    <div class="workspace-shell">
        <KanbanSidebar
            {workspaceName}
            {boards}
            {activeBoardId}
            onOpenBoard={handleOpenBoard}
            onCreateBoard={handleCreateBoard}
            onUpdateBoard={handleUpdateBoard}
            onDeleteBoard={handleDeleteBoard}
        />

        <section class="workspace-content">
            {@render children()}
        </section>
    </div>
{/if}

<style>
    .workspace-shell {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .workspace-content {
        flex: 1;
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .app-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--pico-spacing);
    }

    .app-state article {
        width: min(34rem, 100%);
    }
</style>

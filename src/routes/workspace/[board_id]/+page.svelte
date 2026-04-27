<script lang="ts">
    import { goto } from "$app/navigation";
    import KanbanBoard from "$lib/components/app/kanban/kanban-board.svelte";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const { boardsApi } = getWorkspaceShellContext();

    const board = $derived(
        boardsApi.boards.find((item) => item.id === data.boardId) ?? null,
    );

    function goToWorkspaceRoot() {
        void goto("/workspace");
    }

    $effect(() => {
        if (!board) {
            return;
        }

        if (boardsApi.active?.id === board.id) {
            return;
        }

        boardsApi.setActive(board);
    });
</script>

{#if boardsApi.loading}
    <main class="workspace-state">
        <article aria-busy="true">Loading board...</article>
    </main>
{:else if !board}
    <main class="workspace-state">
        <article class="workspace-missing-board">
            <h1>Board not found</h1>
            <p>The selected board does not exist in this workspace.</p>
            <button type="button" onclick={goToWorkspaceRoot}>
                Back to workspace
            </button>
        </article>
    </main>
{:else}
    <main class="workspace-board-shell">
        <header class="workspace-board-header">
            <h1>{board.name}</h1>
        </header>

        <section class="workspace-board-content" aria-label="Board content">
            <KanbanBoard />
        </section>
    </main>
{/if}

<style>
    .workspace-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }

    .workspace-missing-board {
        margin: 0;
        max-width: 30rem;
        display: grid;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-missing-board h1,
    .workspace-missing-board p {
        margin: 0;
    }

    .workspace-missing-board button {
        justify-self: start;
    }

    .workspace-board-shell {
        height: 100%;
        padding: var(--cds-spacing-05, 1rem);
        display: flex;
        flex-direction: column;
        gap: var(--cds-spacing-04, 0.75rem);
    }

    .workspace-board-header h1 {
        margin: 0;
    }

    .workspace-board-content {
        flex: 1;
        min-height: 0;
    }
</style>

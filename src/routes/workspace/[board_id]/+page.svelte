<script lang="ts">
    import { goto } from "$app/navigation";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const { boardsApi } = getWorkspaceShellContext();

    const board = $derived(
        boardsApi.boards.find((item) => item.id === data.boardId) ?? null,
    );
    const boardJson = $derived(board ? JSON.stringify(board, null, 2) : "");

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
    <main class="workspace-json-view">
        <header>
            <h1>{board.name}</h1>
            <small>Board JSON</small>
        </header>

        <pre>{boardJson}</pre>
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

    .workspace-json-view {
        min-height: 100%;
        padding: var(--cds-spacing-05, 1rem);
        display: grid;
        gap: var(--cds-spacing-04, 0.75rem);
        align-content: start;
    }

    .workspace-json-view header h1,
    .workspace-json-view header small {
        margin: 0;
    }

    .workspace-json-view pre {
        margin: 0;
        padding: var(--cds-spacing-05, 1rem);
        border-radius: 0.5rem;
        border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
        background: color-mix(in srgb, currentColor 4%, transparent);
        overflow: auto;
        font-family: var(--font-display, "Droid Sans Mono", monospace);
        font-size: 0.875rem;
        line-height: 1.5;
    }
</style>

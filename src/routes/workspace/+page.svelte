<script lang="ts">
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    const { boardsApi } = getWorkspaceShellContext();

    const activeBoard = $derived(boardsApi.active);
    const activeBoardJson = $derived(
        activeBoard ? JSON.stringify(activeBoard, null, 2) : "",
    );
</script>

{#if boardsApi.loading}
    <main class="workspace-state">
        <article aria-busy="true">Loading boards...</article>
    </main>
{:else if !activeBoard}
    <main class="workspace-state">
        <article>
            Select a board from the sidebar, or create a new board.
        </article>
    </main>
{:else}
    <main class="workspace-json-view">
        <header>
            <h1>{activeBoard.name}</h1>
            <small>Selected board JSON</small>
        </header>

        <pre>{activeBoardJson}</pre>
    </main>
{/if}

<style>
    .workspace-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
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

<script lang="ts">
    import { goto } from "$app/navigation";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    const { boardsApi } = getWorkspaceShellContext();

    const hasBoards = $derived(boardsApi.boards.length > 0);

    $effect(() => {
        if (boardsApi.loading || !hasBoards) {
            return;
        }

        const firstBoard = boardsApi.boards[0];
        if (!firstBoard) {
            return;
        }

        void goto(`/workspace/${firstBoard.id}`, { replaceState: true });
    });
</script>

{#if boardsApi.loading}
    <main class="workspace-state">
        <article aria-busy="true">Loading boards...</article>
    </main>
{:else if !hasBoards}
    <main class="workspace-state">
        <article>
            No boards yet. Create one from the sidebar to get started.
        </article>
    </main>
{:else}
    <main class="workspace-state">
        <article aria-busy="true">Opening board...</article>
    </main>
{/if}

<style>
    .workspace-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }
</style>

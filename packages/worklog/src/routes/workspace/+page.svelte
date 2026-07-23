<script lang="ts">
    import { goto } from "$app/navigation";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import * as m from "$lib/paraglide/messages.js";

    const { boardsApi } = getWorkspaceShellContext();

    const hasBoards = $derived(boardsApi.boards.length > 0);

    $effect(() => {
        if (boardsApi.loading || !hasBoards) {
            return;
        }

        const lastBoardId = localStorage.getItem("worklog:last_board_id");
        const boardToOpen = lastBoardId 
            ? boardsApi.boards.find(b => b.id === lastBoardId) || boardsApi.boards[0]
            : boardsApi.boards[0];

        if (!boardToOpen) {
            return;
        }

        void goto(`/workspace/${boardToOpen.id}`, { replaceState: true });
    });
</script>

{#if boardsApi.loading}
    <main class="workspace-state">
        <article aria-busy="true">{m.workspace_loading_boards()}</article>
    </main>
{:else if !hasBoards}
    <main class="workspace-state">
        <article>
            {m.workspace_no_boards_sidebar()}
        </article>
    </main>
{:else}
    <main class="workspace-state">
        <article aria-busy="true">{m.workspace_opening_board()}</article>
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

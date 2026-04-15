<script lang="ts">
    import { goto } from "$app/navigation";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    const { boardsApi } = getWorkspaceShellContext();

    let lastRedirectedBoardId = $state<string | null>(null);

    function boardPath(boardId: string) {
        return `/workspace/boards/${encodeURIComponent(boardId)}`;
    }

    $effect(() => {
        const boardId = boardsApi.active?.id ?? null;

        if (!boardId || boardId === lastRedirectedBoardId) {
            return;
        }

        lastRedirectedBoardId = boardId;
        void goto(boardPath(boardId), { replaceState: true });
    });
</script>

<main class="app-state">
    <article aria-busy="true">Opening board...</article>
</main>

<style>
    .app-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--pico-spacing);
    }
</style>

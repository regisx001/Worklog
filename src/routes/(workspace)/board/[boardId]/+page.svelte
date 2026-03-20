<script lang="ts">
    import KanbanWorkspaceView from "$lib/components/app/Kanban/KanbanWorkspaceView.svelte";

    interface BoardPageData {
        boardId: string;
    }

    const { data }: { data: BoardPageData } = $props();
</script>

<KanbanWorkspaceView focusedBoardId={data.boardId} />

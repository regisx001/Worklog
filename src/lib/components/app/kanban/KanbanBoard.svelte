<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import "$lib/styles/dnd.css";
    import KanbanColumn from "./KanbanColumn.svelte";
    import KanbanHeader from "./KanbanHeader.svelte";
    import KanbanSidebar from "./KanbanSidebar.svelte";
    import type {
        BoardSidebarItem,
        KanbanColumnConfig,
        Task,
    } from "./kanban.types.js";

    interface Props {
        title: string;
        description: string;
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onOpenBoard: (boardId: string) => void;
        onRenameBoard: (boardId: string, nextName: string) => void;
        onDeleteBoard: (boardId: string) => void;
        columns: KanbanColumnConfig[];
        tasks: Task[];
        onDrop: (state: DragDropState<Task>) => void;
    }

    let {
        title,
        description,
        boards,
        activeBoardId,
        onOpenBoard,
        onRenameBoard,
        onDeleteBoard,
        columns,
        tasks,
        onDrop,
    }: Props = $props();

    const tasksByStatus = $derived(
        columns.map((column) => ({
            ...column,
            items: tasks.filter((task) => task.status === column.status),
        })),
    );
</script>

<main class="container-fluid kanban-page">
    <div class="kanban-layout">
        <KanbanSidebar
            {boards}
            {activeBoardId}
            {onOpenBoard}
            {onRenameBoard}
            {onDeleteBoard}
        />

        <section class="kanban-workspace">
            <KanbanHeader {title} {description} />

            <section class="kanban-scroll" aria-label="Kanban columns">
                <div class="kanban-grid">
                    {#each tasksByStatus as column (column.status)}
                        <KanbanColumn
                            status={column.status}
                            label={column.label}
                            hint={column.hint}
                            items={column.items}
                            {onDrop}
                        />
                    {/each}
                </div>
            </section>
        </section>
    </div>
</main>

<style>
    .kanban-page {
        padding-inline: 0;
        height: 100%;
        min-height: 0;
    }

    .kanban-layout {
        display: grid;
        grid-template-columns: minmax(12rem, 14rem) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 0.72rem;
        align-items: stretch;
        height: 100%;
        min-height: 0;
    }

    .kanban-workspace {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.75rem;
        min-width: 0;
        min-height: 0;
    }

    .kanban-scroll {
        padding-bottom: 0.25rem;
        min-height: 0;
        overflow: auto;
    }

    .kanban-grid {
        padding: 10px;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(17rem, 1fr);
        gap: 0.7rem;
        align-items: start;
    }

    @media (max-width: 900px) {
        .kanban-layout {
            grid-template-columns: 1fr;
        }

        .kanban-grid {
            grid-auto-columns: minmax(15rem, 1fr);
        }
    }

    @media (max-width: 640px) {
        .kanban-page {
            height: auto;
        }
    }
</style>

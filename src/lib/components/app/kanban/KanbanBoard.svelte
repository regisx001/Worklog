<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import "$lib/styles/dnd.css";
    import KanbanColumn from "./KanbanColumn.svelte";
    import KanbanHeader from "./KanbanHeader.svelte";
    import type { KanbanColumnConfig, Task } from "./kanban.types.js";

    interface Props {
        title: string;
        description: string;
        columns: KanbanColumnConfig[];
        tasks: Task[];
        onDrop: (state: DragDropState<Task>) => void;
    }

    let { title, description, columns, tasks, onDrop }: Props = $props();

    const tasksByStatus = $derived(
        columns.map((column) => ({
            ...column,
            items: tasks.filter((task) => task.status === column.status),
        })),
    );
</script>

<main class="container-fluid kanban-page">
    <KanbanHeader {title} {description} />

    <section class="overflow-auto kanban-scroll" aria-label="Kanban columns">
        <div class="kanban-grid">
            {#each tasksByStatus as column (column.status)}
                <KanbanColumn
                    status={column.status}
                    label={column.label}
                    hint={column.hint}
                    items={column.items}
                    onDrop={onDrop}
                />
            {/each}
        </div>
    </section>
</main>

<style>
    .kanban-page {
        display: grid;
        gap: 0.75rem;
        min-height: calc(100vh - 4rem);
        padding-inline: 0;
    }

    .kanban-scroll {
        padding-bottom: 0.25rem;
    }

    .kanban-grid {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(17rem, 1fr);
        gap: 0.7rem;
        align-items: start;
        min-height: calc(100vh - 10rem);
    }

    @media (max-width: 900px) {
        .kanban-grid {
            grid-auto-columns: minmax(15rem, 1fr);
            min-height: calc(100vh - 8.8rem);
        }
    }

    @media (max-width: 640px) {
        .kanban-page {
            min-height: auto;
        }
    }
</style>

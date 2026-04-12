<script lang="ts">
    import { droppable, type DragDropState } from "@thisux/sveltednd";
    import KanbanCard from "./KanbanCard.svelte";
    import type { Task, TaskStatus } from "./kanban.types.js";

    interface Props {
        status: TaskStatus;
        label: string;
        hint: string;
        items: Task[];
        onDrop: (state: DragDropState<Task>) => void;
    }

    let { status, label, hint, items, onDrop }: Props = $props();
</script>

<article class="kanban-column">
    <header class="kanban-column-header">
        <div class="kanban-column-title">
            <h2>{label}</h2>
            <small>{hint}</small>
        </div>
        <span class="kanban-column-count"
            >{items.length.toString().padStart(2, "0")}</span
        >
    </header>

    <section
        class="kanban-dropzone"
        aria-label={`Dropzone for ${label}`}
        use:droppable={{
            container: status,
            callbacks: { onDrop },
        }}
    >
        {#if items.length === 0}
            <p class="kanban-empty">Drop tasks here</p>
        {/if}

        <div class="kanban-task-list">
            {#each items as task (task.id)}
                <KanbanCard {task} {status} />
            {/each}
        </div>
    </section>
</article>

<style>
    .kanban-column {
        display: grid;
        gap: 0.5rem;
        border: 1px solid rgba(140, 160, 188, 0.28);
        border-radius: 0.62rem;
        background: linear-gradient(
            180deg,
            rgba(18, 25, 37, 0.68) 0%,
            rgba(11, 15, 22, 0.75) 100%
        );
        padding: 0.58rem;
        min-height: 18rem;
    }

    .kanban-column-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(151, 174, 206, 0.2);
        padding: 0.15rem 0.12rem 0.45rem;
    }

    .kanban-column-title {
        display: grid;
        gap: 0.14rem;
    }

    .kanban-column-header h2 {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .kanban-column-header small {
        color: var(--color-text-muted);
        font-size: 0.66rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .kanban-column-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.8rem;
        padding: 0.16rem 0.44rem;
        border-radius: 999px;
        background: rgba(113, 141, 178, 0.18);
        border: 1px solid rgba(152, 178, 209, 0.3);
        color: rgba(232, 241, 251, 0.92);
        font-size: 0.67rem;
        font-weight: 600;
        letter-spacing: 0.03em;
    }

    .kanban-dropzone {
        min-height: 14.5rem;
        border-radius: 0.55rem;
        padding: 0.22rem;
        background: rgba(8, 12, 18, 0.35);
    }

    .kanban-task-list {
        display: grid;
        gap: 0.44rem;
    }

    .kanban-empty {
        margin: 0;
        min-height: 5.5rem;
        border: 1px dashed rgba(168, 188, 216, 0.28);
        border-radius: 0.5rem;
        display: grid;
        place-items: center;
        color: var(--color-text-muted);
        font-size: 0.71rem;
    }
</style>

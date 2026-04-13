<script lang="ts">
    import { draggable } from "@thisux/sveltednd";
    import { priorityLabels } from "./kanban.helpers.js";
    import type { Task, TaskStatus } from "./kanban.types.js";

    interface Props {
        task: Task;
        status: TaskStatus;
    }

    let { task, status }: Props = $props();
</script>

<article
    use:draggable={{
        container: status,
        dragData: task,
    }}
    class="kanban-card svelte-dnd-touch-feedback"
>
    <h3 class="kanban-card-title">{task.title}</h3>

    {#if task.description}
        <p class="kanban-card-description">{task.description}</p>
    {/if}

    <small class="kanban-card-meta"
        >{priorityLabels[task.priority]} priority · {task.updatedAt}</small
    >
</article>

<style>
    .kanban-card {
        display: grid;
        gap: 0.28rem;
        border: 1px solid var(--color-border-soft);
        background: var(--color-surface-2);
        border-radius: 0.5rem;
        padding: 0.55rem 0.6rem;
        margin: 0.25rem 0.35rem;
        transition:
            border-color 120ms ease,
            background-color 120ms ease;
    }

    .kanban-card:hover {
        border-color: rgba(188, 211, 240, 0.42);
        background: rgba(18, 25, 36, 0.9);
    }

    .kanban-card-title {
        margin: 0;
        font-size: 0.78rem;
        line-height: 1.35;
        color: rgba(236, 244, 255, 0.95);
    }

    .kanban-card-description {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.72rem;
        line-height: 1.45;
    }

    .kanban-card-meta {
        color: var(--color-text-muted);
        font-size: 0.66rem;
    }
</style>

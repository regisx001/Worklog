<script lang="ts">
    import { draggable } from "@thisux/sveltednd";
    import { getPriorityTone, priorityLabels } from "./kanban.helpers.js";
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
    <header class="kanban-card-head">
        <h3 class="kanban-card-title">{task.title}</h3>

        <span
            class="kanban-priority-dot"
            data-priority={getPriorityTone(task.priority)}
            aria-label={`Priority ${priorityLabels[task.priority]}`}
        ></span>
    </header>

    <p class="kanban-card-description">{task.description}</p>

    <footer class="kanban-card-footer">
        <small
            >{priorityLabels[task.priority]} priority · {task.updatedAt}</small
        >
    </footer>
</article>

<style>
    .kanban-card {
        border: 1px solid rgba(168, 188, 216, 0.28);
        background: linear-gradient(
            175deg,
            rgba(24, 34, 49, 0.84) 0%,
            rgba(16, 22, 33, 0.88) 100%
        );
        border-radius: 0.52rem;
        padding: 0.5rem;
        transition:
            border-color 120ms ease,
            transform 120ms ease;
    }

    .kanban-card:hover {
        border-color: rgba(188, 211, 240, 0.52);
        transform: translateY(-1px);
    }

    .kanban-card-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.35rem;
        margin-bottom: 0.26rem;
    }

    .kanban-card-title {
        margin: 0;
        font-size: 0.78rem;
        line-height: 1.35;
        color: rgba(236, 244, 255, 0.98);
    }

    .kanban-priority-dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        flex: 0 0 auto;
        margin-top: 0.14rem;
    }

    .kanban-priority-dot[data-priority="low"] {
        background: #8fabc8;
    }

    .kanban-priority-dot[data-priority="medium"] {
        background: #ffd36e;
    }

    .kanban-priority-dot[data-priority="high"] {
        background: #ff7d87;
    }

    .kanban-card-description {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.72rem;
        line-height: 1.45;
    }

    .kanban-card-footer {
        margin-top: 0.42rem;
        padding-top: 0.28rem;
        border-top: 1px solid rgba(169, 190, 219, 0.2);
    }

    .kanban-card-footer small {
        color: var(--color-text-muted);
        font-size: 0.66rem;
    }
</style>

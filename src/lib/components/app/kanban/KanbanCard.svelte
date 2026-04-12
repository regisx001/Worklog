<script lang="ts">
    import { draggable } from "@thisux/sveltednd";
    import {
        getIssueKey,
        getLabelTone,
        getPriorityTone,
        priorityLabels,
    } from "./kanban.helpers.js";
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
    data-priority={getPriorityTone(task.priority)}
>
    <header class="kanban-card-head">
        <span
            class="kanban-issue-key"
            aria-label={`Issue key ${getIssueKey(task.id)}`}
        >
            {getIssueKey(task.id)}
        </span>

        <span
            class="kanban-priority-pill"
            data-priority={getPriorityTone(task.priority)}
            aria-label={`Priority ${priorityLabels[task.priority]}`}
        >
            {priorityLabels[task.priority]}
        </span>
    </header>

    <h3 class="kanban-card-title">{task.title}</h3>

    <p class="kanban-card-description">{task.description}</p>

    <ul class="kanban-label-list" aria-label="Task labels">
        {#each task.labels as label (label)}
            <li>
                <span class="kanban-label" data-tone={getLabelTone(label)}>
                    {label}
                </span>
            </li>
        {/each}
    </ul>

    <footer class="kanban-card-footer">
        <small>{task.updatedAt}</small>
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
        border-radius: 0.55rem;
        padding: 0.54rem;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        transition:
            border-color 130ms ease,
            transform 130ms ease,
            box-shadow 130ms ease;
    }

    .kanban-card[data-priority="low"] {
        border-left: 3px solid #8fabc8;
    }

    .kanban-card[data-priority="medium"] {
        border-left: 3px solid #ffd36e;
    }

    .kanban-card[data-priority="high"] {
        border-left: 3px solid #ff7d87;
    }

    .kanban-card:hover {
        border-color: rgba(188, 211, 240, 0.52);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
    }

    .kanban-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.42rem;
        margin-bottom: 0.42rem;
    }

    .kanban-issue-key {
        font-family: "JetBrains Mono", "Consolas", monospace;
        font-size: 0.64rem;
        letter-spacing: 0.05em;
        color: rgba(187, 203, 223, 0.84);
    }

    .kanban-priority-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0.13rem 0.4rem;
        font-size: 0.62rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .kanban-priority-pill[data-priority="low"] {
        color: #cde1f8;
        background: rgba(93, 131, 175, 0.35);
        border: 1px solid rgba(135, 172, 215, 0.44);
    }

    .kanban-priority-pill[data-priority="medium"] {
        color: #ffe8ab;
        background: rgba(140, 108, 36, 0.34);
        border: 1px solid rgba(228, 190, 101, 0.44);
    }

    .kanban-priority-pill[data-priority="high"] {
        color: #ffd0d4;
        background: rgba(142, 59, 72, 0.36);
        border: 1px solid rgba(247, 129, 146, 0.44);
    }

    .kanban-card-title {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.35;
        color: rgba(236, 244, 255, 0.98);
    }

    .kanban-card-description {
        margin: 0.32rem 0 0;
        color: var(--color-text-muted);
        font-size: 0.73rem;
        line-height: 1.45;
    }

    .kanban-label-list {
        margin: 0;
        margin-top: 0.46rem;
        padding: 0;
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.32rem;
    }

    .kanban-label {
        display: inline-flex;
        align-items: center;
        padding: 0.08rem 0.4rem;
        border-radius: 999px;
        font-size: 0.62rem;
        line-height: 1.35;
        letter-spacing: 0.02em;
        border: 1px solid transparent;
    }

    .kanban-label[data-tone="blue"] {
        color: #b8d5ff;
        background: rgba(53, 91, 141, 0.34);
        border-color: rgba(95, 136, 193, 0.42);
    }

    .kanban-label[data-tone="red"] {
        color: #ffd1d8;
        background: rgba(131, 52, 65, 0.35);
        border-color: rgba(197, 93, 113, 0.45);
    }

    .kanban-label[data-tone="green"] {
        color: #cbf0d8;
        background: rgba(42, 101, 76, 0.33);
        border-color: rgba(80, 154, 122, 0.43);
    }

    .kanban-label[data-tone="purple"] {
        color: #ddd2ff;
        background: rgba(78, 61, 131, 0.34);
        border-color: rgba(122, 104, 179, 0.44);
    }

    .kanban-label[data-tone="gray"] {
        color: #cfd9e8;
        background: rgba(78, 92, 116, 0.35);
        border-color: rgba(117, 133, 161, 0.44);
    }

    .kanban-card-footer {
        margin-top: 0.5rem;
        padding-top: 0.34rem;
        border-top: 1px solid rgba(169, 190, 219, 0.2);
    }

    .kanban-card-footer small {
        color: var(--color-text-muted);
        font-size: 0.66rem;
    }
</style>

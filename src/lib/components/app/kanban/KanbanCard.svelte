<script lang="ts">
    import { draggable } from "@thisux/sveltednd";
    import { priorityLabels } from "./kanban.helpers.js";
    import type { Task, TaskStatus } from "./kanban.types.js";

    interface Props {
        task: Task;
        status: TaskStatus;
        onSelectTicket: (ticketId: string) => void;
    }

    let { task, status, onSelectTicket }: Props = $props();
    let ignoreNextClick = $state(false);
    let clearIgnoreClickTimeout: ReturnType<typeof setTimeout> | null = null;

    function resetClickGuard() {
        if (!clearIgnoreClickTimeout) {
            return;
        }

        clearTimeout(clearIgnoreClickTimeout);
        clearIgnoreClickTimeout = null;
    }

    function handleDragStart() {
        ignoreNextClick = true;
        resetClickGuard();
    }

    function handleDragEnd() {
        resetClickGuard();
        clearIgnoreClickTimeout = setTimeout(() => {
            ignoreNextClick = false;
            clearIgnoreClickTimeout = null;
        }, 40);
    }

    function handleCardClick() {
        if (ignoreNextClick) {
            return;
        }

        onSelectTicket(task.id);
    }

    $effect(() => {
        return () => {
            resetClickGuard();
        };
    });

    const updatedLabel = $derived(
        new Date(task.updated_at).toLocaleDateString(),
    );

    const dueDateLabel = $derived(
        task.due_date ? new Date(task.due_date).toLocaleDateString() : "",
    );

    const isOverdue = $derived.by(() => {
        if (!task.due_date || task.status === "done") {
            return false;
        }

        return new Date(task.due_date) < new Date();
    });
</script>

<article
    use:draggable={{
        container: status,
        dragData: task,
        callbacks: {
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
        },
    }}
    class="kanban-card svelte-dnd-touch-feedback"
    data-done={status === "done"}
>
    <button
        type="button"
        class="kanban-card-trigger"
        onclick={handleCardClick}
    >
        <small class="kanban-card-id">{task.id}</small>

        <p class="kanban-card-title">{task.title}</p>

        <div class="kanban-card-meta-row">
            <div class="kanban-card-tags">
                <mark data-priority={task.priority}
                    >{priorityLabels[task.priority]}</mark
                >
                <mark data-type={task.ticket_type}>{task.ticket_type}</mark>
            </div>

            {#if task.due_date}
                <small class="kanban-card-due-date" data-overdue={isOverdue}>
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                            fill="none"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                        ></path>
                    </svg>
                    <span>{dueDateLabel}</span>
                </small>
            {:else}
                <small class="kanban-card-due-date">{updatedLabel}</small>
            {/if}
        </div>
    </button>
</article>

<style>
    .kanban-card {
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.4);
        cursor: grab;
        margin: 0;
        padding: calc(var(--pico-spacing) * 0.65);
        transition:
            transform 150ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-card-trigger {
        width: 100%;
        margin: 0;
        border: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.4);
    }

    .kanban-card-trigger:focus-visible {
        outline: var(--pico-border-width) solid var(--pico-primary);
        outline-offset: calc(var(--pico-spacing) * 0.1);
        border-radius: var(--pico-border-radius);
    }

    .kanban-card:hover {
        transform: translateY(calc(var(--pico-spacing) * -0.03));
        box-shadow: var(--pico-card-box-shadow);
    }

    .kanban-card[data-done="true"] {
        opacity: 0.6;
    }

    .kanban-card[data-done="true"]:hover {
        opacity: 1;
    }

    .kanban-card-id {
        margin: 0;
        font-family: var(--pico-font-family-monospace);
        color: var(--pico-muted-color);
        font-size: calc(var(--pico-font-size-small) * 0.82);
    }

    .kanban-card-title {
        margin: 0;
        font-size: var(--pico-font-size-small);
        font-weight: 500;
        line-height: 1.35;
        color: var(--pico-color);
        display: -webkit-box;
        line-clamp: 3;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .kanban-card-meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--pico-spacing) * 0.3);
    }

    .kanban-card-tags {
        display: flex;
        gap: calc(var(--pico-spacing) * 0.2);
        min-width: 0;
    }

    .kanban-card-tags mark {
        font-size: calc(var(--pico-font-size-small) * 0.8);
        padding: calc(var(--pico-spacing) * 0.08)
            calc(var(--pico-spacing) * 0.35);
        border-radius: var(--pico-border-radius);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        white-space: nowrap;
    }

    .kanban-card-tags mark[data-priority="p1"] {
        color: var(--pico-del-color);
        background: color-mix(in oklch, var(--pico-del-color) 12%, transparent);
    }

    .kanban-card-tags mark[data-priority="p2"] {
        color: var(--worklog-warning, var(--pico-color));
        background: color-mix(
            in oklch,
            var(--worklog-warning, var(--pico-color)) 12%,
            transparent
        );
    }

    .kanban-card-tags mark[data-priority="p3"] {
        color: var(--pico-ins-color);
        background: color-mix(in oklch, var(--pico-ins-color) 12%, transparent);
    }

    .kanban-card-tags mark[data-type="feature"] {
        color: var(--pico-primary);
        background: color-mix(in oklch, var(--pico-primary) 12%, transparent);
    }

    .kanban-card-tags mark[data-type="bug"] {
        color: var(--pico-del-color);
        background: color-mix(in oklch, var(--pico-del-color) 12%, transparent);
    }

    .kanban-card-tags mark[data-type="chore"] {
        color: var(--pico-ins-color);
        background: color-mix(in oklch, var(--pico-ins-color) 12%, transparent);
    }

    .kanban-card-due-date {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.2);
        color: var(--pico-muted-color);
        font-family: var(--pico-font-family-monospace);
        font-size: calc(var(--pico-font-size-small) * 0.85);
        white-space: nowrap;
    }

    .kanban-card-due-date[data-overdue="true"] {
        color: var(--pico-del-color);
    }

    .kanban-card-due-date svg {
        width: calc(var(--pico-spacing) * 0.45);
        height: calc(var(--pico-spacing) * 0.45);
        flex-shrink: 0;
    }
</style>

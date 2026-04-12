<script lang="ts">
    import {
        droppable,
        draggable,
        type DragDropState,
    } from "@thisux/sveltednd";
    import { flip } from "svelte/animate";
    import { fade } from "svelte/transition";
    import type { TicketPriority, TicketStatus } from "$lib/components/app/types.js";
    import "$lib/styles/dnd.css";

    type TaskStatus = TicketStatus;

    interface Task {
        id: string;
        title: string;
        description: string;
        status: TaskStatus;
        priority: TicketPriority;
        labels: string[];
        updatedAt: string;
    }

    let tasks = $state<Task[]>([
        {
            id: "1",
            title: "design system updates",
            description: "Migrate board screens from utility classes to semantic PicoCSS.",
            status: "todo",
            priority: "high",
            labels: ["ui", "design"],
            updatedAt: "2h ago",
        },
        {
            id: "2",
            title: "user research",
            description: "Summarize five customer interviews into action items.",
            status: "in_progress",
            priority: "medium",
            labels: ["research", "customer"],
            updatedAt: "5h ago",
        },
        {
            id: "3",
            title: "api documentation",
            description: "Write examples for every endpoint in the internal API guide.",
            status: "todo",
            priority: "low",
            labels: ["docs", "api"],
            updatedAt: "1d ago",
        },
        {
            id: "4",
            title: "performance audit",
            description: "Profile startup and trim expensive render paths.",
            status: "in_progress",
            priority: "high",
            labels: ["infra", "performance"],
            updatedAt: "3h ago",
        },
        {
            id: "5",
            title: "bug fixes",
            description: "Resolve reported authentication and session timeout issues.",
            status: "done",
            priority: "high",
            labels: ["bug", "auth"],
            updatedAt: "Yesterday",
        },
    ]);

    const columns: TaskStatus[] = ["todo", "in_progress", "done"];
    const columnLabels: Record<TaskStatus, string> = {
        todo: "To Do",
        in_progress: "In Progress",
        done: "Done",
    };

    const priorityLabels: Record<TicketPriority, string> = {
        low: "Low",
        medium: "Medium",
        high: "High",
    };

    const columnHints: Record<TaskStatus, string> = {
        todo: "Backlog",
        in_progress: "Active",
        done: "Completed",
    };

    const validColumns = new Set<TaskStatus>(columns);

    const tasksByStatus = $derived(
        columns.map((status) => ({
            status,
            items: tasks.filter((task) => task.status === status),
        })),
    );

    function handleDrop(state: DragDropState<Task>) {
        const { draggedItem, targetContainer } = state;
        if (!targetContainer || !validColumns.has(targetContainer as TaskStatus)) {
            return;
        }

        const nextStatus = targetContainer as TaskStatus;

        tasks = tasks.map((task) => {
            if (task.id === draggedItem.id) {
                return { ...task, status: nextStatus };
            }

            return task;
        });
    }

    const getPriorityTone = (priority: Task["priority"]) => priority;

    const getIssueKey = (id: string) => `WL-${id.padStart(3, "0")}`;

    const getLabelTone = (label: string) => {
        const normalized = label.toLowerCase();

        if (normalized.includes("bug") || normalized.includes("auth")) return "red";
        if (normalized.includes("api") || normalized.includes("infra")) return "blue";
        if (normalized.includes("performance") || normalized.includes("design")) return "purple";
        if (normalized.includes("docs") || normalized.includes("research")) return "gray";

        return "green";
    };
</script>

<svelte:head>
    <title>Worklog | Kanban</title>
    <meta
        name="description"
        content="Local-first kanban board with drag and drop powered by @thisux/sveltednd."
    />
</svelte:head>

<main class="container-fluid kanban-page">
    <header class="kanban-header">
        <h1>Kanban Board</h1>
        <p>Drag and drop tasks between columns to update their status instantly.</p>
    </header>

    <section class="overflow-auto kanban-scroll" aria-label="Kanban columns">
        <div class="kanban-grid">
            {#each tasksByStatus as { status, items } (status)}
                <article class="kanban-column">
                    <header class="kanban-column-header">
                        <div class="kanban-column-title">
                            <h2>{columnLabels[status]}</h2>
                            <small>{columnHints[status]}</small>
                        </div>
                        <span class="kanban-column-count"
                            >{items.length.toString().padStart(2, "0")}</span
                        >
                    </header>

                    <section
                        class="kanban-dropzone"
                        aria-label={`Dropzone for ${columnLabels[status]}`}
                        use:droppable={{
                            container: status,
                            callbacks: { onDrop: handleDrop },
                        }}
                    >
                        {#if items.length === 0}
                            <p class="kanban-empty">Drop tasks here</p>
                        {/if}

                        <div class="kanban-task-list">
                            {#each items as task (task.id)}
                                <article
                                    use:draggable={{
                                        container: status,
                                        dragData: task,
                                    }}
                                    animate:flip={{ duration: 180 }}
                                    in:fade={{ duration: 130 }}
                                    out:fade={{ duration: 130 }}
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

                                    <p class="kanban-card-description">
                                        {task.description}
                                    </p>

                                    <ul class="kanban-label-list" aria-label="Task labels">
                                        {#each task.labels as label (label)}
                                            <li>
                                                <span
                                                    class="kanban-label"
                                                    data-tone={getLabelTone(label)}
                                                >
                                                    {label}
                                                </span>
                                            </li>
                                        {/each}
                                    </ul>

                                    <footer class="kanban-card-footer">
                                        <small>{task.updatedAt}</small>
                                    </footer>
                                </article>
                            {/each}
                        </div>
                    </section>
                </article>
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

    .kanban-header {
        border: 1px solid var(--color-border-soft);
        background: linear-gradient(
            160deg,
            rgba(19, 28, 41, 0.86) 0%,
            rgba(13, 19, 29, 0.8) 100%
        );
        border-radius: 0.55rem;
        padding: 0.85rem 0.95rem;
    }

    .kanban-header h1 {
        margin: 0;
        font-size: 1rem;
        line-height: 1.2;
    }

    .kanban-header p {
        margin: 0.3rem 0 0;
        color: var(--color-text-muted);
        font-size: 0.78rem;
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
        transition: border-color 130ms ease, transform 130ms ease,
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

        .kanban-header {
            padding: 0.75rem 0.8rem;
        }

        .kanban-header h1 {
            font-size: 0.92rem;
        }

        .kanban-header p {
            font-size: 0.71rem;
        }
    }
</style>

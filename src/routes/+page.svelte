<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import KanbanBoard from "$lib/components/app/kanban/KanbanBoard.svelte";
    import type {
        KanbanColumnConfig,
        Task,
        TaskStatus,
    } from "$lib/components/app/kanban/kanban.types.js";

    let tasks = $state<Task[]>([
        {
            id: "1",
            title: "design system updates",
            description:
                "Migrate board screens from utility classes to semantic PicoCSS.",
            status: "todo",
            priority: "high",
            labels: ["ui", "design"],
            updatedAt: "2h ago",
        },
        {
            id: "2",
            title: "user research",
            description:
                "Summarize five customer interviews into action items.",
            status: "in_progress",
            priority: "medium",
            labels: ["research", "customer"],
            updatedAt: "5h ago",
        },
        {
            id: "3",
            title: "api documentation",
            description:
                "Write examples for every endpoint in the internal API guide.",
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
            description:
                "Resolve reported authentication and session timeout issues.",
            status: "done",
            priority: "high",
            labels: ["bug", "auth"],
            updatedAt: "Yesterday",
        },
    ]);

    const columns: KanbanColumnConfig[] = [
        { status: "todo", label: "To Do", hint: "Backlog" },
        { status: "in_progress", label: "In Progress", hint: "Active" },
        { status: "done", label: "Done", hint: "Completed" },
    ];

    const validColumns = new Set<TaskStatus>(
        columns.map((column) => column.status),
    );

    function handleDrop(state: DragDropState<Task>) {
        const { draggedItem, targetContainer } = state;
        if (
            !targetContainer ||
            !validColumns.has(targetContainer as TaskStatus)
        ) {
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
</script>

<svelte:head>
    <title>Worklog | Kanban</title>
    <meta
        name="description"
        content="Local-first kanban board with drag and drop powered by @thisux/sveltednd."
    />
</svelte:head>

<KanbanBoard
    title="Kanban Board"
    description="Drag and drop tasks between columns to update their status instantly."
    {columns}
    {tasks}
    onDrop={handleDrop}
/>

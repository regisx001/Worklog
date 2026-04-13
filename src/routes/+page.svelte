<script lang="ts">
	import type { DragDropState } from "@thisux/sveltednd";
	import KanbanBoard from "$lib/components/app/kanban/KanbanBoard.svelte";
	import type {
		BoardSidebarItem,
		KanbanColumnConfig,
		Task,
		TaskStatus,
	} from "$lib/components/app/kanban/kanban.types.js";

	const columns: KanbanColumnConfig[] = [
		{ status: "todo", label: "To Do", hint: "Backlog" },
		{ status: "in_progress", label: "In Progress", hint: "Active" },
		{ status: "done", label: "Done", hint: "Completed" },
	];

	const baseBoards = [
		{ id: "engineering", name: "Engineering" },
		{ id: "product", name: "Product" },
		{ id: "design", name: "Design" },
	] as const;

	let activeBoardId = $state<string>(baseBoards[0].id);

	let allTasks = $state<Task[]>([
		{
			id: "1",
			board_id: "engineering",
			title: "Design system updates",
			description:
				"Migrate board screens from utility classes to semantic PicoCSS.",
			status: "todo",
			priority: "high",
			labels: ["ui", "design"],
			updatedAt: "2h ago",
		},
		{
			id: "2",
			board_id: "engineering",
			title: "User research",
			description:
				"Summarize five customer interviews into action items.",
			status: "in_progress",
			priority: "medium",
			labels: ["research", "customer"],
			updatedAt: "5h ago",
		},
		{
			id: "3",
			board_id: "product",
			title: "API documentation",
			description:
				"Write examples for every endpoint in the internal API guide.",
			status: "todo",
			priority: "low",
			labels: ["docs", "api"],
			updatedAt: "1d ago",
		},
		{
			id: "4",
			board_id: "product",
			title: "Performance audit",
			description: "Profile startup and trim expensive render paths.",
			status: "in_progress",
			priority: "high",
			labels: ["infra", "performance"],
			updatedAt: "3h ago",
		},
		{
			id: "5",
			board_id: "design",
			title: "Bug fixes",
			description:
				"Resolve reported authentication and session timeout issues.",
			status: "done",
			priority: "high",
			labels: ["bug", "auth"],
			updatedAt: "Yesterday",
		},
	]);

	const boards = $derived<BoardSidebarItem[]>(
		baseBoards.map((board) => ({
			...board,
			issueCount: allTasks.filter((task) => task.board_id === board.id)
				.length,
		})),
	);

	const activeBoardName = $derived(
		boards.find((board) => board.id === activeBoardId)?.name ?? "Board",
	);

	const tasks = $derived(
		allTasks.filter((task) => task.board_id === activeBoardId),
	);

	const validColumns = new Set<TaskStatus>(
		columns.map((column) => column.status),
	);

	function selectBoard(boardId: string) {
		activeBoardId = boardId;
	}

	function handleDrop(state: DragDropState<Task>) {
		const { draggedItem, targetContainer } = state;
		if (
			!targetContainer ||
			!validColumns.has(targetContainer as TaskStatus)
		) {
			return;
		}

		const nextStatus = targetContainer as TaskStatus;

		allTasks = allTasks.map((task) => {
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
		content="Local-first kanban board with board sidebar and drag-and-drop workflow."
	/>
</svelte:head>

<KanbanBoard
	title={`${activeBoardName} Board`}
	description="Drag and drop tasks between columns to update their status instantly."
	{boards}
	{activeBoardId}
	onSelectBoard={selectBoard}
	{columns}
	{tasks}
	onDrop={handleDrop}
/>

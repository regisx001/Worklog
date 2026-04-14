<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import "$lib/styles/dnd.css";
    import KanbanColumn from "./KanbanColumn.svelte";
    import KanbanHeader from "./KanbanHeader.svelte";
    import KanbanSidebar from "./KanbanSidebar.svelte";
    import TicketPanel from "./TicketPanel.svelte";
    import type {
        BoardSidebarItem,
        KanbanColumnConfig,
        Task,
    } from "./kanban.types.js";

    interface Props {
        workspaceName: string;
        title: string;
        description: string;
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onOpenBoard: (boardId: string) => void;
        onUpdateBoard: (
            boardId: string,
            updates: { name: string; description: string },
        ) => void;
        onDeleteBoard: (boardId: string) => void;
        columns: KanbanColumnConfig[];
        tasks: Task[];
        onDrop: (state: DragDropState<Task>) => void;
        onFilter?: () => void;
        onCreateTicket?: (
            status: Task["status"],
            title: string,
        ) => Promise<void> | void;
        onUpdateTicket: (
            ticketId: string,
            updates: Partial<
                Pick<
                    Task,
                    | "title"
                    | "description"
                    | "status"
                    | "priority"
                    | "ticket_type"
                    | "due_date"
                    | "comments"
                >
            >,
        ) => Promise<void> | void;
    }

    let {
        workspaceName,
        title,
        description,
        boards,
        activeBoardId,
        onOpenBoard,
        onUpdateBoard,
        onDeleteBoard,
        columns,
        tasks,
        onDrop,
        onFilter = () => {},
        onCreateTicket = async () => {},
        onUpdateTicket,
    }: Props = $props();

    let inlineCreateStatus = $state<Task["status"] | null>(null);
    let selectedTicketId = $state<string | null>(null);

    const inProgressCount = $derived(
        tasks.filter((task) => task.status === "in_progress").length,
    );

    const tasksByStatus = $derived(
        columns.map((column) => ({
            ...column,
            items: tasks.filter((task) => task.status === column.status),
        })),
    );

    const selectedTicket = $derived(
        tasks.find((task) => task.id === selectedTicketId) ?? null,
    );

    function openInlineCreate(status: Task["status"]) {
        inlineCreateStatus = status;
    }

    function closeInlineCreate() {
        inlineCreateStatus = null;
    }

    async function submitInlineCreate(status: Task["status"], title: string) {
        await onCreateTicket(status, title);
        closeInlineCreate();
    }

    function openTicketPanel(ticketId: string) {
        selectedTicketId = ticketId;
    }

    function closeTicketPanel() {
        selectedTicketId = null;
    }

    async function handlePanelUpdate(
        ticketId: string,
        updates: Partial<
            Pick<
                Task,
                | "title"
                | "description"
                | "status"
                | "priority"
                | "ticket_type"
                | "due_date"
                | "comments"
            >
        >,
    ) {
        await onUpdateTicket(ticketId, updates);
    }

    $effect(() => {
        if (!selectedTicketId) {
            return;
        }

        const stillExists = tasks.some((task) => task.id === selectedTicketId);
        if (!stillExists) {
            selectedTicketId = null;
        }
    });
</script>

<main class="kanban-shell">
    <KanbanSidebar
        {workspaceName}
        {boards}
        {activeBoardId}
        {onOpenBoard}
        {onUpdateBoard}
        {onDeleteBoard}
    />

    <section class="kanban-main" data-panel-open={Boolean(selectedTicket)}>
        <KanbanHeader
            {title}
            ticketCount={tasks.length}
            {inProgressCount}
            {onFilter}
            onCreateTicket={() => openInlineCreate("todo")}
        />

        <section class="kanban-body" aria-label="Kanban columns">
            <div class="kanban-board-track">
                {#each tasksByStatus as column (column.status)}
                    <KanbanColumn
                        status={column.status}
                        label={column.label}
                        hint={column.hint}
                        items={column.items}
                        {onDrop}
                        isCreateOpen={inlineCreateStatus === column.status}
                        onOpenCreate={() => openInlineCreate(column.status)}
                        onCancelCreate={closeInlineCreate}
                        onSubmitCreate={submitInlineCreate}
                        onSelectTicket={openTicketPanel}
                    />
                {/each}
            </div>
        </section>
    </section>

    <TicketPanel
        open={Boolean(selectedTicket)}
        boardName={title}
        ticket={selectedTicket}
        onClose={closeTicketPanel}
        onUpdateTicket={handlePanelUpdate}
    />
</main>

<style>
    .kanban-shell {
        display: flex;
        flex-direction: row;
        height: 100dvh;
        overflow: hidden;
    }

    .kanban-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .kanban-body {
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        padding: var(--pico-spacing);
        transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-board-track {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: var(--pico-spacing);
        min-height: 100%;
    }

    .kanban-main[data-panel-open="true"] .kanban-body {
        opacity: 0.4;
        pointer-events: none;
    }
</style>

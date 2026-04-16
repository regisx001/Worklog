<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import "$lib/styles/dnd.css";
    import KanbanColumn from "./KanbanColumn.svelte";
    import KanbanHeader from "./KanbanHeader.svelte";
    // @ts-ignore
    import TicketPanel from "./TicketPanel.svelte";
    import type { KanbanColumnConfig, Task } from "./kanban.types.js";

    interface Props {
        title: string;
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
        title,
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

<main class="kanban-main" data-panel-open={Boolean(selectedTicket)}>
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

    <TicketPanel
        open={Boolean(selectedTicket)}
        boardName={title}
        ticket={selectedTicket}
        onClose={closeTicketPanel}
        onUpdateTicket={handlePanelUpdate}
    />
</main>

<style>
    .kanban-main {
        flex: 1;
        min-width: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .kanban-body {
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        min-height: 0;
        padding: var(--pico-spacing);
        transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-board-track {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: var(--pico-spacing);
        min-height: 100%;
        height: 100%;
    }

    .kanban-main[data-panel-open="true"] .kanban-body {
        opacity: 0.4;
        pointer-events: none;
    }
</style>

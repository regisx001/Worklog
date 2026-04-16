<script lang="ts">
    import { droppable, type DragDropState } from "@thisux/sveltednd";
    import KanbanCard from "./KanbanCard.svelte";
    import InlineTicketCreate from "./InlineTicketCreate.svelte";
    import type { Task, TaskStatus } from "./kanban.types.js";

    interface Props {
        status: TaskStatus;
        label: string;
        hint: string;
        items: Task[];
        onDrop: (state: DragDropState<Task>) => void;
        isCreateOpen: boolean;
        onOpenCreate: () => void;
        onCancelCreate: () => void;
        onSubmitCreate: (
            status: TaskStatus,
            title: string,
        ) => Promise<void> | void;
        onSelectTicket: (ticketId: string) => void;
    }

    let {
        status,
        label,
        hint,
        items,
        onDrop,
        isCreateOpen,
        onOpenCreate,
        onCancelCreate,
        onSubmitCreate,
        onSelectTicket,
    }: Props = $props();

    const statusColor = $derived.by(() => {
        if (status === "backlog") {
            return "var(--pico-muted-color)";
        }

        if (status === "todo") {
            return "color-mix(in oklch, var(--pico-muted-color) 80%, var(--pico-color))";
        }

        if (status === "in_progress") {
            return "var(--pico-primary)";
        }

        return "var(--pico-ins-color)";
    });

    function handleCreate(title: string) {
        return onSubmitCreate(status, title);
    }
</script>

<section class="kanban-column" aria-label={`${label} column`}>
    <div class="kanban-column-header">
        <div class="kanban-column-left">
            <span
                class="kanban-status-dot"
                style={`--column-color: ${statusColor};`}
                aria-hidden="true"
            ></span>
            <strong
                class="kanban-column-title"
                style={`--column-color: ${statusColor};`}
                title={hint}>{label}</strong
            >
            <small class="kanban-column-count">{items.length}</small>
        </div>

        <button
            type="button"
            class="outline kanban-column-add-button"
            aria-label={`Add ticket to ${label}`}
            title={`Add ticket to ${label}`}
            onclick={onOpenCreate}
        >
            +
        </button>
    </div>

    <div
        class="kanban-column-cards"
        aria-label={`Dropzone for ${label}`}
        use:droppable={{
            container: status,
            callbacks: { onDrop },
        }}
    >
        {#if isCreateOpen}
            <InlineTicketCreate
                onCancel={onCancelCreate}
                onCreate={handleCreate}
            />
        {/if}

        {#if items.length === 0}
            <div class="kanban-empty-column">
                <small>Nothing in {label} yet</small>
            </div>
        {/if}

        {#each items as task (task.id)}
            <KanbanCard {task} {status} {onSelectTicket} />
        {/each}
    </div>

    {#if !isCreateOpen}
        <button
            type="button"
            class="kanban-column-add-row"
            onclick={onOpenCreate}
        >
            + Add ticket
        </button>
    {/if}
</section>

<style>
    .kanban-column {
        display: flex;
        flex-direction: column;
        width: calc(var(--pico-spacing) * 24);
        min-width: calc(var(--pico-spacing) * 18);
        max-height: 100%;
        height: 100%;
        min-height: 0;
        flex-shrink: 0;
        gap: calc(var(--pico-spacing) * 0.35);
    }

    .kanban-column-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: calc(var(--pico-spacing) * 0.3)
            calc(var(--pico-spacing) * 0.25) calc(var(--pico-spacing) * 0.5);
    }

    .kanban-column-left {
        display: flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.4);
    }

    .kanban-status-dot {
        width: calc(var(--pico-spacing) * 0.45);
        height: calc(var(--pico-spacing) * 0.45);
        border-radius: 50%;
        background: var(--column-color);
        flex-shrink: 0;
    }

    .kanban-column-title {
        margin: 0;
        font-size: var(--pico-font-size-small);
        color: var(--column-color);
        letter-spacing: 0.01em;
    }

    .kanban-column-count {
        margin: 0;
        color: var(--color-text-muted);
        font-family: var(--pico-font-family-monospace);
        font-size: var(--pico-font-size-small);
    }

    .kanban-column-add-button {
        margin: 0;
        padding: 0 calc(var(--pico-spacing) * 0.3);
        color: var(--pico-muted-color);
        background: transparent;
        border-color: transparent;
        font-size: calc(var(--pico-font-size) * 1.1);
        line-height: 1.1;
    }

    .kanban-column-add-button:hover {
        color: var(--pico-color);
        border-color: var(--pico-border-color);
    }

    .kanban-column-cards {
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.5);
        overflow-y: auto;
        flex: 1;
        padding-right: calc(var(--pico-spacing) * 0.25);
        min-height: calc(var(--pico-spacing) * 6.5);
    }

    .kanban-empty-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: calc(var(--pico-spacing) * 2) var(--pico-spacing);
        border: var(--pico-border-width) dashed var(--pico-muted-border-color);
        border-radius: var(--pico-border-radius);
    }

    .kanban-empty-column small {
        margin: 0;
        color: var(--pico-muted-color);
        font-size: var(--pico-font-size-small);
    }

    .kanban-column-add-row {
        width: 100%;
        margin: 0;
        border: var(--pico-border-width) dashed var(--pico-muted-border-color);
        background: transparent;
        color: var(--pico-muted-color);
        border-radius: var(--pico-border-radius);
        padding: calc(var(--pico-spacing) * 0.5) var(--pico-spacing);
        font-size: var(--pico-font-size-small);
        text-align: left;
        cursor: pointer;
    }

    .kanban-column-add-row:hover {
        border-color: var(--pico-border-color);
        color: var(--pico-color);
    }
</style>

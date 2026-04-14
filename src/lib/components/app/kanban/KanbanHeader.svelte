<script lang="ts">
    interface Props {
        title: string;
        ticketCount: number;
        inProgressCount: number;
        onFilter: () => void;
        onCreateTicket: () => void;
    }

    let {
        title,
        ticketCount,
        inProgressCount,
        onFilter,
        onCreateTicket,
    }: Props = $props();
</script>

<header class="kanban-header">
    <div class="kanban-title-block">
        <h2>{title}</h2>
        <small>{ticketCount} tickets · {inProgressCount} in progress</small>
    </div>

    <div class="kanban-header-actions">
        <button
            type="button"
            class="secondary outline kanban-header-button"
            onclick={onFilter}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                    d="M4 6h16M7 12h10m-7 6h4"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="1.5"
                ></path>
            </svg>
            <span>Filter</span>
        </button>

        <button
            type="button"
            class="kanban-header-button"
            onclick={onCreateTicket}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                    d="M12 5v14m-7-7h14"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="1.5"
                ></path>
            </svg>
            <span>New Ticket</span>
        </button>
    </div>
</header>

<style>
    .kanban-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--pico-spacing) * 0.75);
        padding: calc(var(--pico-spacing) * 0.75) var(--pico-spacing);
        flex-shrink: 0;
        background: var(--pico-card-background-color);
        border-bottom: var(--pico-border-width) solid
            var(--pico-muted-border-color);
    }

    .kanban-title-block {
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.15);
        min-width: 0;
    }

    .kanban-title-block h2 {
        margin: 0;
        font-size: var(--pico-font-size);
        line-height: 1.2;
        font-weight: var(--pico-font-weight-bold);
        letter-spacing: -0.02em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .kanban-title-block small {
        margin: 0;
        color: var(--pico-muted-color);
        font-family: var(--pico-font-family-monospace);
        font-size: var(--pico-font-size-small);
    }

    .kanban-header-actions {
        display: flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.5);
    }

    .kanban-header-button {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.3);
        padding: 0.25rem 0.5rem;
        font-size: var(--pico-font-size-small);
        white-space: nowrap;
    }

    .kanban-header-button svg {
        width: calc(var(--pico-spacing) * 0.55);
        height: calc(var(--pico-spacing) * 0.55);
        flex-shrink: 0;
    }

    @media (max-width: 900px) {
        .kanban-header {
            flex-wrap: wrap;
        }
    }
</style>

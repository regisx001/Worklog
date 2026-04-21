<script lang="ts">
    import type { BoardSidebarItem } from "./kanban.types.js";

    interface Props {
        board: BoardSidebarItem;
        isActive: boolean;
        showContextWindow: boolean;
        onOpenBoard: (boardId: string) => void;
        onRequestContextWindow: (boardId: string) => void;
        onEditBoard: (boardId: string) => void;
        onDeleteBoard: (boardId: string) => void;
    }

    let {
        board,
        isActive,
        showContextWindow,
        onOpenBoard,
        onRequestContextWindow,
        onEditBoard,
        onDeleteBoard,
    }: Props = $props();

    function handleCardClick() {
        onOpenBoard(board.id);
    }

    function handleCardContextMenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        onRequestContextWindow(board.id);
    }

    function handleCardKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenBoard(board.id);
            return;
        }

        if (event.key === "ContextMenu") {
            event.preventDefault();
            onRequestContextWindow(board.id);
            return;
        }

        if (event.shiftKey && event.key === "F10") {
            event.preventDefault();
            onRequestContextWindow(board.id);
        }
    }
</script>

<li class="kanban-board-row" data-active={isActive}>
    <div
        class="kanban-board-card"
        data-active={isActive}
        role="button"
        tabindex="0"
        onclick={handleCardClick}
        oncontextmenu={handleCardContextMenu}
        onkeydown={handleCardKeydown}
        aria-current={isActive ? "true" : undefined}
    >
        <header class="kanban-board-card-header">
            <h3 class="kanban-board-name">{board.name}</h3>
        </header>

        <section class="kanban-board-card-body">
            <p class="kanban-board-description">{board.description}</p>
        </section>
    </div>

    {#if showContextWindow}
        <div class="kanban-board-context-window">
            <button
                type="button"
                class="kanban-context-action"
                onclick={() => onOpenBoard(board.id)}
            >
                Open
            </button>
            <button
                type="button"
                class="kanban-context-action"
                onclick={() => onEditBoard(board.id)}
            >
                Edit details
            </button>
            <button
                type="button"
                class="kanban-context-action kanban-context-delete"
                onclick={() => onDeleteBoard(board.id)}
            >
                Delete
            </button>
        </div>
    {/if}
</li>

<style>
    .kanban-board-row {
        position: relative;
        width: 100%;
    }

    .kanban-board-card {
        width: 100%;
        min-height: 64px;
        margin: 0;
        border: var(--pico-border-width) solid transparent;
        border-radius: var(--pico-border-radius);
        background: transparent;
        color: var(--pico-muted-color);
        text-decoration: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: calc(var(--pico-spacing) * 0.25);
        padding: calc(var(--pico-spacing) * 0.45)
            calc(var(--pico-spacing) * 0.6);
        text-align: left;
        cursor: pointer;
        transition:
            background-color 150ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 150ms cubic-bezier(0.16, 1, 0.3, 1),
            color 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-board-card:hover {
        color: var(--pico-color);
        border-color: var(--pico-muted-border-color);
        background: var(--pico-card-sectioning-background-color);
    }

    .kanban-board-card:focus-visible {
        outline: var(--pico-border-width) solid var(--pico-primary);
        outline-offset: 0;
    }

    .kanban-board-card[data-active="true"] {
        color: var(--pico-primary);
        border-color: color-mix(in oklch, var(--pico-primary) 45%, transparent);
        background: color-mix(in oklch, var(--pico-primary) 10%, transparent);
    }

    .kanban-board-card-header,
    .kanban-board-card-body {
        margin: 0;
        min-width: 0;
    }

    .kanban-board-name {
        margin: 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: calc(var(--pico-font-size-small) * 0.95);
        font-weight: bold;
        line-height: 1.2;
        color: currentColor;
    }

    .kanban-board-description {
        margin: 0;
        font-size: calc(var(--pico-font-size-small) * 0.1);
        /* font-weight: ; */
        line-height: 1.25;
        color: color-mix(in oklch, var(--pico-muted-color) 88%, transparent);
        letter-spacing: 0.01em;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .kanban-board-description:empty {
        display: none;
    }

    .kanban-board-card:hover .kanban-board-description,
    .kanban-board-card[data-active="true"] .kanban-board-description {
        color: color-mix(in oklch, currentColor 70%, var(--pico-muted-color));
    }

    .kanban-board-context-window {
        position: absolute;
        right: 0;
        top: calc(100% + calc(var(--pico-spacing) * 0.2));
        z-index: 8;
        min-width: calc(var(--pico-spacing) * 8);
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
        border-radius: var(--pico-border-radius);
        background: var(--pico-card-background-color);
        padding: calc(var(--pico-spacing) * 0.25);
        display: grid;
        gap: calc(var(--pico-spacing) * 0.2);
        box-shadow: var(--pico-card-box-shadow);
    }

    .kanban-context-action {
        width: 100%;
        margin: 0;
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
        border-radius: var(--pico-border-radius);
        background: var(--pico-card-sectioning-background-color);
        color: var(--pico-color);
        text-align: left;
        font-size: var(--pico-font-size-small);
        padding: calc(var(--pico-spacing) * 0.35)
            calc(var(--pico-spacing) * 0.5);
    }

    .kanban-context-action:hover {
        border-color: var(--pico-border-color);
    }

    .kanban-context-delete {
        color: var(--pico-del-color);
    }
</style>

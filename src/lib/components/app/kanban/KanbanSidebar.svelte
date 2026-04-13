<script lang="ts">
    import type { BoardSidebarItem } from "./kanban.types.js";

    type BoardContextWindow = {
        boardId: string;
        renaming: boolean;
        draftName: string;
    };

    interface Props {
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onOpenBoard: (boardId: string) => void;
        onRenameBoard: (boardId: string, nextName: string) => void;
        onDeleteBoard: (boardId: string) => void;
    }

    let {
        boards,
        activeBoardId,
        onOpenBoard,
        onRenameBoard,
        onDeleteBoard,
    }: Props = $props();

    let contextWindow = $state<BoardContextWindow | null>(null);
    let sidebarElement: HTMLElement | null = null;

    function closeContextWindow() {
        contextWindow = null;
    }

    function openContextWindow(boardId: string) {
        const board = boards.find((item) => item.id === boardId);
        if (!board) {
            return;
        }

        contextWindow = {
            boardId,
            renaming: false,
            draftName: board.name,
        };
    }

    function openContextWindowFromEvent(event: MouseEvent, boardId: string) {
        event.preventDefault();
        event.stopPropagation();
        openContextWindow(boardId);
    }

    function openRenameForm(boardId: string) {
        const board = boards.find((item) => item.id === boardId);
        if (!board) {
            return;
        }

        contextWindow = {
            boardId,
            renaming: true,
            draftName: board.name,
        };
    }

    function updateDraftName(event: Event) {
        if (!contextWindow || !contextWindow.renaming) {
            return;
        }

        const target = event.currentTarget as HTMLInputElement;
        contextWindow.draftName = target.value;
    }

    function saveRename() {
        if (!contextWindow || !contextWindow.renaming) {
            return;
        }

        const nextName = contextWindow.draftName.trim();
        if (!nextName) {
            return;
        }

        onRenameBoard(contextWindow.boardId, nextName);
        closeContextWindow();
    }

    function handleOpen(boardId: string) {
        onOpenBoard(boardId);
        closeContextWindow();
    }

    function handleDelete(boardId: string) {
        onDeleteBoard(boardId);
        closeContextWindow();
    }

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closeContextWindow();
        }
    }

    function handleWindowPointerdown(event: MouseEvent) {
        if (!contextWindow || !sidebarElement) {
            return;
        }

        if (sidebarElement.contains(event.target as Node)) {
            return;
        }

        closeContextWindow();
    }
</script>

<svelte:window
    onkeydown={handleWindowKeydown}
    onmousedown={handleWindowPointerdown}
/>

<aside
    class="kanban-sidebar"
    aria-label="Boards sidebar"
    bind:this={sidebarElement}
>
    <header class="kanban-sidebar-header">
        <h2>Boards</h2>
        <small>{boards.length.toString().padStart(2, "0")}</small>
    </header>

    <nav aria-label="Boards list">
        <ul class="kanban-board-list">
            {#each boards as board (board.id)}
                <li
                    class="kanban-board-row"
                    data-active={board.id === activeBoardId}
                    oncontextmenu={(event) =>
                        openContextWindowFromEvent(event, board.id)}
                >
                    <button
                        type="button"
                        class="kanban-board-item"
                        data-active={board.id === activeBoardId}
                        onclick={() => onOpenBoard(board.id)}
                        aria-current={board.id === activeBoardId
                            ? "true"
                            : undefined}
                    >
                        <span class="kanban-board-name">{board.name}</span>
                        <small class="kanban-board-count"
                            >{board.issueCount
                                .toString()
                                .padStart(2, "0")}</small
                        >
                    </button>

                    <button
                        type="button"
                        class="kanban-board-actions-trigger"
                        aria-label={`Open actions for ${board.name}`}
                        title="Board actions"
                        aria-expanded={contextWindow?.boardId === board.id}
                        onclick={() => openContextWindow(board.id)}
                    >
                        ⋯
                    </button>

                    {#if contextWindow?.boardId === board.id}
                        <div class="kanban-board-context-window">
                            {#if contextWindow.renaming}
                                <label class="kanban-board-rename-field">
                                    <span>Rename board</span>
                                    <input
                                        type="text"
                                        value={contextWindow.draftName}
                                        oninput={updateDraftName}
                                        maxlength="40"
                                        placeholder="Board name"
                                    />
                                </label>
                                <div class="kanban-board-rename-actions">
                                    <button
                                        type="button"
                                        class="context-action-save"
                                        onclick={saveRename}
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        class="context-action-cancel"
                                        onclick={closeContextWindow}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            {:else}
                                <button
                                    type="button"
                                    class="context-action"
                                    onclick={() => handleOpen(board.id)}
                                >
                                    Open
                                </button>
                                <button
                                    type="button"
                                    class="context-action"
                                    onclick={() => openRenameForm(board.id)}
                                >
                                    Rename
                                </button>
                                <button
                                    type="button"
                                    class="context-action context-action-delete"
                                    onclick={() => handleDelete(board.id)}
                                >
                                    Delete
                                </button>
                            {/if}
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    </nav>
</aside>

<style>
    .kanban-sidebar {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.52rem;
        border: 1px solid var(--color-border-soft);
        border-radius: 0.6rem;
        padding: 0.66rem;
        height: 100%;
        min-height: 0;
        overflow: auto;
    }

    .kanban-sidebar-header {
        margin: 0;
        padding: 0.06rem 0.12rem 0.5rem;
        border-bottom: 1px solid rgba(151, 174, 206, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.4rem;
    }

    .kanban-sidebar-header h2 {
        margin: 0;
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(233, 242, 252, 0.94);
    }

    .kanban-sidebar-header small {
        margin: 0;
        min-width: 1.7rem;
        height: 1.2rem;
        border-radius: 999px;
        border: 1px solid rgba(136, 159, 190, 0.28);
        background: rgba(34, 50, 71, 0.52);
        color: var(--color-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.62rem;
        letter-spacing: 0.04em;
    }

    .kanban-board-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.34rem;
    }

    .kanban-board-row {
        position: relative;
        display: block;
    }

    .kanban-board-item {
        width: 100%;
        margin: 0;
        border-radius: 0.5rem;
        border: 1px solid rgba(136, 159, 190, 0.23);
        color: rgba(227, 238, 251, 0.9);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        font-size: 0.72rem;
        text-align: left;
        transition:
            border-color 130ms ease,
            background 130ms ease,
            box-shadow 130ms ease;
    }

    .kanban-board-item:hover {
        border-color: rgba(167, 194, 230, 0.44);
    }

    .kanban-board-item:focus-visible {
        outline: 1px solid rgba(173, 204, 242, 0.66);
        outline-offset: 0;
    }

    .kanban-board-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 0.56rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.015em;
    }

    .kanban-board-count {
        min-width: 1.65rem;
        margin-right: 12px;
        height: 1.15rem;
        color: var(--color-text-muted);
        font-size: 0.64rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.04em;
    }

    .kanban-board-item[data-active="true"] .kanban-board-count {
        border-color: rgba(173, 205, 241, 0.52);
        background: rgba(98, 131, 171, 0.32);
        color: rgba(231, 241, 253, 0.95);
    }

    .kanban-board-actions-trigger {
        position: absolute;
        right: 0.34rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.52rem;
        min-width: 1.52rem;
        height: 1.52rem;
        margin-right: 6px;
        border-radius: 0.42rem;
        border: 1px solid transparent;
        background: rgba(8, 13, 20, 0);
        color: rgba(200, 216, 238, 0.68);
        display: grid;
        place-items: center;
        padding: 0;
        line-height: 1;
        font-size: 0.95rem;
        transition:
            border-color 120ms ease,
            background 120ms ease,
            color 120ms ease;
    }

    /* .kanban-board-row:hover .kanban-board-actions-trigger,
    .kanban-board-item[data-active="true"] + .kanban-board-actions-trigger,
    .kanban-board-actions-trigger[aria-expanded="true"] {
        border-color: rgba(150, 178, 211, 0.3);
        background: rgba(21, 32, 48, 0.72);
        color: rgba(230, 241, 252, 0.95);
    } */

    .kanban-board-actions-trigger:hover,
    .kanban-board-actions-trigger[aria-expanded="true"] {
        border-color: rgba(168, 197, 235, 0.48);
        background: rgba(34, 52, 79, 0.84);
        color: rgba(231, 240, 252, 0.95);
    }

    .kanban-board-context-window {
        position: absolute;
        right: 0.02rem;
        top: calc(100% + 0.24rem);
        z-index: 8;
        min-width: 11.4rem;
        border: 1px solid rgba(151, 174, 206, 0.3);
        border-radius: 0.55rem;
        background: rgba(8, 13, 20, 0.96);
        backdrop-filter: blur(12px);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
        padding: 0.38rem;
        display: grid;
        gap: 0.24rem;
        animation: context-window-in 120ms ease;
    }

    @keyframes context-window-in {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .context-action {
        width: 100%;
        margin: 0;
        border: 1px solid transparent;
        border-radius: 0.4rem;
        background: transparent;
        color: rgba(231, 240, 252, 0.95);
        text-align: left;
        padding: 0.35rem 0.42rem;
        font-size: 0.72rem;
    }

    .context-action:hover {
        background: rgba(68, 95, 137, 0.24);
    }

    .context-action-delete {
        color: rgba(255, 169, 176, 0.95);
    }

    .context-action-delete:hover {
        background: rgba(180, 49, 62, 0.24);
    }

    .kanban-board-rename-field {
        display: grid;
        gap: 0.26rem;
        font-size: 0.66rem;
        color: var(--color-text-muted);
    }

    .kanban-board-rename-field input {
        margin: 0;
        height: 1.8rem;
        font-size: 0.72rem;
    }

    .kanban-board-rename-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.24rem;
    }

    .kanban-board-rename-actions button {
        margin: 0;
        height: 1.74rem;
        padding: 0 0.42rem;
        font-size: 0.68rem;
    }

    .context-action-save {
        background: rgba(45, 94, 135, 0.52);
        border: 1px solid rgba(152, 188, 222, 0.36);
    }

    .context-action-cancel {
        background: rgba(22, 31, 45, 0.86);
        border: 1px solid rgba(136, 159, 190, 0.26);
    }

    @media (max-width: 920px) {
        .kanban-sidebar {
            height: auto;
            min-height: 0;
            overflow: visible;
        }

        .kanban-board-context-window {
            min-width: 10.2rem;
        }

        .kanban-board-item {
            padding-right: 2.1rem;
        }

        .kanban-board-actions-trigger {
            width: 1.44rem;
            min-width: 1.44rem;
            height: 1.44rem;
        }
    }
</style>

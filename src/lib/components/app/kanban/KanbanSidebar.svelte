<script lang="ts">
    import AppModal from "../layout/modal/AppModal.svelte";
    import type { BoardSidebarItem } from "./kanban.types.js";

    type BoardContextWindow = {
        boardId: string;
    };

    type BoardDetailsEditor = {
        boardId: string;
        draftName: string;
        draftDescription: string;
    };

    interface Props {
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onOpenBoard: (boardId: string) => void;
        onUpdateBoard: (
            boardId: string,
            updates: { name: string; description: string },
        ) => void;
        onDeleteBoard: (boardId: string) => void;
    }

    let {
        boards,
        activeBoardId,
        onOpenBoard,
        onUpdateBoard,
        onDeleteBoard,
    }: Props = $props();

    let contextWindow = $state<BoardContextWindow | null>(null);
    let detailsEditor = $state<BoardDetailsEditor | null>(null);
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
        };
    }

    function openContextWindowFromEvent(event: MouseEvent, boardId: string) {
        event.preventDefault();
        event.stopPropagation();
        openContextWindow(boardId);
    }

    function openBoardDetailsEditor(boardId: string) {
        const board = boards.find((item) => item.id === boardId);
        if (!board) {
            return;
        }

        detailsEditor = {
            boardId,
            draftName: board.name,
            draftDescription: board.description,
        };

        closeContextWindow();
    }

    function updateDraftName(event: Event) {
        if (!detailsEditor) {
            return;
        }

        const target = event.currentTarget as HTMLInputElement;
        detailsEditor.draftName = target.value;
    }

    function updateDraftDescription(event: Event) {
        if (!detailsEditor) {
            return;
        }

        const target = event.currentTarget as HTMLTextAreaElement;
        detailsEditor.draftDescription = target.value;
    }

    function closeBoardDetailsEditor() {
        detailsEditor = null;
    }

    function saveBoardUpdate() {
        if (!detailsEditor) {
            return;
        }

        const nextName = detailsEditor.draftName.trim();
        if (!nextName) {
            return;
        }

        onUpdateBoard(detailsEditor.boardId, {
            name: nextName,
            description: detailsEditor.draftDescription.trim(),
        });
        closeBoardDetailsEditor();
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

    function handleBoardKeydown(event: KeyboardEvent, boardId: string) {
        if (event.key === "ContextMenu") {
            event.preventDefault();
            openContextWindow(boardId);
            return;
        }

        if (event.shiftKey && event.key === "F10") {
            event.preventDefault();
            openContextWindow(boardId);
        }
    }

    function handleSettingsClick() {
        console.info("Settings action is not configured yet.");
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
        <div>
            <h2>Boards</h2>
            <p>Right-click a board for actions</p>
        </div>
        <small class="kanban-board-total"
            >{boards.length.toString().padStart(2, "0")}</small
        >
    </header>

    <nav class="kanban-sidebar-body" aria-label="Boards list">
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
                        onclick={() => {
                            onOpenBoard(board.id);
                            closeContextWindow();
                        }}
                        onkeydown={(event) =>
                            handleBoardKeydown(event, board.id)}
                        aria-current={board.id === activeBoardId
                            ? "true"
                            : undefined}
                    >
                        <span class="kanban-board-main">
                            <span class="kanban-board-name">{board.name}</span>
                            <small class="kanban-board-description"
                                >{board.description || "No description"}</small
                            >
                        </span>
                        <small class="kanban-board-count"
                            >{board.issueCount
                                .toString()
                                .padStart(2, "0")}</small
                        >
                    </button>

                    {#if contextWindow?.boardId === board.id}
                        <div class="kanban-board-context-window">
                            <button
                                type="button"
                                class="kanban-context-action"
                                onclick={() => handleOpen(board.id)}
                            >
                                Open
                            </button>
                            <button
                                type="button"
                                class="kanban-context-action"
                                onclick={() => openBoardDetailsEditor(board.id)}
                            >
                                Edit details
                            </button>
                            <button
                                type="button"
                                class="kanban-context-action kanban-context-delete"
                                onclick={() => handleDelete(board.id)}
                            >
                                Delete
                            </button>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    </nav>

    <footer class="kanban-sidebar-footer">
        <button
            type="button"
            class="kanban-settings-button"
            onclick={handleSettingsClick}
        >
            Settings
        </button>
    </footer>

    <AppModal
        open={Boolean(detailsEditor)}
        title="Edit board details"
        onClose={closeBoardDetailsEditor}
    >
        {#snippet children()}
            <label class="kanban-board-edit-field">
                <span>Name</span>
                <input
                    type="text"
                    value={detailsEditor?.draftName ?? ""}
                    oninput={updateDraftName}
                    maxlength="40"
                    placeholder="Board name"
                />
            </label>

            <label class="kanban-board-edit-field">
                <span>Description</span>
                <textarea
                    rows="4"
                    value={detailsEditor?.draftDescription ?? ""}
                    oninput={updateDraftDescription}
                    maxlength="180"
                    placeholder="Short board description"
                ></textarea>
            </label>
        {/snippet}

        {#snippet footer()}
            <button
                type="button"
                class="secondary"
                onclick={closeBoardDetailsEditor}
            >
                Cancel
            </button>
            <button type="button" onclick={saveBoardUpdate}>Save</button>
        {/snippet}
    </AppModal>
</aside>

<style>
    .kanban-sidebar {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        gap: 0.45rem;
        border: 1px solid var(--color-border-soft);
        border-radius: 0.5rem;
        padding: 0.55rem;
        height: 100%;
        min-height: 0;
        background: rgba(15, 20, 29, 0.9);
        overflow: hidden;
    }

    .kanban-sidebar-header {
        margin: 0;
        padding: 0.02rem 0.1rem 0.45rem;
        border-bottom: 1px solid rgba(151, 174, 206, 0.22);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.3rem;
    }

    .kanban-sidebar-header h2 {
        margin: 0;
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(232, 240, 251, 0.94);
    }

    .kanban-sidebar-header p {
        margin: 0.2rem 0 0;
        font-size: 0.65rem;
        color: var(--color-text-muted);
    }

    .kanban-board-total {
        min-width: 1.7rem;
        height: 1.2rem;
        border-radius: 999px;
        border: 1px solid rgba(136, 159, 190, 0.32);
        background: rgba(35, 46, 62, 0.86);
        color: var(--color-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.62rem;
        letter-spacing: 0.03em;
    }

    .kanban-sidebar-body {
        min-height: 0;
        overflow: auto;
        padding-right: 0.02rem;
    }

    .kanban-board-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.35rem;
    }

    .kanban-board-row {
        position: relative;
        display: block;
    }

    .kanban-board-item {
        width: 100%;
        margin: 0;
        border-radius: 0.45rem;
        border: 1px solid rgba(136, 159, 190, 0.28);
        background: rgba(22, 28, 39, 0.92);
        color: rgba(227, 238, 251, 0.9);
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: 0.5rem;
        padding: 0.5rem;
        font-size: 0.71rem;
        text-align: left;
    }

    .kanban-board-item:hover {
        border-color: rgba(161, 185, 219, 0.45);
    }

    .kanban-board-item:focus-visible {
        outline: 1px solid rgba(173, 204, 242, 0.54);
        outline-offset: 0;
    }

    .kanban-board-item[data-active="true"] {
        border-color: rgba(139, 176, 221, 0.62);
        background: rgba(47, 67, 95, 0.86);
    }

    .kanban-board-main {
        min-width: 0;
        display: grid;
        gap: 0.18rem;
    }

    .kanban-board-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.73rem;
        font-weight: 600;
        letter-spacing: 0.01em;
    }

    .kanban-board-description {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.66rem;
        line-height: 1.35;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .kanban-board-count {
        min-width: 1.65rem;
        height: 1.12rem;
        border: 1px solid rgba(136, 159, 190, 0.3);
        border-radius: 999px;
        background: rgba(37, 49, 67, 0.88);
        color: var(--color-text-muted);
        font-size: 0.62rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.03em;
    }

    .kanban-board-item[data-active="true"] .kanban-board-count {
        border-color: rgba(168, 197, 235, 0.42);
        background: rgba(61, 88, 123, 0.88);
        color: rgba(230, 241, 253, 0.95);
    }

    .kanban-board-context-window {
        position: absolute;
        right: 0;
        top: calc(100% + 0.2rem);
        z-index: 8;
        min-width: 12rem;
        border: 1px solid rgba(136, 159, 190, 0.35);
        border-radius: 0.45rem;
        background: rgba(20, 27, 38, 0.96);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.36);
        padding: 0.36rem;
        display: grid;
        gap: 0.28rem;
    }

    .kanban-context-action {
        width: 100%;
        margin: 0;
        border: 1px solid rgba(136, 159, 190, 0.28);
        border-radius: 0.4rem;
        background: rgba(30, 41, 57, 0.92);
        color: rgba(231, 240, 252, 0.95);
        text-align: left;
        padding: 0.34rem 0.42rem;
        font-size: 0.69rem;
    }

    .kanban-context-action:hover {
        border-color: rgba(168, 197, 235, 0.42);
        background: rgba(44, 61, 85, 0.94);
    }

    .kanban-context-delete {
        color: rgba(255, 169, 176, 0.95);
    }

    .kanban-context-delete:hover {
        border-color: rgba(227, 137, 146, 0.45);
        background: rgba(92, 39, 47, 0.88);
    }

    .kanban-board-edit-field {
        display: grid;
        gap: 0.22rem;
        font-size: 0.66rem;
        color: var(--color-text-muted);
    }

    .kanban-board-edit-field input,
    .kanban-board-edit-field textarea {
        margin: 0;
        border-radius: 0.36rem;
        border: 1px solid rgba(136, 159, 190, 0.35);
        background: rgba(13, 18, 26, 0.92);
        color: rgba(229, 239, 251, 0.95);
        font-size: 0.72rem;
        padding: 0.4rem;
        resize: vertical;
        min-height: 1.8rem;
    }

    .kanban-sidebar-footer {
        border-top: 1px solid rgba(151, 174, 206, 0.22);
        padding-top: 0.45rem;
    }

    .kanban-settings-button {
        width: 100%;
        margin: 0;
        border-radius: 0.4rem;
        border: 1px solid rgba(136, 159, 190, 0.32);
        background: rgba(25, 35, 48, 0.92);
        color: rgba(228, 238, 251, 0.94);
        font-size: 0.7rem;
        text-align: center;
        padding: 0.38rem 0.5rem;
    }

    @media (max-width: 920px) {
        .kanban-sidebar {
            height: auto;
            min-height: 0;
            overflow: visible;
        }

        .kanban-board-context-window {
            min-width: 10.4rem;
        }
    }
</style>

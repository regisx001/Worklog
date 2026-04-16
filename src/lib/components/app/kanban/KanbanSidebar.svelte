<script lang="ts">
    import { FolderKanbanIcon } from "@lucide/svelte";
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
        workspaceName: string;
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
        workspaceName,
        boards,
        activeBoardId,
        onOpenBoard,
        onUpdateBoard,
        onDeleteBoard,
    }: Props = $props();

    let contextWindow = $state<BoardContextWindow | null>(null);
    let detailsEditor = $state<BoardDetailsEditor | null>(null);
    let sidebarElement: HTMLElement | null = null;

    const workspaceMonogram = $derived.by(() => {
        const letters = workspaceName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("");

        return letters.padEnd(2, "W").slice(0, 2);
    });

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

<nav
    class="kanban-sidebar"
    aria-label="Boards sidebar"
    bind:this={sidebarElement}
>
    <header class="kanban-workspace-header">
        <!-- <span class="kanban-workspace-avatar" aria-hidden="true"
            >{workspaceMonogram}</span
        >
        <strong class="kanban-workspace-name" title={workspaceName}
            >{workspaceName}</strong
        > -->
        <small class="kanban-section-label"
            ><FolderKanbanIcon />

            <span> Boards </span>
        </small>
    </header>

    <div class="kanban-sidebar-body" aria-label="Boards list">
        <ul class="kanban-board-list" role="list">
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
                        <svg
                            class="kanban-board-icon"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path
                                d="M4 6h16v5H4zm0 7h7v5H4zm9 0h7v5h-7z"
                                fill="currentColor"
                            ></path>
                        </svg>

                        <span class="kanban-board-name">{board.name}</span>

                        <kbd class="kanban-board-count">{board.issueCount}</kbd>
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
    </div>

    <footer class="kanban-sidebar-footer">
        <button
            type="button"
            class="kanban-settings-button"
            onclick={handleSettingsClick}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                    d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm8 3.5-1.8.8.2 2-1.8 1-1.4-1.3-1.9.6-.6 1.8h-2l-.6-1.8-1.9-.6-1.4 1.3-1.8-1 .2-2L4 12l.8-1.8-.2-2 1.8-1 1.4 1.3 1.9-.6.6-1.8h2l.6 1.8 1.9.6 1.4-1.3 1.8 1-.2 2L20 12Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.4"
                ></path>
            </svg>
            <span>Settings</span>
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
</nav>

<style>
    .kanban-sidebar {
        width: calc(var(--pico-spacing) * 13);
        flex-shrink: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: var(--pico-card-background-color);
        border-right: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        overflow: hidden;
    }

    .kanban-workspace-header {
        display: flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: var(--pico-spacing) calc(var(--pico-spacing) * 0.75);
        border-bottom: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        flex-shrink: 0;
    }

    .kanban-workspace-avatar {
        width: calc(var(--pico-spacing) * 1.5);
        aspect-ratio: 1;
        border-radius: var(--pico-border-radius);
        background: var(--pico-primary);
        color: var(--pico-background-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: var(--pico-font-size-small);
        font-family: var(--pico-font-family-monospace);
        font-weight: var(--pico-font-weight-bold);
        line-height: 1;
    }

    .kanban-workspace-name {
        margin: 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--pico-font-size-small);
        font-weight: var(--pico-font-weight-bold);
    }

    .kanban-section-label {
        display: flex;
        gap: 12px;
        margin: 0;
        padding: calc(var(--pico-spacing) * 0.75)
            calc(var(--pico-spacing) * 0.75) calc(var(--pico-spacing) * 0.25);
        /* color: var(--pico-muted-color); */
        font-size: calc(var(--pico-font-size-small) * 0.85);
        text-transform: uppercase;
        letter-spacing: 0.07em;
    }

    .kanban-sidebar-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 0 calc(var(--pico-spacing) * 0.35)
            calc(var(--pico-spacing) * 0.5);
    }

    .kanban-board-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: calc(var(--pico-spacing) * 0.2);
    }

    .kanban-board-row {
        position: relative;
    }

    .kanban-board-item {
        position: relative;
        width: 100%;
        margin: 0;
        border: 0;
        border-radius: var(--pico-border-radius);
        background: transparent;
        color: var(--pico-muted-color);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: calc(var(--pico-spacing) * 0.4)
            calc(var(--pico-spacing) * 0.75);
        font-size: var(--pico-font-size-small);
        text-align: left;
        transition:
            background-color 150ms cubic-bezier(0.16, 1, 0.3, 1),
            color 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-board-item::before {
        content: "";
        position: absolute;
        left: 0;
        top: calc(var(--pico-spacing) * 0.2);
        bottom: calc(var(--pico-spacing) * 0.2);
        width: calc(var(--pico-spacing) * 0.15);
        border-radius: var(--pico-border-radius);
        background: var(--pico-primary);
        opacity: 0;
        transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-board-item:hover {
        color: var(--pico-color);
        background: var(--pico-card-sectioning-background-color);
    }

    .kanban-board-item:focus-visible {
        outline: var(--pico-border-width) solid var(--pico-primary);
        outline-offset: 0;
    }

    .kanban-board-item[data-active="true"] {
        color: var(--pico-primary);
        background: color-mix(in oklch, var(--pico-primary) 10%, transparent);
    }

    .kanban-board-item[data-active="true"]::before {
        opacity: 1;
    }

    .kanban-board-icon {
        width: calc(var(--pico-spacing) * 0.7);
        height: calc(var(--pico-spacing) * 0.7);
        flex-shrink: 0;
        color: inherit;
    }

    .kanban-board-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .kanban-board-count {
        margin: 0;
        margin-left: auto;
        font-size: calc(var(--pico-font-size-small) * 0.85);
        font-family: var(--pico-font-family-monospace);
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

    .kanban-board-edit-field {
        display: grid;
        gap: calc(var(--pico-spacing) * 0.2);
        font-size: var(--pico-font-size-small);
        color: var(--pico-muted-color);
    }

    .kanban-board-edit-field input,
    .kanban-board-edit-field textarea {
        margin: 0;
    }

    .kanban-sidebar-footer {
        margin-top: auto;
        padding: calc(var(--pico-spacing) * 0.5)
            calc(var(--pico-spacing) * 0.35) calc(var(--pico-spacing) * 0.6);
    }

    .kanban-settings-button {
        width: 100%;
        margin: 0;
        border: 0;
        border-radius: var(--pico-border-radius);
        background: transparent;
        color: var(--pico-muted-color);
        display: inline-flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: calc(var(--pico-spacing) * 0.4)
            calc(var(--pico-spacing) * 0.75);
        font-size: var(--pico-font-size-small);
        text-align: left;
        transition:
            background-color 150ms cubic-bezier(0.16, 1, 0.3, 1),
            color 150ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kanban-settings-button:hover {
        color: var(--pico-color);
        background: var(--pico-card-sectioning-background-color);
    }

    .kanban-settings-button svg {
        width: calc(var(--pico-spacing) * 0.7);
        height: calc(var(--pico-spacing) * 0.7);
        flex-shrink: 0;
    }
</style>

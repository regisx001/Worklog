<script lang="ts">
    import BoardSelectorCard from "./BoardSelectorCard.svelte";
    import { FolderKanbanIcon, PlusIcon } from "@lucide/svelte";
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

    type NewBoardEditor = {
        draftName: string;
        draftDescription: string;
    };

    interface Props {
        workspaceName: string;
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onOpenBoard: (boardId: string) => void;
        onCreateBoard: (input: {
            name: string;
            description: string;
        }) => Promise<void> | void;
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
        onCreateBoard,
        onUpdateBoard,
        onDeleteBoard,
    }: Props = $props();

    let contextWindow = $state<BoardContextWindow | null>(null);
    let detailsEditor = $state<BoardDetailsEditor | null>(null);
    let newBoardEditor = $state<NewBoardEditor | null>(null);
    let creatingBoard = $state(false);
    let newBoardError = $state<string | null>(null);
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

    function openNewBoardEditor() {
        newBoardEditor = {
            draftName: "",
            draftDescription: "",
        };
        newBoardError = null;
    }

    function updateNewBoardName(event: Event) {
        if (!newBoardEditor) {
            return;
        }

        const target = event.currentTarget as HTMLInputElement;
        newBoardEditor.draftName = target.value;
        newBoardError = null;
    }

    function updateNewBoardDescription(event: Event) {
        if (!newBoardEditor) {
            return;
        }

        const target = event.currentTarget as HTMLTextAreaElement;
        newBoardEditor.draftDescription = target.value;
    }

    function closeNewBoardEditor() {
        newBoardEditor = null;
        newBoardError = null;
        creatingBoard = false;
    }

    async function saveNewBoard() {
        if (!newBoardEditor || creatingBoard) {
            return;
        }

        const nextName = newBoardEditor.draftName.trim();
        if (!nextName) {
            return;
        }

        creatingBoard = true;
        newBoardError = null;

        try {
            await onCreateBoard({
                name: nextName,
                description: newBoardEditor.draftDescription.trim(),
            });
            closeNewBoardEditor();
        } catch (error) {
            newBoardError = String(error);
            creatingBoard = false;
        }
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
        <small class="kanban-section-label"
            ><FolderKanbanIcon />

            <span> Boards </span>
        </small>

        <button
            type="button"
            class="kanban-create-board-button"
            onclick={openNewBoardEditor}
        >
            <PlusIcon size={14} />
            <span>New</span>
        </button>
    </header>

    <div class="kanban-sidebar-body" aria-label="Boards list">
        <ul class="kanban-board-list" role="list">
            {#each boards as board (board.id)}
                <BoardSelectorCard
                    {board}
                    isActive={board.id === activeBoardId}
                    showContextWindow={contextWindow?.boardId === board.id}
                    onOpenBoard={handleOpen}
                    onRequestContextWindow={openContextWindow}
                    onEditBoard={openBoardDetailsEditor}
                    onDeleteBoard={handleDelete}
                />
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
        open={Boolean(newBoardEditor)}
        title="Create board"
        onClose={closeNewBoardEditor}
    >
        {#snippet children()}
            <label class="kanban-board-edit-field">
                <span>Name</span>
                <input
                    type="text"
                    value={newBoardEditor?.draftName ?? ""}
                    oninput={updateNewBoardName}
                    maxlength="40"
                    placeholder="Board name"
                />
            </label>

            <label class="kanban-board-edit-field">
                <span>Description</span>
                <textarea
                    rows="4"
                    value={newBoardEditor?.draftDescription ?? ""}
                    oninput={updateNewBoardDescription}
                    maxlength="180"
                    placeholder="Short board description"
                ></textarea>
            </label>

            {#if newBoardError}
                <small class="kanban-modal-error">{newBoardError}</small>
            {/if}
        {/snippet}

        {#snippet footer()}
            <button
                type="button"
                class="secondary"
                onclick={closeNewBoardEditor}
            >
                Cancel
            </button>
            <button
                type="button"
                onclick={saveNewBoard}
                disabled={creatingBoard || !newBoardEditor?.draftName.trim()}
            >
                {creatingBoard ? "Creating..." : "Create board"}
            </button>
        {/snippet}
    </AppModal>

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
        width: calc(var(--pico-spacing) * 18);
        flex-shrink: 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: var(--pico-card-background-color);
        border-right: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        border-radius: 0.5rem;
        margin-right: 1rem;
        overflow: hidden;
    }

    .kanban-workspace-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: var(--pico-spacing) calc(var(--pico-spacing) * 0.75);
        border-bottom: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        flex-shrink: 0;
    }

    .kanban-section-label {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        padding: calc(var(--pico-spacing) * 0.75)
            calc(var(--pico-spacing) * 0.75) calc(var(--pico-spacing) * 0.25);
        /* color: var(--pico-muted-color); */
        font-size: calc(var(--pico-font-size-small) * 0.85);
        text-transform: uppercase;
        letter-spacing: 0.07em;
    }

    .kanban-create-board-button {
        margin: 0;
        border: var(--pico-border-width) solid var(--pico-muted-border-color);
        border-radius: var(--pico-border-radius);
        background: var(--pico-card-sectioning-background-color);
        color: var(--pico-muted-color);
        display: inline-flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.35);
        padding: calc(var(--pico-spacing) * 0.25)
            calc(var(--pico-spacing) * 0.45);
        font-size: calc(var(--pico-font-size-small) * 0.85);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .kanban-create-board-button:hover {
        color: var(--pico-color);
        border-color: var(--pico-border-color);
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
        gap: calc(var(--pico-spacing) * 0.25);
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

    .kanban-modal-error {
        color: var(--pico-del-color);
        margin-top: calc(var(--pico-spacing) * 0.25);
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

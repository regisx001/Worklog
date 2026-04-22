<script lang="ts">
    import { Settings } from "carbon-icons-svelte";

    import {
        Button,
        ComposedModal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        RadioTile,
        SideNav,
        SideNavItems,
        TextArea,
        TextInput,
        TileGroup,
    } from "carbon-components-svelte";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    interface WorkspaceSidebarProps {
        onOpenSettings?: () => void;
        onOpenBoard?: (boardId: string) => void;
    }

    const noop = () => {};

    let { onOpenSettings = noop, onOpenBoard = noop }: WorkspaceSidebarProps =
        $props();

    const { boardsApi } = getWorkspaceShellContext();

    let createModalOpen = $state(false);
    let draftName = $state("");
    let draftDescription = $state("");
    let creatingBoard = $state(false);
    let createError = $state<string | null>(null);

    const selectedBoardId = $derived(boardsApi.active?.id ?? undefined);
    const hasBoards = $derived(boardsApi.boards.length > 0);
    const canCreateBoard = $derived(
        draftName.trim().length > 0 && !creatingBoard,
    );

    function selectBoard(boardId: string) {
        const board = boardsApi.boards.find((item) => item.id === boardId);
        if (!board) {
            return;
        }

        boardsApi.setActive(board);
    }

    function handleBoardSelection(event: CustomEvent<string>) {
        const boardId = event.detail;
        selectBoard(boardId);
        onOpenBoard(boardId);
    }

    function openCreateBoardModal() {
        createModalOpen = true;
        createError = null;
    }

    function closeCreateBoardModal() {
        createModalOpen = false;
    }

    function openSettings() {
        onOpenSettings();
    }

    function handleNameInput(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        draftName = target.value;

        if (createError) {
            createError = null;
        }
    }

    function handleDescriptionInput(event: Event) {
        const target = event.currentTarget as HTMLTextAreaElement;
        draftDescription = target.value;
    }

    async function createBoard() {
        const name = draftName.trim();
        if (!name) {
            createError = "Board name is required.";
            return;
        }

        creatingBoard = true;
        createError = null;

        try {
            const createdBoard = await boardsApi.create({
                name,
                description: draftDescription.trim(),
            });

            closeCreateBoardModal();
            onOpenBoard(createdBoard.id);
        } catch (error) {
            createError = String(error);
            creatingBoard = false;
        }
    }

    $effect(() => {
        if (createModalOpen) {
            return;
        }

        draftName = "";
        draftDescription = "";
        createError = null;
        creatingBoard = false;
    });
</script>

<SideNav class="workspace-sidebar" isOpen>
    <SideNavItems>
        <header class="workspace-sidebar-header">
            <small>Boards</small>
            <Button kind="ghost" size="small" onclick={openCreateBoardModal}>
                New board
            </Button>
        </header>

        {#if boardsApi.loading}
            <p class="workspace-sidebar-state" aria-busy="true">
                Loading boards...
            </p>
        {:else if !hasBoards}
            <p class="workspace-sidebar-state">
                No boards yet. Create one to get started.
            </p>
        {:else}
            <TileGroup
                class="workspace-board-group"
                legendText="Workspace boards"
                name="workspace-board"
                selected={selectedBoardId}
                on:select={handleBoardSelection}
            >
                {#each boardsApi.boards as board (board.id)}
                    <RadioTile value={board.id}>
                        <span class="workspace-board-name">{board.name}</span>
                        {#if board.description}
                            <span class="workspace-board-description">
                                {board.description}
                            </span>
                        {/if}
                    </RadioTile>
                {/each}
            </TileGroup>
        {/if}
    </SideNavItems>

    <footer class="workspace-sidebar-footer">
        <Button kind="ghost" size="small" onclick={openSettings}>
            <Settings />
            <span>Settings</span>
        </Button>
    </footer>
</SideNav>

<ComposedModal
    bind:open={createModalOpen}
    size="sm"
    preventCloseOnClickOutside={creatingBoard}
>
    <ModalHeader title="Create board" />

    <ModalBody hasForm>
        <TextInput
            labelText="Name"
            placeholder="Board name"
            bind:value={draftName}
            on:input={handleNameInput}
            maxlength={40}
            invalid={Boolean(createError && !draftName.trim())}
            invalidText="Board name is required."
            data-modal-primary-focus
        />

        <TextArea
            labelText="Description"
            placeholder="Short board description"
            bind:value={draftDescription}
            on:input={handleDescriptionInput}
            rows={4}
            maxlength={180}
        />

        {#if createError && draftName.trim()}
            <p class="workspace-modal-error" role="alert">{createError}</p>
        {/if}
    </ModalBody>

    <ModalFooter>
        <Button
            kind="secondary"
            onclick={closeCreateBoardModal}
            disabled={creatingBoard}
        >
            Cancel
        </Button>
        <Button onclick={createBoard} disabled={!canCreateBoard}>
            {creatingBoard ? "Creating..." : "Create board"}
        </Button>
    </ModalFooter>
</ComposedModal>

<style>
    :global(.workspace-sidebar.bx--side-nav) {
        display: flex;
        flex-direction: column;
    }

    :global(.workspace-sidebar .bx--side-nav__items) {
        flex: 1 1 auto;
        overflow-y: auto;
    }

    .workspace-sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--cds-spacing-03, 0.5rem);
        padding: var(--cds-spacing-04, 0.75rem);
    }

    .workspace-sidebar-header small {
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.8;
    }

    .workspace-sidebar-header :global(.bx--btn) {
        margin: 0;
    }

    .workspace-sidebar-state {
        margin: 0;
        padding: 0 var(--cds-spacing-04, 0.75rem) var(--cds-spacing-04, 0.75rem);
        font-size: 0.875rem;
        opacity: 0.9;
    }

    :global(.workspace-board-group.bx--tile-group) {
        padding: 0 var(--cds-spacing-03, 0.5rem) var(--cds-spacing-04, 0.75rem);
    }

    :global(.workspace-board-group .bx--tile-content) {
        display: grid;
        gap: 0.25rem;
    }

    .workspace-board-name {
        font-size: 0.85rem;
        font-weight: 600;
        line-height: 1.2;
    }

    .workspace-board-description {
        font-size: 0.75rem;
        line-height: 1.3;
        opacity: 0.8;
    }

    :global(.bx--modal-content .bx--form-item:not(:last-child)) {
        margin-bottom: var(--cds-spacing-04, 0.75rem);
    }

    .workspace-modal-error {
        margin: 0;
        color: var(--color-danger, #fa4d56);
        font-size: 0.8rem;
    }

    .workspace-sidebar-footer {
        padding: var(--cds-spacing-03, 0.5rem);
        border-top: 1px solid
            color-mix(
                in srgb,
                var(--color-border-primary, #525252) 45%,
                transparent
            );
    }

    .workspace-sidebar-footer :global(.bx--btn) {
        margin: 0;
        width: 100%;
        justify-content: flex-start;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-sidebar-footer :global(.bx--btn svg) {
        flex-shrink: 0;
    }
</style>

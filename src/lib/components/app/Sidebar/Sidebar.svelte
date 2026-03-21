<script lang="ts">
    import { Trash, FolderOpen, FilePlusCorner } from "@lucide/svelte";
    import { goto } from "$app/navigation";
    import PlusIcon from "@lucide/svelte/icons/plus";
    import SearchIcon from "@lucide/svelte/icons/search";
    import SettingsIcon from "@lucide/svelte/icons/settings";
    import SignalIcon from "@lucide/svelte/icons/signal";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger,
    } from "$lib/components/ui/context-menu/index.js";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import {
        Tooltip,
        TooltipContent,
        TooltipTrigger,
    } from "$lib/components/ui/tooltip/index.js";
    import { useBoards } from "$lib/hooks/boards.svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import { toolbarState } from "$lib/hooks/toolbar.svelte.js";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    const workspace = useWorkspace();
    const boards = useBoards(() => workspace.path);
    const tickets = useTickets(
        () => workspace.path,
        () => boards.active?.id ?? null,
    );

    let createBoardDialogOpen = $state(false);
    let creatingBoard = $state(false);
    let boardName = $state("");
    let boardDescription = $state("");
    let boardFormError = $state<string | null>(null);
    let sidebarError = $state<string | null>(null);

    const activeBoardId = $derived.by(() => boards.active?.id ?? null);

    const syncLabel = $derived.by(() => {
        if (toolbarState.syncState === "syncing") return "Syncing";
        if (toolbarState.syncState === "pending_changes") return "Pending";
        return "Up to date";
    });

    const syncDotClass = $derived.by(() => {
        if (toolbarState.syncState === "syncing")
            return "bg-chart-2 animate-pulse";
        if (toolbarState.syncState === "pending_changes") return "bg-chart-4";
        return "bg-chart-1";
    });

    function setFailure(context: string, error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        sidebarError = `${context}: ${detail}`;
        console.error(context, error);
    }

    $effect(() => {
        if (workspace.status === "ready") {
            void boards.load().catch((error) => {
                setFailure("boards.load failed", error);
            });
        }
    });

    async function openBoard(boardId: string) {
        const target = boards.boards.find((board) => board.id === boardId);
        if (!target) return;

        boards.setActive(target);

        try {
            await goto(`/board/${boardId}`);
        } catch (error) {
            setFailure("Failed to navigate to board", error);
        }
    }

    async function createTicketForBoard(boardId: string) {
        const target = boards.boards.find((board) => board.id === boardId);
        if (!target) return;

        boards.setActive(target);

        try {
            await goto(`/board/${boardId}`);
            await tickets.load();
            await tickets.create({
                board_id: boardId,
                title: "New ticket",
                description:
                    "Describe the task clearly and keep it actionable.",
                labels: ["feature"],
            });
        } catch (error) {
            setFailure("Failed to create ticket", error);
        }
    }

    async function deleteBoard(boardId: string) {
        const target = boards.boards.find((board) => board.id === boardId);
        if (!target) return;

        const confirmed = window.confirm(
            `Delete board \"${target.name}\" and all its tickets?`,
        );
        if (!confirmed) return;

        try {
            await boards.remove(boardId);
            if (boards.active?.id) {
                await goto(`/board/${boards.active.id}`);
            } else {
                await goto("/");
            }
        } catch (error) {
            setFailure("Failed to delete board", error);
        }
    }

    function openCreateBoardDialog() {
        boardFormError = null;
        createBoardDialogOpen = true;
    }

    async function submitBoardCreation() {
        if (!workspace.path) {
            boardFormError = "Open a workspace first.";
            return;
        }

        const nextName = boardName.trim();
        const nextDescription = boardDescription.trim();

        if (!nextName) {
            boardFormError = "Board name is required.";
            return;
        }

        creatingBoard = true;
        boardFormError = null;

        try {
            const board = await boards.create({
                name: nextName,
                description: nextDescription,
            });
            await goto(`/board/${board.id}`);

            createBoardDialogOpen = false;
            boardName = "";
            boardDescription = "";
        } catch (error) {
            setFailure("Failed to create board", error);
            boardFormError =
                error instanceof Error
                    ? error.message
                    : "Failed to create board.";
        } finally {
            creatingBoard = false;
        }
    }

    function openSettingsPlaceholder() {
        toolbarState.onOpenPalette();
    }
</script>

<aside
    oncontextmenu={() => {
        return false;
    }}
    class="text-sidebar-foreground flex h-auto max-h-[46vh] w-full flex-col border-b border-sidebar-border/80 bg-linear-to-b from-surface-sidebar to-surface-panel md:h-full md:max-h-none md:w-60 md:border-r md:border-b-0 lg:w-72"
>
    <header
        class="space-y-2 border-b border-sidebar-border/70 px-2.5 py-2.5 sm:px-3 sm:py-3"
    >
        <div class="flex items-center justify-between">
            <div
                class="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
                <span>{workspace.meta?.name ?? "Workspace"}</span>
                <Badge variant="outline" class="h-5 px-1.5"
                    >{boards.boards.length}</Badge
                >
            </div>
            <Tooltip>
                <TooltipTrigger>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Create board"
                        onclick={openCreateBoardDialog}
                    >
                        <PlusIcon />
                    </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}
                    >Create board (Ctrl/Cmd+B)</TooltipContent
                >
            </Tooltip>
        </div>
        {#if sidebarError}
            <p class="text-[11px] text-red-300">{sidebarError}</p>
        {/if}
    </header>

    <nav class="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
        <ul class="space-y-1.5">
            {#if boards.boards.length === 0}
                <li>
                    <p
                        class="rounded-lg border border-dashed border-border/80 px-2.5 py-4 text-center text-xs text-muted-foreground"
                    >
                        No boards available
                    </p>
                </li>
            {:else}
                {#each boards.boards as board (board.id)}
                    <li>
                        <ContextMenu>
                            <ContextMenuTrigger class="block">
                                <button
                                    type="button"
                                    onclick={() => {
                                        void openBoard(board.id);
                                    }}
                                    class="hover:bg-sidebar-accent/80 hover:border-sidebar-border/70 focus-visible:ring-ring/50 flex w-full min-w-0 items-center justify-between rounded-lg border border-transparent px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 sm:py-2.5"
                                    class:bg-sidebar-accent={board.id ===
                                        activeBoardId}
                                    class:border-sidebar-border={board.id ===
                                        activeBoardId}
                                    class:shadow-xs={board.id === activeBoardId}
                                    aria-current={board.id === activeBoardId
                                        ? "page"
                                        : undefined}
                                >
                                    <div class="min-w-0">
                                        <p class="truncate font-medium">
                                            {board.name}
                                        </p>
                                        <p
                                            class="mt-0.5 truncate text-[11px] text-muted-foreground"
                                        >
                                            {board.description ||
                                                "No description"}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        class="shrink-0 font-mono text-[10px]"
                                    >
                                        {board.id.slice(-4).toUpperCase()}
                                    </Badge>
                                </button>
                            </ContextMenuTrigger>

                            <ContextMenuContent>
                                <ContextMenuItem
                                    class="text-[12px]"
                                    onclick={() => {
                                        void openBoard(board.id);
                                    }}
                                >
                                    <FolderOpen />
                                    Open board
                                </ContextMenuItem>
                                <ContextMenuItem
                                    class="text-[12px]"
                                    onclick={() => {
                                        void createTicketForBoard(board.id);
                                    }}
                                >
                                    <FilePlusCorner />
                                    Create ticket
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                    variant="destructive"
                                    class="text-[12px]"
                                    onclick={() => {
                                        void deleteBoard(board.id);
                                    }}
                                >
                                    <Trash width="12px" />
                                    Delete board
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    </li>
                {/each}
            {/if}
        </ul>
    </nav>

    <div class="space-y-2 border-t border-sidebar-border/70 p-2.5 sm:p-3">
        <div
            class="flex items-center justify-between rounded-lg border border-border/70 bg-card/70 px-2.5 py-2 text-xs"
        >
            <div class="flex items-center gap-2">
                <span class={`size-2 rounded-full ${syncDotClass}`}></span>
                <SignalIcon class="size-3.5 text-muted-foreground" />
                <span>{syncLabel}</span>
            </div>
            <Badge variant="outline" class="h-4 px-1 text-[10px]">local</Badge>
        </div>

        <div class="flex items-center gap-2">
            <Button
                variant="secondary"
                class="flex-1 justify-start text-[11px]"
                onclick={toolbarState.onOpenPalette}
            >
                <SearchIcon />
                Command Palette
            </Button>
            <Button
                variant="outline"
                size="icon-sm"
                aria-label="Settings"
                onclick={openSettingsPlaceholder}
            >
                <SettingsIcon />
            </Button>
        </div>
    </div>
</aside>

<Dialog bind:open={createBoardDialogOpen}>
    <DialogContent class="max-w-lg border border-border bg-card p-0">
        <DialogHeader class="px-4 pt-4 pb-2">
            <DialogTitle class="text-sm">Create Board</DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground">
                Add board details, then create it in the current workspace.
            </DialogDescription>
        </DialogHeader>

        <form
            class="space-y-3 px-4 pb-4"
            onsubmit={(event) => {
                event.preventDefault();
                void submitBoardCreation();
            }}
        >
            <div class="space-y-1.5">
                <label
                    class="text-xs font-medium text-muted-foreground"
                    for="sidebar-board-name"
                >
                    Board Name
                </label>
                <Input
                    id="sidebar-board-name"
                    bind:value={boardName}
                    placeholder="Backend API"
                    autocomplete="off"
                />
            </div>

            <div class="space-y-1.5">
                <label
                    class="text-xs font-medium text-muted-foreground"
                    for="sidebar-board-description"
                >
                    Description
                </label>
                <Textarea
                    id="sidebar-board-description"
                    bind:value={boardDescription}
                    class="min-h-24"
                    placeholder="What this board is for..."
                />
            </div>

            {#if boardFormError}
                <p class="text-xs text-red-300">{boardFormError}</p>
            {/if}

            <div class="flex items-center justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="outline"
                    onclick={() => {
                        createBoardDialogOpen = false;
                    }}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={creatingBoard}>
                    {creatingBoard ? "Creating..." : "Create Board"}
                </Button>
            </div>
        </form>
    </DialogContent>
</Dialog>

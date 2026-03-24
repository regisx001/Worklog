<script lang="ts">
    import { goto } from "$app/navigation";
    import { toggleMode } from "mode-watcher";
    import CommandPalette from "$lib/components/app/CommandPalette/CommandPalette.svelte";
    import KanbanBoard from "$lib/components/app/Kanban/KanbanBoard.svelte";
    import TicketDetailPanel from "$lib/components/app/TicketDetail/TicketDetailPanel.svelte";
    import SurfaceCard from "$lib/components/app/theme-v2/SurfaceCard.svelte";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/components/ui/alert-dialog/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import { useBoards } from "$lib/hooks/boards.svelte";
    import { useTicketDraft } from "$lib/hooks/ticket-draft.svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import {
        resetToolbarState,
        setToolbarState,
    } from "$lib/hooks/toolbar.svelte.js";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import type {
        CommandAction,
        Comment,
        SyncState,
        TicketPriority,
        TicketStatus,
        UpdateTicketInput,
    } from "$lib/components/app/types.js";

    interface KanbanWorkspaceViewProps {
        focusedBoardId?: string | null;
    }

    let { focusedBoardId = null }: KanbanWorkspaceViewProps = $props();

    const workspace = useWorkspace();
    const boards = useBoards(() => workspace.path);
    const tickets = useTickets(
        () => workspace.path,
        () => boards.active?.id ?? null,
    );

    let selectedTicketId = $state<string | null>(null);
    let detailOpen = $state(false);
    let commandPaletteOpen = $state(false);
    let createBoardDialogOpen = $state(false);
    let creatingBoard = $state(false);
    let boardName = $state("");
    let boardDescription = $state("");
    let boardFormError = $state<string | null>(null);
    let syncState = $state<SyncState>("up_to_date");
    let localPendingChanges = $state(0);
    let pageError = $state<string | null>(null);
    let lastLoadedBoardId = $state<string | null>(null);
    let deleteTicketDialogOpen = $state(false);
    let ticketPendingDeletionId = $state<string | null>(null);
    let priorityFilter = $state<"all" | TicketPriority>("all");
    let prioritySort = $state<"created" | "high_to_low" | "low_to_high">(
        "created",
    );

    const PRIORITY_RANK: Record<TicketPriority, number> = {
        low: 1,
        medium: 2,
        high: 3,
    };

    const activeBoard = $derived.by(() => boards.active);

    const visibleTickets = $derived.by(() =>
        tickets.tickets.filter((ticket) => {
            if (priorityFilter === "all") return true;
            return ticket.priority === priorityFilter;
        }),
    );

    function sortTicketsByPriority(
        items: typeof visibleTickets,
    ): typeof visibleTickets {
        if (prioritySort === "created") {
            return [...items].sort((a, b) =>
                a.created_at.localeCompare(b.created_at),
            );
        }

        if (prioritySort === "high_to_low") {
            return [...items].sort((a, b) => {
                const rankDelta =
                    PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
                if (rankDelta !== 0) return rankDelta;
                return a.created_at.localeCompare(b.created_at);
            });
        }

        return [...items].sort((a, b) => {
            const rankDelta =
                PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            if (rankDelta !== 0) return rankDelta;
            return a.created_at.localeCompare(b.created_at);
        });
    }

    const todoTickets = $derived.by(() =>
        sortTicketsByPriority(
            visibleTickets.filter((ticket) => ticket.status === "todo"),
        ),
    );
    const inProgressTickets = $derived.by(() =>
        sortTicketsByPriority(
            visibleTickets.filter((ticket) => ticket.status === "in_progress"),
        ),
    );
    const doneTickets = $derived.by(() =>
        sortTicketsByPriority(
            visibleTickets.filter((ticket) => ticket.status === "done"),
        ),
    );

    const selectedTicket = $derived.by(() => {
        if (!selectedTicketId) return null;
        return (
            tickets.tickets.find((ticket) => ticket.id === selectedTicketId) ??
            null
        );
    });

    const ticketPendingDeletion = $derived.by(() => {
        if (!ticketPendingDeletionId) return null;
        return (
            tickets.tickets.find(
                (ticket) => ticket.id === ticketPendingDeletionId,
            ) ?? null
        );
    });

    const pendingChanges = $derived.by(() => localPendingChanges);

    const ticketDraft = useTicketDraft({
        getTicket: () => selectedTicket,
        onUpdateTicket: (ticketId, updates) => {
            void updateTicket(ticketId, updates);
        },
        onAddComment: (ticketId, body) => {
            void addComment(ticketId, body);
        },
    });

    function setFailure(context: string, error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        pageError = `${context}: ${detail}`;
        console.error(context, error);
    }

    function markDirty() {
        localPendingChanges += 1;
        if (syncState !== "syncing") {
            syncState = "pending_changes";
        }
    }

    async function selectBoard(boardId: string) {
        const nextBoard = boards.boards.find((board) => board.id === boardId);
        if (!nextBoard) return;

        boards.setActive(nextBoard);
        selectedTicketId = null;
        detailOpen = false;

        try {
            await goto(`/board/${boardId}`);
            await tickets.load();
        } catch (error) {
            setFailure("Failed to switch board", error);
        }
    }

    function openTicket(ticketId: string) {
        selectedTicketId = ticketId;
        detailOpen = true;
    }

    async function moveTicket(ticketId: string, nextStatus: TicketStatus) {
        const ticket = tickets.tickets.find((entry) => entry.id === ticketId);
        if (!ticket || ticket.status === nextStatus) return;

        try {
            await tickets.update(ticketId, { status: nextStatus });
            markDirty();
        } catch (error) {
            setFailure("Failed to move ticket", error);
        }
    }

    async function moveTicketToStatus(ticketId: string, status: TicketStatus) {
        await moveTicket(ticketId, status);
    }

    function quickMoveTicket(ticketId: string) {
        const ticket = tickets.tickets.find((entry) => entry.id === ticketId);
        if (!ticket) return;

        const cycle: Record<TicketStatus, TicketStatus> = {
            todo: "in_progress",
            in_progress: "done",
            done: "todo",
        };

        void moveTicket(ticketId, cycle[ticket.status]);
    }

    async function createTicket() {
        if (!activeBoard) {
            pageError = "No active board selected.";
            return;
        }

        try {
            const nextTicket = await tickets.create({
                board_id: activeBoard.id,
                title: "New ticket",
                description:
                    "Describe the task clearly and keep it actionable.",
                priority: "medium",
                labels: ["feature"],
            });

            selectedTicketId = nextTicket.id;
            detailOpen = true;
            markDirty();
        } catch (error) {
            setFailure("Failed to create ticket", error);
        }
    }

    async function updateTicket(ticketId: string, updates: UpdateTicketInput) {
        try {
            await tickets.update(ticketId, updates);
            markDirty();
        } catch (error) {
            setFailure("Failed to update ticket", error);
        }
    }

    async function addComment(ticketId: string, body: string) {
        const target = tickets.tickets.find((ticket) => ticket.id === ticketId);
        if (!target || !body.trim()) return;

        const comment: Comment = {
            author: "You",
            body: body.trim(),
            timestamp: new Date().toISOString(),
        };

        try {
            await tickets.update(ticketId, {
                comments: [...target.comments, comment],
            });
            markDirty();
        } catch (error) {
            setFailure("Failed to add comment", error);
        }
    }

    async function setSelectedTicketPriority(priority: TicketPriority) {
        if (!selectedTicketId) return;
        const selected = tickets.tickets.find(
            (ticket) => ticket.id === selectedTicketId,
        );
        if (!selected || selected.priority === priority) return;

        await updateTicket(selectedTicketId, { priority });
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
            const nextBoard = await boards.create({
                name: nextName,
                description: nextDescription,
            });
            await goto(`/board/${nextBoard.id}`);
            await tickets.load();
            syncState = "pending_changes";

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

    async function deleteTicket(ticketId: string) {
        const targetTicket = tickets.tickets.find(
            (ticket) => ticket.id === ticketId,
        );
        if (!targetTicket) return;

        try {
            await tickets.remove(ticketId);
            markDirty();

            if (selectedTicketId === ticketId) {
                selectedTicketId = null;
                detailOpen = false;
            }
        } catch (error) {
            setFailure("Failed to delete ticket", error);
        }
    }

    function requestTicketDeletion(ticketId: string) {
        ticketPendingDeletionId = ticketId;
        deleteTicketDialogOpen = true;
    }

    async function confirmTicketDeletion() {
        if (!ticketPendingDeletionId) return;

        const ticketId = ticketPendingDeletionId;
        ticketPendingDeletionId = null;
        deleteTicketDialogOpen = false;

        await deleteTicket(ticketId);
    }

    function manualSync() {
        if (syncState === "syncing") return;
        syncState = "syncing";

        window.setTimeout(() => {
            localPendingChanges = 0;
            syncState = "up_to_date";
        }, 850);
    }

    function setPriorityFilterValue(value: "all" | TicketPriority) {
        priorityFilter = value;
    }

    function setPrioritySortValue(
        value: "created" | "high_to_low" | "low_to_high",
    ) {
        prioritySort = value;
    }

    async function openWorkspacePicker() {
        try {
            await workspace.pick();
            pageError = null;
            await goto("/");
        } catch (error) {
            setFailure("Failed to open workspace", error);
        }
    }

    const commandActions = $derived.by<CommandAction[]>(() => {
        const selectedPriorityActions: CommandAction[] = selectedTicket
            ? [
                  {
                      id: "priority-selected-high",
                      label: "Set selected ticket priority: High",
                      subtitle: `Apply to ${selectedTicket.title}`,
                      shortcut: "",
                      run: () => {
                          void setSelectedTicketPriority("high");
                      },
                  },
                  {
                      id: "priority-selected-medium",
                      label: "Set selected ticket priority: Medium",
                      subtitle: `Apply to ${selectedTicket.title}`,
                      shortcut: "",
                      run: () => {
                          void setSelectedTicketPriority("medium");
                      },
                  },
                  {
                      id: "priority-selected-low",
                      label: "Set selected ticket priority: Low",
                      subtitle: `Apply to ${selectedTicket.title}`,
                      shortcut: "",
                      run: () => {
                          void setSelectedTicketPriority("low");
                      },
                  },
              ]
            : [];

        return [
            {
                id: "open-workspace",
                label: "Open workspace",
                subtitle: "Pick a local workspace folder",
                shortcut: "Ctrl/Cmd+O",
                run: () => {
                    void openWorkspacePicker();
                },
            },
            {
                id: "new-board",
                label: "Create board",
                subtitle: "Open form and create a new board",
                shortcut: "Ctrl/Cmd+B",
                run: openCreateBoardDialog,
            },
            {
                id: "new-ticket",
                label: "Create ticket",
                subtitle: "Add a new todo ticket in the active board",
                shortcut: "Ctrl/Cmd+T",
                run: () => {
                    void createTicket();
                },
            },
            {
                id: "sync",
                label: "Sync now",
                subtitle: "Flush local changes to remote Git branch",
                shortcut: "Ctrl/Cmd+S",
                run: manualSync,
            },
            {
                id: "toggle-theme",
                label: "Toggle theme",
                subtitle: "Switch between dark and light mode",
                shortcut: "Ctrl/Cmd+Shift+L",
                run: toggleMode,
            },
            {
                id: "priority-filter-all",
                label: "Priority filter: All",
                subtitle: "Show tickets of all priorities",
                shortcut: "",
                run: () => {
                    setPriorityFilterValue("all");
                },
            },
            {
                id: "priority-filter-high",
                label: "Priority filter: High",
                subtitle: "Show only high priority tickets",
                shortcut: "",
                run: () => {
                    setPriorityFilterValue("high");
                },
            },
            {
                id: "priority-filter-medium",
                label: "Priority filter: Medium",
                subtitle: "Show only medium priority tickets",
                shortcut: "",
                run: () => {
                    setPriorityFilterValue("medium");
                },
            },
            {
                id: "priority-filter-low",
                label: "Priority filter: Low",
                subtitle: "Show only low priority tickets",
                shortcut: "",
                run: () => {
                    setPriorityFilterValue("low");
                },
            },
            {
                id: "priority-sort-high-to-low",
                label: "Sort by priority: High to low",
                subtitle: "Order each column by priority descending",
                shortcut: "",
                run: () => {
                    setPrioritySortValue("high_to_low");
                },
            },
            {
                id: "priority-sort-low-to-high",
                label: "Sort by priority: Low to high",
                subtitle: "Order each column by priority ascending",
                shortcut: "",
                run: () => {
                    setPrioritySortValue("low_to_high");
                },
            },
            {
                id: "priority-sort-created",
                label: "Sort by created time",
                subtitle: "Restore default chronological order",
                shortcut: "",
                run: () => {
                    setPrioritySortValue("created");
                },
            },
            ...selectedPriorityActions,
            {
                id: "focus-todo",
                label: "Focus Todo column",
                subtitle: "Select first ticket in Todo",
                shortcut: "1",
                run: () => {
                    if (todoTickets[0]) openTicket(todoTickets[0].id);
                },
            },
            {
                id: "focus-in_progress",
                label: "Focus In Progress column",
                subtitle: "Select first ticket in In Progress",
                shortcut: "2",
                run: () => {
                    if (inProgressTickets[0])
                        openTicket(inProgressTickets[0].id);
                },
            },
            {
                id: "focus-done",
                label: "Focus Done column",
                subtitle: "Select first ticket in Done",
                shortcut: "3",
                run: () => {
                    if (doneTickets[0]) openTicket(doneTickets[0].id);
                },
            },
        ];
    });

    $effect(() => {
        if (workspace.status === "ready") {
            void boards.load().catch((error) => {
                setFailure("boards.load failed", error);
            });
        }
    });

    $effect(() => {
        if (workspace.status !== "ready") return;
        if (!focusedBoardId) return;

        const targetBoard = boards.boards.find(
            (board) => board.id === focusedBoardId,
        );

        if (!targetBoard) return;

        if (boards.active?.id !== targetBoard.id) {
            boards.setActive(targetBoard);
            selectedTicketId = null;
            detailOpen = false;
        }
    });

    $effect(() => {
        if (workspace.status !== "ready") {
            lastLoadedBoardId = null;
            return;
        }

        const activeBoardId = boards.active?.id ?? null;
        if (!activeBoardId || activeBoardId === lastLoadedBoardId) return;

        lastLoadedBoardId = activeBoardId;
        void tickets.load().catch((error) => {
            setFailure("tickets.load failed", error);
        });
    });

    $effect(() => {
        if (!selectedTicketId) return;

        const stillExists = tickets.tickets.some(
            (ticket) => ticket.id === selectedTicketId,
        );
        if (!stillExists) {
            selectedTicketId = null;
            detailOpen = false;
        }
    });

    $effect(() => {
        function onKeyDown(event: KeyboardEvent) {
            const isMeta = event.metaKey || event.ctrlKey;
            const key = event.key.toLowerCase();

            if (isMeta && key === "k") {
                event.preventDefault();
                commandPaletteOpen = true;
            }

            if (isMeta && (key === "t" || key === "n")) {
                event.preventDefault();
                void createTicket();
            }

            if (isMeta && key === "o") {
                event.preventDefault();
                void openWorkspacePicker();
            }

            if (isMeta && key === "b") {
                event.preventDefault();
                openCreateBoardDialog();
            }

            if (isMeta && key === "s") {
                event.preventDefault();
                manualSync();
            }

            if (
                !event.metaKey &&
                !event.ctrlKey &&
                key === "escape" &&
                detailOpen
            ) {
                event.preventDefault();
                detailOpen = false;
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    $effect(() => {
        setToolbarState({
            projectName:
                activeBoard?.name ?? workspace.meta?.name ?? "Workspace",
            pendingChanges,
            syncState,
            onOpenPalette: () => {
                commandPaletteOpen = true;
            },
            onCreateTicket: () => {
                void createTicket();
            },
            onManualSync: manualSync,
        });

        return () => {
            resetToolbarState();
        };
    });

    function onEditorKeyDown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            ticketDraft.saveTicket();
        }
    }
</script>

{#if workspace.status === "loading" || workspace.status === "idle"}
    <div class="flex h-full items-center justify-center p-8">
        <SurfaceCard
            class="w-full max-w-md text-center"
            title="Initializing Workspace"
            subtitle="Restoring your last workspace. If this takes too long, open one manually."
            bodyClass="space-y-3"
        >
            <Button onclick={() => void openWorkspacePicker()}
                >Open Workspace</Button
            >
        </SurfaceCard>
    </div>
{:else if workspace.status === "error"}
    <div class="flex h-full items-center justify-center p-8">
        <SurfaceCard
            class="w-full max-w-md text-center"
            title="Open a Workspace"
            subtitle="Pick a local folder to start managing boards and tickets."
            bodyClass="space-y-3"
        >
            <Button onclick={() => void openWorkspacePicker()}
                >Open Workspace</Button
            >
            {#if workspace.error}
                <p class="text-xs text-red-300">{workspace.error}</p>
            {/if}
            {#if pageError}
                <p class="text-xs text-red-300">{pageError}</p>
            {/if}
        </SurfaceCard>
    </div>
{:else if boards.boards.length === 0}
    <div class="flex h-full items-center justify-center p-8">
        <SurfaceCard
            class="w-full max-w-md text-center"
            title="No Boards Yet"
            subtitle="Create your first board to start adding tickets."
            bodyClass="space-y-3"
        >
            <Button onclick={openCreateBoardDialog}>Create First Board</Button>
            {#if pageError}
                <p class="text-xs text-red-300">{pageError}</p>
            {/if}
        </SurfaceCard>
    </div>
{:else}
    <div class="@container/main h-full p-4">
        <div
            class="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border/80 bg-surface-panel/80 px-2.5 py-2"
        >
            <span class="text-[10px] font-medium text-muted-foreground"
                >Priority filter</span
            >
            <Button
                size="sm"
                variant={priorityFilter === "all" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPriorityFilterValue("all")}
            >
                All
            </Button>
            <Button
                size="sm"
                variant={priorityFilter === "high" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPriorityFilterValue("high")}
            >
                High
            </Button>
            <Button
                size="sm"
                variant={priorityFilter === "medium" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPriorityFilterValue("medium")}
            >
                Medium
            </Button>
            <Button
                size="sm"
                variant={priorityFilter === "low" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPriorityFilterValue("low")}
            >
                Low
            </Button>

            <span class="ml-2 text-[10px] font-medium text-muted-foreground"
                >Sort</span
            >
            <Button
                size="sm"
                variant={prioritySort === "created" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPrioritySortValue("created")}
            >
                Created
            </Button>
            <Button
                size="sm"
                variant={prioritySort === "high_to_low" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPrioritySortValue("high_to_low")}
            >
                High-Low
            </Button>
            <Button
                size="sm"
                variant={prioritySort === "low_to_high" ? "default" : "outline"}
                class="h-6 px-2 text-[10px]"
                onclick={() => setPrioritySortValue("low_to_high")}
            >
                Low-High
            </Button>
        </div>

        {#if pageError}
            <div class="pb-3">
                <p
                    class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-red-300"
                >
                    {pageError}
                </p>
            </div>
        {/if}

        <KanbanBoard
            {todoTickets}
            {inProgressTickets}
            {doneTickets}
            {selectedTicketId}
            onSelectTicket={openTicket}
            onDropTicket={(ticketId, status) => {
                void moveTicket(ticketId, status);
            }}
            onQuickMoveTicket={quickMoveTicket}
            onMoveTicketToStatus={(ticketId, status) => {
                void moveTicketToStatus(ticketId, status);
            }}
            onDeleteTicket={(ticketId) => {
                requestTicketDeletion(ticketId);
            }}
        />
    </div>
{/if}

<AlertDialog bind:open={deleteTicketDialogOpen}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
                {#if ticketPendingDeletion}
                    Delete ticket "{ticketPendingDeletion.title}". This action
                    cannot be undone.
                {:else}
                    Delete this ticket. This action cannot be undone.
                {/if}
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel
                onclick={() => {
                    ticketPendingDeletionId = null;
                }}>Cancel</AlertDialogCancel
            >
            <AlertDialogAction
                variant="destructive"
                onclick={confirmTicketDeletion}>Delete ticket</AlertDialogAction
            >
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>

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
                    for="board-name"
                >
                    Board Name
                </label>
                <Input
                    id="board-name"
                    bind:value={boardName}
                    placeholder="Backend API"
                    autocomplete="off"
                />
            </div>

            <div class="space-y-1.5">
                <label
                    class="text-xs font-medium text-muted-foreground"
                    for="board-description"
                >
                    Description
                </label>
                <Textarea
                    id="board-description"
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

<TicketDetailPanel
    bind:open={detailOpen}
    ticket={selectedTicket}
    draftTitle={ticketDraft.draftTitle}
    draftDescription={ticketDraft.draftDescription}
    draftLabel={ticketDraft.draftLabel}
    draftStatus={ticketDraft.draftStatus}
    draftPriority={ticketDraft.draftPriority}
    statusOptions={ticketDraft.statusOptions}
    priorityOptions={ticketDraft.priorityOptions}
    newCommentDraft={ticketDraft.newComment}
    onDraftTitleChange={ticketDraft.setDraftTitle}
    onDraftDescriptionChange={ticketDraft.setDraftDescription}
    onDraftLabelChange={ticketDraft.setDraftLabel}
    onDraftStatusChange={ticketDraft.setDraftStatus}
    onDraftPriorityChange={ticketDraft.setDraftPriority}
    onNewCommentChange={ticketDraft.setNewComment}
    onSaveTicket={ticketDraft.saveTicket}
    onSubmitComment={ticketDraft.addComment}
    {onEditorKeyDown}
/>

<CommandPalette bind:open={commandPaletteOpen} actions={commandActions} />

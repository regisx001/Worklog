<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import KanbanWorkspaceView from "$lib/components/app/KanbanWorkspaceView.svelte";
  import CommandPalette from "$lib/components/app/CommandPalette.svelte";
  import TicketDetailPanel from "$lib/components/app/TicketDetailPanel.svelte";
  import { useBoards } from "$lib/hooks/boards.svelte";
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
    TicketStatus,
    UpdateTicketInput,
  } from "$lib/components/app/types.js";

  const workspace = useWorkspace();
  const boards = useBoards(() => workspace.path);
  const tickets = useTickets(
    () => workspace.path,
    () => boards.active?.id ?? null,
  );

  let selectedTicketId = $state<string | null>(null);
  let detailOpen = $state(false);
  let commandPaletteOpen = $state(false);
  let syncState = $state<SyncState>("up_to_date");
  let localPendingChanges = $state(0);
  let pageError = $state<string | null>(null);

  const activeBoard = $derived.by(() => boards.active);

  const todoTickets = $derived.by(() =>
    tickets.tickets.filter((ticket) => ticket.status === "todo"),
  );
  const inProgressTickets = $derived.by(() =>
    tickets.tickets.filter((ticket) => ticket.status === "in_progress"),
  );
  const doneTickets = $derived.by(() =>
    tickets.tickets.filter((ticket) => ticket.status === "done"),
  );

  const selectedTicket = $derived.by(() => {
    if (!selectedTicketId) return null;
    return (
      tickets.tickets.find((ticket) => ticket.id === selectedTicketId) ?? null
    );
  });

  const pendingChanges = $derived.by(() => localPendingChanges);

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
      await tickets.load();
    } catch (error) {
      setFailure("Failed to load board tickets", error);
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
        description: "Describe the task clearly and keep it actionable.",
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

  async function createBoard() {
    if (!workspace.path) {
      pageError = "Open a workspace first.";
      return;
    }

    try {
      await boards.create({
        name: `Board ${boards.boards.length + 1}`,
        description: "Created from the main page",
      });
      await tickets.load();
      syncState = "pending_changes";
    } catch (error) {
      setFailure("Failed to create board", error);
    }
  }

  function manualSync() {
    if (syncState === "syncing") return;
    syncState = "syncing";

    window.setTimeout(() => {
      localPendingChanges = 0;
      syncState = "up_to_date";
    }, 850);
  }

  async function openWorkspacePicker() {
    try {
      await workspace.pick();
      pageError = null;
    } catch (error) {
      setFailure("Failed to open workspace", error);
    }
  }

  function openSettingsPlaceholder() {
    commandPaletteOpen = true;
  }

  const commandActions = $derived.by<CommandAction[]>(() => [
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
      subtitle: "Create and activate a new board",
      shortcut: "Ctrl/Cmd+B",
      run: () => {
        void createBoard();
      },
    },
    {
      id: "new-ticket",
      label: "Create ticket",
      subtitle: "Add a new todo ticket in the active board",
      shortcut: "Ctrl/Cmd+N",
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
        if (inProgressTickets[0]) openTicket(inProgressTickets[0].id);
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
  ]);

  $effect(() => {
    void workspace.init().catch((error) => {
      setFailure("workspace.init failed", error);
    });
  });

  $effect(() => {
    if (workspace.status === "ready" || workspace.status === "no_workspace") {
      void boards.load().catch((error) => {
        setFailure("boards.load failed", error);
      });
    }
  });

  $effect(() => {
    if (workspace.status === "ready" || workspace.status === "no_workspace") {
      void tickets.load().catch((error) => {
        setFailure("tickets.load failed", error);
      });
    }
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

      if (isMeta && key === "n") {
        event.preventDefault();
        void createTicket();
      }

      if (isMeta && key === "o") {
        event.preventDefault();
        void openWorkspacePicker();
      }

      if (isMeta && key === "b") {
        event.preventDefault();
        void createBoard();
      }

      if (isMeta && key === "s") {
        event.preventDefault();
        manualSync();
      }

      if (!event.metaKey && !event.ctrlKey && key === "escape" && detailOpen) {
        event.preventDefault();
        detailOpen = false;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  $effect(() => {
    setToolbarState({
      projectName: activeBoard?.name ?? workspace.meta?.name ?? "Workspace",
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
</script>

{#if workspace.status === "loading" || workspace.status === "idle"}
  <div class="flex h-full items-center justify-center p-8">
    <div
      class="w-full max-w-md space-y-3 rounded-xl border border-border/80 bg-surface-panel/80 p-5 text-center"
    >
      <h1 class="font-display text-lg font-semibold">Initializing Workspace</h1>
      <p class="text-sm text-muted-foreground">
        Restoring your last workspace. If this takes too long, open one
        manually.
      </p>
      <Button onclick={() => void openWorkspacePicker()}>Open Workspace</Button>
    </div>
  </div>
{:else if workspace.status === "no_workspace" || workspace.status === "error"}
  <div class="flex h-full items-center justify-center p-8">
    <div
      class="w-full max-w-md space-y-3 rounded-xl border border-border/80 bg-surface-panel/80 p-5 text-center"
    >
      <h1 class="font-display text-lg font-semibold">Open a Workspace</h1>
      <p class="text-sm text-muted-foreground">
        Pick a local folder to start managing boards and tickets.
      </p>
      <Button onclick={() => void openWorkspacePicker()}>Open Workspace</Button>
      {#if workspace.error}
        <p class="text-xs text-red-300">{workspace.error}</p>
      {/if}
      {#if pageError}
        <p class="text-xs text-red-300">{pageError}</p>
      {/if}
    </div>
  </div>
{:else if boards.boards.length === 0}
  <div class="flex h-full items-center justify-center p-8">
    <div
      class="w-full max-w-md space-y-3 rounded-xl border border-border/80 bg-surface-panel/80 p-5 text-center"
    >
      <h1 class="font-display text-lg font-semibold">No Boards Yet</h1>
      <p class="text-sm text-muted-foreground">
        Create your first board to start adding tickets.
      </p>
      <Button onclick={() => void createBoard()}>Create First Board</Button>
      {#if pageError}
        <p class="text-xs text-red-300">{pageError}</p>
      {/if}
    </div>
  </div>
{:else}
  <div class="h-full">
    {#if pageError}
      <div class="px-3 pt-3">
        <p
          class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-red-300"
        >
          {pageError}
        </p>
      </div>
    {/if}

    <KanbanWorkspaceView
      boards={boards.boards}
      activeBoardId={activeBoard?.id ?? null}
      {syncState}
      {todoTickets}
      {inProgressTickets}
      {doneTickets}
      {selectedTicketId}
      {pendingChanges}
      onSelectBoard={selectBoard}
      onOpenPalette={() => {
        commandPaletteOpen = true;
      }}
      onOpenSettings={openSettingsPlaceholder}
      onCreateTicket={() => {
        void createTicket();
      }}
      onSelectTicket={openTicket}
      onDropTicket={(ticketId, status) => {
        void moveTicket(ticketId, status);
      }}
      onQuickMoveTicket={quickMoveTicket}
      onManualSync={manualSync}
    />
  </div>
{/if}

<TicketDetailPanel
  bind:open={detailOpen}
  ticket={selectedTicket}
  onUpdateTicket={updateTicket}
  onAddComment={addComment}
/>
<CommandPalette bind:open={commandPaletteOpen} actions={commandActions} />

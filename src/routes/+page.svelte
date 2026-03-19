<script lang="ts">
  import { resetToolbarState, setToolbarState } from "$lib/hooks/toolbar.js";
  import KanbanColumn from "$lib/components/app/KanbanColumn.svelte";
  import Sidebar from "$lib/components/app/Sidebar.svelte";
  import TicketDetailPanel from "$lib/components/app/TicketDetailPanel.svelte";
  import SyncStatusBar from "$lib/components/app/SyncStatusBar.svelte";
  import CommandPalette from "$lib/components/app/CommandPalette.svelte";
  import type {
    CommandAction,
    Project,
    SyncState,
    Ticket,
    TicketStatus,
  } from "$lib/components/app/types.js";

  let projects = $state<Project[]>([
    {
      id: "core",
      name: "Core Compiler",
      localChanges: 2,
      lastSyncedAt: "2m ago",
    },
    {
      id: "desktop",
      name: "Desktop Shell",
      localChanges: 0,
      lastSyncedAt: "8m ago",
    },
    {
      id: "devx",
      name: "Developer UX",
      localChanges: 1,
      lastSyncedAt: "12m ago",
    },
  ]);

  let tickets = $state<Ticket[]>([
    {
      id: "TK-101",
      projectId: "core",
      title: "Persist board state between restarts",
      description:
        "- Save board data in local storage\n- Restore selected ticket on load",
      status: "todo",
      label: "enhancement",
      assignee: "Regis Xavier",
      comments: [
        {
          id: "c-1",
          author: "Mia",
          body: "Prefer filesystem snapshot over localStorage.",
          createdAt: "09:12",
        },
      ],
    },
    {
      id: "TK-102",
      projectId: "core",
      title: "Keyboard reorder in kanban columns",
      description: "Enable moving a focused card with shortcuts.",
      status: "in-progress",
      label: "feature",
      assignee: "Ivy Chen",
      comments: [],
    },
    {
      id: "TK-103",
      projectId: "core",
      title: "Add markdown preview in detail panel",
      description: "Render plain markdown-like line breaks instantly.",
      status: "done",
      label: "ui",
      assignee: "Noah Park",
      comments: [
        {
          id: "c-2",
          author: "Noah",
          body: "Shipped with escaped HTML output.",
          createdAt: "Yesterday",
        },
      ],
    },
    {
      id: "TK-104",
      projectId: "desktop",
      title: "Attach native notifications for due dates",
      description: "Hook Tauri notification API.",
      status: "todo",
      label: "desktop",
      comments: [],
    },
    {
      id: "TK-105",
      projectId: "devx",
      title: "Command palette action indexing",
      description: "Support fuzzy filter across labels and ids.",
      status: "in-progress",
      label: "perf",
      comments: [],
    },
  ]);

  let activeProjectId = $state("core");
  let selectedTicketId = $state<string | null>(null);
  let detailOpen = $state(false);
  let commandPaletteOpen = $state(false);
  let syncState = $state<SyncState>("pending_changes");

  const activeProject = $derived.by(() => {
    return (
      projects.find((project) => project.id === activeProjectId) ?? projects[0]
    );
  });

  const visibleTickets = $derived.by(() => {
    return tickets.filter((ticket) => ticket.projectId === activeProjectId);
  });

  const todoTickets = $derived.by(() =>
    visibleTickets.filter((ticket) => ticket.status === "todo"),
  );
  const inProgressTickets = $derived.by(() =>
    visibleTickets.filter((ticket) => ticket.status === "in-progress"),
  );
  const doneTickets = $derived.by(() =>
    visibleTickets.filter((ticket) => ticket.status === "done"),
  );

  const selectedTicket = $derived.by(() => {
    if (!selectedTicketId) return null;
    return tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  });

  const pendingChanges = $derived.by(() => {
    return projects.reduce((sum, project) => sum + project.localChanges, 0);
  });

  function markProjectDirty(projectId: string) {
    projects = projects.map((project) =>
      project.id === projectId
        ? {
            ...project,
            localChanges: project.localChanges + 1,
            lastSyncedAt: "now",
          }
        : project,
    );
    syncState = "pending_changes";
  }

  function selectProject(projectId: string) {
    activeProjectId = projectId;
    selectedTicketId = null;
    detailOpen = false;
  }

  function openTicket(ticketId: string) {
    selectedTicketId = ticketId;
    detailOpen = true;
  }

  function moveTicket(ticketId: string, nextStatus: TicketStatus) {
    const ticket = tickets.find((entry) => entry.id === ticketId);
    if (!ticket || ticket.status === nextStatus) return;

    tickets = tickets.map((entry) =>
      entry.id === ticketId ? { ...entry, status: nextStatus } : entry,
    );
    markProjectDirty(ticket.projectId);
  }

  function quickMoveTicket(ticketId: string) {
    const ticket = tickets.find((entry) => entry.id === ticketId);
    if (!ticket) return;

    const cycle: Record<TicketStatus, TicketStatus> = {
      todo: "in-progress",
      "in-progress": "done",
      done: "todo",
    };

    moveTicket(ticketId, cycle[ticket.status]);
  }

  function createTicket() {
    const serial = tickets.length + 101;
    const id = `TK-${serial}`;
    const nextTicket: Ticket = {
      id,
      projectId: activeProjectId,
      title: "New ticket",
      description: "Describe the task clearly and keep it actionable.",
      status: "todo",
      label: "feature",
      comments: [],
    };

    tickets = [nextTicket, ...tickets];
    selectedTicketId = id;
    detailOpen = true;
    markProjectDirty(activeProjectId);
  }

  function updateTicket(
    ticketId: string,
    updates: Partial<
      Pick<Ticket, "title" | "description" | "status" | "label">
    >,
  ) {
    const target = tickets.find((ticket) => ticket.id === ticketId);
    if (!target) return;
    tickets = tickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, ...updates } : ticket,
    );
    markProjectDirty(target.projectId);
  }

  function addComment(ticketId: string, body: string) {
    const target = tickets.find((ticket) => ticket.id === ticketId);
    if (!target) return;

    tickets = tickets.map((ticket) => {
      if (ticket.id !== ticketId) return ticket;
      return {
        ...ticket,
        comments: [
          ...ticket.comments,
          {
            id: crypto.randomUUID(),
            author: "You",
            body,
            createdAt: "Just now",
          },
        ],
      };
    });
    markProjectDirty(target.projectId);
  }

  function manualSync() {
    if (syncState === "syncing") return;
    syncState = "syncing";

    window.setTimeout(() => {
      projects = projects.map((project) => ({
        ...project,
        localChanges: 0,
        lastSyncedAt: "now",
      }));
      syncState = "up_to_date";
    }, 850);
  }

  function openSettingsPlaceholder() {
    commandPaletteOpen = true;
  }

  const commandActions = $derived.by<CommandAction[]>(() => [
    {
      id: "new-ticket",
      label: "Create ticket",
      subtitle: "Add a new todo ticket in current project",
      shortcut: "Ctrl/Cmd+N",
      run: createTicket,
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
      id: "focus-in-progress",
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
    function onKeyDown(event: KeyboardEvent) {
      const isMeta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isMeta && key === "k") {
        event.preventDefault();
        commandPaletteOpen = true;
      }

      if (isMeta && key === "n") {
        event.preventDefault();
        createTicket();
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
      projectName: activeProject?.name ?? "Project",
      pendingChanges,
      syncState,
      onOpenPalette: () => {
        commandPaletteOpen = true;
      },
      onCreateTicket: createTicket,
      onManualSync: manualSync,
    });

    return () => {
      resetToolbarState();
    };
  });
</script>

<div class="grid h-full min-h-0 grid-cols-[18rem_1fr]">
  <Sidebar
    {projects}
    {activeProjectId}
    {syncState}
    onSelectProject={selectProject}
    onOpenPalette={() => {
      commandPaletteOpen = true;
    }}
    onOpenSettings={openSettingsPlaceholder}
    onCreateTicket={createTicket}
  />

  <div class="flex min-w-0 min-h-0 flex-col">
    <main class="min-h-0 flex-1 p-3">
      <div class="grid h-full min-h-0 grid-cols-3 gap-3">
        <KanbanColumn
          title="Todo"
          status="todo"
          tickets={todoTickets}
          {selectedTicketId}
          onSelectTicket={openTicket}
          onDragTicketStart={() => {
            // drag state is handled through dataTransfer for drop targets
          }}
          onDropTicket={moveTicket}
          onQuickMoveTicket={quickMoveTicket}
        />
        <KanbanColumn
          title="In Progress"
          status="in-progress"
          tickets={inProgressTickets}
          {selectedTicketId}
          onSelectTicket={openTicket}
          onDragTicketStart={() => {
            // drag state is handled through dataTransfer for drop targets
          }}
          onDropTicket={moveTicket}
          onQuickMoveTicket={quickMoveTicket}
        />
        <KanbanColumn
          title="Done"
          status="done"
          tickets={doneTickets}
          {selectedTicketId}
          onSelectTicket={openTicket}
          onDragTicketStart={() => {
            // drag state is handled through dataTransfer for drop targets
          }}
          onDropTicket={moveTicket}
          onQuickMoveTicket={quickMoveTicket}
        />
      </div>
    </main>

    <SyncStatusBar {syncState} {pendingChanges} onManualSync={manualSync} />
  </div>
</div>

<TicketDetailPanel
  bind:open={detailOpen}
  ticket={selectedTicket}
  onUpdateTicket={updateTicket}
  onAddComment={addComment}
/>
<CommandPalette bind:open={commandPaletteOpen} actions={commandActions} />

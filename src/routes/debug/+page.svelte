<script lang="ts">
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { getDb } from "$lib/db";
  import { seedDatabase } from "$lib/db/seed";
  import { useWorkspace } from "$lib/hooks/workspace.svelte";
  import { useBoards } from "$lib/hooks/boards.svelte";
  import { useTickets } from "$lib/hooks/tickets.svelte";

  const workspace = useWorkspace();
  const boards = useBoards(() => workspace.path);
  const tickets = useTickets(
    () => workspace.path,
    () => boards.active?.id ?? null,
  );

  let seeding = $state(false);
  let seeded = $state(false);
  let actionMessage = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  const rawDump = $derived.by(() =>
    JSON.stringify(
      {
        workspace: {
          status: workspace.status,
          path: workspace.path,
          meta: workspace.meta,
        },
        boards: boards.boards,
        activeBoard: boards.active,
        tickets: tickets.tickets,
      },
      null,
      2,
    ),
  );

  function setSuccess(message: string) {
    actionMessage = message;
    actionError = null;
  }

  function setFailure(context: string, error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    actionError = `${context}: ${detail}`;
    actionMessage = null;
    console.error(context, error);
  }

  // ─── test actions ───────────────────────────────
  async function testCreateBoard() {
    try {
      await boards.create({
        name: "Test Board",
        description: "Created from debug page",
      });
      await tickets.load();
      setSuccess("Test board created.");
    } catch (error) {
      setFailure("Create board failed", error);
    }
  }

  async function testCreateTicket() {
    try {
      if (!boards.active) {
        setFailure("Create ticket failed", "No active board selected");
        return;
      }

      await tickets.create({
        board_id: boards.active.id,
        title: "Test Ticket " + Date.now(),
        description: "Debug ticket",
        labels: ["test"],
      });
      setSuccess("Test ticket created.");
    } catch (error) {
      setFailure("Create ticket failed", error);
    }
  }

  async function testUpdateTicket(id: string) {
    try {
      await tickets.update(id, { status: "in_progress" });
      setSuccess(`Ticket ${id} moved to in_progress.`);
    } catch (error) {
      setFailure("Update ticket failed", error);
    }
  }

  async function testDeleteTicket(id: string) {
    try {
      await tickets.remove(id);
      setSuccess(`Ticket ${id} deleted.`);
    } catch (error) {
      setFailure("Delete ticket failed", error);
    }
  }

  // ─── boot ───────────────────────────────────────
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
    if (workspace.status === "ready") {
      void tickets.load().catch((error) => {
        setFailure("tickets.load failed", error);
      });
    }
  });

  async function runSeed() {
    if (!workspace.path) {
      setFailure("Seeding failed", "Open a workspace first");
      return;
    }

    seeding = true;
    actionError = null;
    actionMessage = null;

    try {
      const db = await getDb(workspace.path);
      await seedDatabase(db);
      await boards.load();
      await tickets.load();
      seeded = true;
      setSuccess("Seed completed successfully.");
    } catch (error) {
      seeded = false;
      setFailure("Seeding failed", error);
    } finally {
      seeding = false;
    }
  }
</script>

<div class="no-scrollbar h-full min-h-0 overflow-y-auto">
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
    <section
      class="rounded-xl border border-border/80 bg-surface-panel/70 p-4 backdrop-blur-md"
    >
      <div
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-1">
          <h1 class="font-display text-lg font-semibold tracking-wide">
            Developer Debug Console
          </h1>
          <p class="text-xs text-muted-foreground">
            Seed test data, inspect workspace state, and validate board/ticket
            flows.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline" class="text-[10px] uppercase tracking-wide">
            status: {workspace.status}
          </Badge>
          <Badge variant="outline" class="text-[10px] uppercase tracking-wide">
            boards: {boards.boards.length}
          </Badge>
          <Badge variant="outline" class="text-[10px] uppercase tracking-wide">
            tickets: {tickets.tickets.length}
          </Badge>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Button onclick={() => workspace.pick()} variant="outline" size="sm">
          Open Workspace
        </Button>
        <Button
          onclick={runSeed}
          disabled={seeding || !workspace.path}
          size="sm"
        >
          {seeding ? "Seeding..." : seeded ? "Seeded" : "Seed Database"}
        </Button>
        <Button onclick={testCreateBoard} variant="outline" size="sm">
          Create Board
        </Button>
        <Button
          onclick={testCreateTicket}
          variant="outline"
          size="sm"
          disabled={!boards.active}
        >
          Create Ticket
        </Button>
      </div>

      {#if actionError}
        <p
          class="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-red-300"
        >
          {actionError}
        </p>
      {:else if actionMessage}
        <p
          class="mt-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary"
        >
          {actionMessage}
        </p>
      {/if}
    </section>

    <div class="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <section class="rounded-xl border border-border/80 bg-card/75 p-4">
        <h2 class="text-sm font-semibold tracking-wide">Workspace</h2>
        <Separator class="my-3" />
        <dl class="space-y-2 text-xs">
          <div class="grid grid-cols-[90px_1fr] gap-2">
            <dt class="text-muted-foreground">Status</dt>
            <dd>{workspace.status}</dd>
          </div>
          <div class="grid grid-cols-[90px_1fr] gap-2">
            <dt class="text-muted-foreground">Path</dt>
            <dd class="truncate font-mono">{workspace.path ?? "-"}</dd>
          </div>
          <div class="grid grid-cols-[90px_1fr] gap-2">
            <dt class="text-muted-foreground">Metadata</dt>
            <dd class="font-mono">{JSON.stringify(workspace.meta)}</dd>
          </div>
        </dl>
        {#if workspace.error}
          <p class="mt-3 text-xs text-red-300">{workspace.error}</p>
        {/if}
      </section>

      <section class="rounded-xl border border-border/80 bg-card/75 p-4">
        <h2 class="text-sm font-semibold tracking-wide">
          Boards ({boards.boards.length})
        </h2>
        <Separator class="my-3" />
        <div class="space-y-2">
          {#if boards.boards.length === 0}
            <p class="text-xs text-muted-foreground">No boards yet.</p>
          {:else}
            {#each boards.boards as board}
              <article
                class="rounded-lg border border-border/80 bg-surface-card px-3 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <h3 class="text-xs font-medium">{board.name}</h3>
                    <p class="font-mono text-[11px] text-muted-foreground">
                      {board.id}
                    </p>
                  </div>
                  <div class="flex items-center gap-1.5">
                    {#if boards.active?.id === board.id}
                      <Badge variant="outline" class="text-[10px]">Active</Badge
                      >
                    {:else}
                      <Button
                        onclick={() => boards.setActive(board)}
                        variant="outline"
                        size="sm"
                        class="h-7"
                      >
                        Set Active
                      </Button>
                    {/if}
                    <Button
                      onclick={() => boards.remove(board.id)}
                      variant="ghost"
                      size="sm"
                      class="h-7 text-red-300 hover:text-red-100"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            {/each}
          {/if}
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-border/80 bg-card/75 p-4">
      <h2 class="text-sm font-semibold tracking-wide">
        Tickets ({tickets.tickets.length})
      </h2>
      <p class="mt-1 text-xs text-muted-foreground">
        Active board: {boards.active?.name ?? "none"}
      </p>
      <Separator class="my-3" />

      <div class="grid gap-2">
        {#if tickets.tickets.length === 0}
          <p class="text-xs text-muted-foreground">
            No tickets in active board.
          </p>
        {:else}
          {#each tickets.tickets as ticket}
            <article
              class="rounded-lg border border-border/80 bg-surface-card px-3 py-2"
            >
              <div
                class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p class="text-xs font-medium">
                    [{ticket.id}] {ticket.title}
                  </p>
                  <p class="mt-1 text-[11px] text-muted-foreground">
                    status: {ticket.status} · labels: {ticket.labels.join(
                      ", ",
                    ) || "none"}
                  </p>
                </div>
                <div class="flex items-center gap-1.5">
                  <Button
                    onclick={() => testUpdateTicket(ticket.id)}
                    variant="outline"
                    size="sm"
                    class="h-7"
                  >
                    Move to in_progress
                  </Button>
                  <Button
                    onclick={() => testDeleteTicket(ticket.id)}
                    variant="ghost"
                    size="sm"
                    class="h-7 text-red-300 hover:text-red-100"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          {/each}
        {/if}
      </div>
    </section>

    <section class="rounded-xl border border-border/80 bg-card/75 p-4">
      <h2 class="text-sm font-semibold tracking-wide">Raw State Dump</h2>
      <Separator class="my-3" />
      <pre
        class="no-scrollbar max-h-112 overflow-auto rounded-lg border border-border/80 bg-black/25 p-3 font-mono text-[11px] text-slate-200">{rawDump}</pre>
    </section>
  </div>
</div>

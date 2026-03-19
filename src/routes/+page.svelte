<script lang="ts">
  import { useWorkspace } from "$lib/hooks/workspace.svelte";
  import { useBoards } from "$lib/hooks/boards.svelte";
  import { useTickets } from "$lib/hooks/tickets.svelte";

  const workspace = useWorkspace();
  const boards = useBoards(workspace.path ?? "");
  const tickets = useTickets(workspace.path ?? "", boards.active?.id ?? "");

  // ─── test actions ───────────────────────────────
  async function testCreateBoard() {
    await boards.create({
      name: "Test Board",
      description: "Created from debug page",
    });
  }

  async function testCreateTicket() {
    if (!boards.active) return alert("No active board");
    await tickets.create({
      board_id: boards.active.id,
      title: "Test Ticket " + Date.now(),
      description: "Debug ticket",
      labels: ["test"],
    });
  }

  async function testUpdateTicket(id: string) {
    await tickets.update(id, { status: "in_progress" });
  }

  async function testDeleteTicket(id: string) {
    await tickets.remove(id);
  }

  // ─── boot ───────────────────────────────────────
  $effect(() => {
    void workspace.init().catch((error) => {
      console.error("workspace.init failed", error);
    });
  });

  $effect(() => {
    if (workspace.status === "ready") {
      void boards.load().catch((error) => {
        console.error("boards.load failed", error);
      });
    }
  });

  $effect(() => {
    if (boards.active) {
      void tickets.load().catch((error) => {
        console.error("tickets.load failed", error);
      });
    }
  });

  import { seedDatabase } from "$lib/db/seed";
  import { getDb } from "$lib/db";

  let seeding = $state(false);
  let seeded = $state(false);

  async function runSeed() {
    if (!workspace.path) return alert("Open a workspace first");
    seeding = true;
    const db = await getDb(workspace.path);
    await seedDatabase(db);
    await boards.load(); // refresh after seed
    seeding = false;
    seeded = true;
  }
</script>

<button onclick={runSeed} disabled={seeding || seeded}>
  {seeding ? "Seeding..." : seeded ? "✅ Seeded" : "🌱 Seed Database"}
</button>

<!-- ── STATUS ─────────────────────────────────── -->
<section>
  <h2>Workspace</h2>
  <p>Status: <strong>{workspace.status}</strong></p>
  <p>Path: <code>{workspace.path ?? "—"}</code></p>
  <p>Meta: <code>{JSON.stringify(workspace.meta, null, 2)}</code></p>

  {#if workspace.status === "no_workspace" || workspace.status === "error"}
    <button onclick={() => workspace.pick()}>Open Folder</button>
  {/if}

  {#if workspace.error}
    <p style="color:red">Error: {workspace.error}</p>
  {/if}
</section>

<hr />

<!-- ── BOARDS ─────────────────────────────────── -->
<section>
  <h2>Boards ({boards.boards.length})</h2>
  <button onclick={testCreateBoard}>+ Create Board</button>

  {#each boards.boards as board}
    <div style="border:1px solid #444; padding:8px; margin:4px">
      <strong>{board.name}</strong> — <code>{board.id}</code>
      {#if boards.active?.id === board.id}
        <span style="color:green"> ← active</span>
      {:else}
        <button onclick={() => boards.setActive(board)}>Set Active</button>
      {/if}
      <button onclick={() => boards.remove(board.id)}>Delete</button>
    </div>
  {/each}
</section>

<hr />

<!-- ── TICKETS ────────────────────────────────── -->
<section>
  <h2>
    Tickets ({tickets.tickets.length}) — Board: {boards.active?.name ?? "none"}
  </h2>
  <button onclick={testCreateTicket} disabled={!boards.active}
    >+ Create Ticket</button
  >

  {#each tickets.tickets as ticket}
    <div style="border:1px solid #444; padding:8px; margin:4px">
      <strong>[{ticket.id}]</strong>
      {ticket.title}
      <br />
      Status: <code>{ticket.status}</code>
      Labels: <code>{JSON.stringify(ticket.labels)}</code>
      <br />
      <button onclick={() => testUpdateTicket(ticket.id)}>→ in_progress</button>
      <button onclick={() => testDeleteTicket(ticket.id)}>Delete</button>
    </div>
  {/each}
</section>

<hr />

<!-- ── RAW JSON DUMP ──────────────────────────── -->
<section>
  <h2>Raw State Dump</h2>
  <pre>{JSON.stringify(
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
    )}</pre>
</section>

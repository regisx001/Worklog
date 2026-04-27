<!-- src/lib/components/app/kanban/kanban-board.svelte -->
<script lang="ts">
    import {
        Modal,
        TextInput,
        TextArea,
        Select,
        SelectItem,
        MultiSelect,
        InlineNotification,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
    } from "carbon-components-svelte";
    import KanbanColumn from "./kanban-column.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import type {
        Ticket,
        TicketStatus,
        TicketPriority,
    } from "$lib/components/app/types";

    type Column = {
        status: TicketStatus;
        label: string;
        accentColor: string;
        tickets: Ticket[];
    };

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const getBoardId = () => shell.boardsApi.active?.id ?? null;

    const ticketsHook = useTickets(getWorkspacePath, getBoardId);

    let loadError = $state<string | null>(null);
    let actionError = $state<string | null>(null);

    $effect(() => {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();

        if (!workspacePath || !boardId) {
            return;
        }

        void (async () => {
            try {
                loadError = null;
                await ticketsHook.load();
            } catch (error) {
                loadError = String(error);
            }
        })();
    });

    const columnsDef = [
        { status: "todo" as TicketStatus, label: "To Do", accentColor: "teal" },
        {
            status: "in_progress" as TicketStatus,
            label: "In Progress",
            accentColor: "blue",
        },
        { status: "done" as TicketStatus, label: "Done", accentColor: "green" },
    ];

    let columns = $derived(
        columnsDef.map((def) => ({
            ...def,
            tickets: ticketsHook.tickets.filter(
                (ticket) => ticket.status === def.status,
            ),
        })),
    );

    // ── Search / filter ────────────────────────────────────────────────────────
    let searchQuery = $state("");

    const filteredColumns = $derived(
        columns.map((col) => ({
            ...col,
            tickets: searchQuery.trim()
                ? col.tickets.filter(
                      (t) =>
                          t.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                          t.description
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                          t.labels?.some((tag) =>
                              tag
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()),
                          ),
                  )
                : col.tickets,
        })),
    );

    // ── DnD handlers ───────────────────────────────────────────────────────────
    function makeHandlers(targetStatus: TicketStatus) {
        return {
            consider(_e: CustomEvent) {
                actionError = null;
            },
            finalize(e: CustomEvent) {
                void (async () => {
                    try {
                        const detail = e.detail as {
                            info?: { id?: string };
                            items?: Array<{ id?: string }>;
                        };
                        const movedTicketId = detail.info?.id;

                        if (!movedTicketId) {
                            return;
                        }

                        // finalize fires on multiple zones; only destination should persist.
                        const movedIntoThisColumn =
                            detail.items?.some(
                                (item) => item?.id === movedTicketId,
                            ) ?? false;

                        if (!movedIntoThisColumn) {
                            return;
                        }

                        actionError = null;
                        await ticketsHook.update(movedTicketId, {
                            status: targetStatus,
                        });
                    } catch (error) {
                        actionError = String(error);
                    }
                })();
            },
        };
    }

    // ── Modal state (Add / Edit) ───────────────────────────────────────────────
    let modalOpen = $state(false);
    let isEditing = $state(false);
    let targetStatus = $state<TicketStatus>("todo");
    let submitting = $state(false);

    let form = $state<{
        id?: string;
        title: string;
        description: string;
        priority: TicketPriority;
        dueDate: string;
        tags: string[];
    }>({
        title: "",
        description: "",
        priority: "p2",
        dueDate: "",
        tags: [],
    });

    const TAG_OPTIONS = [
        "frontend",
        "backend",
        "design",
        "docs",
        "devops",
        "auth",
        "api",
        "native",
        "tauri",
        "svelte",
        "setup",
        "blocked",
    ];

    function openAddModal(status: TicketStatus) {
        isEditing = false;
        targetStatus = status;
        actionError = null;
        form = {
            title: "",
            description: "",
            priority: "p2",
            dueDate: "",
            tags: [],
        };
        modalOpen = true;
    }

    function openEditModal(ticket: Ticket) {
        isEditing = true;
        actionError = null;
        form = {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            dueDate: ticket.due_date ?? "",
            tags: ticket.labels ?? [],
        };
        modalOpen = true;
    }

    async function handleSubmit() {
        if (!form.title.trim()) return;
        const board_id = getBoardId();
        if (!board_id) return;

        try {
            submitting = true;
            actionError = null;

            if (isEditing && form.id !== undefined) {
                await ticketsHook.update(form.id, {
                    title: form.title,
                    description: form.description || "",
                    priority: form.priority,
                    due_date: form.dueDate || null,
                    labels: form.tags,
                });
            } else {
                await ticketsHook.create({
                    board_id,
                    title: form.title,
                    description: form.description || "",
                    status: targetStatus,
                    priority: form.priority,
                    due_date: form.dueDate || null,
                    labels: form.tags,
                });
            }

            modalOpen = false;
        } catch (error) {
            actionError = String(error);
        } finally {
            submitting = false;
        }
    }

    async function deleteTicket(id: string) {
        try {
            actionError = null;
            await ticketsHook.remove(id);
        } catch (error) {
            actionError = String(error);
        }
    }

    // ── Stats ──────────────────────────────────────────────────────────────────
    const totalTickets = $derived(
        columns.reduce((s, c) => s + c.tickets.length, 0),
    );
    const doneCount = $derived(
        columns.find((c) => c.status === "done")?.tickets.length ?? 0,
    );
    const progress = $derived(
        totalTickets > 0 ? Math.round((doneCount / totalTickets) * 100) : 0,
    );
</script>

<!-- ── Board Shell ─────────────────────────────────────────────────────────── -->
<div class="board-shell">
    <!-- Toolbar -->
    <Toolbar>
        <ToolbarContent>
            <ToolbarSearch
                value={searchQuery}
                oninput={(e: any) => (searchQuery = e.currentTarget.value)}
                placeholder="Search tickets…"
                persistent
            />
            <div class="toolbar-stats">
                <span class="stats-text">{doneCount} / {totalTickets} done</span
                >
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {progress}%"></div>
                </div>
            </div>
        </ToolbarContent>
    </Toolbar>

    {#if searchQuery && filteredColumns.every((c) => c.tickets.length === 0)}
        <InlineNotification
            kind="info"
            title="No results"
            subtitle="No tickets match '{searchQuery}'."
            hideCloseButton
        />
    {/if}

    {#if loadError}
        <InlineNotification
            kind="error"
            title="Unable to load tickets"
            subtitle={loadError}
            hideCloseButton
        />
    {/if}

    {#if actionError}
        <InlineNotification
            kind="error"
            title="Ticket action failed"
            subtitle={actionError}
            hideCloseButton
        />
    {/if}

    <!-- Columns -->
    <div class="board-columns" role="main" aria-label="Kanban board">
        {#each filteredColumns as col (col.status)}
            {@const handlers = makeHandlers(col.status)}
            <KanbanColumn
                label={col.label}
                status={col.status}
                tickets={col.tickets}
                accentColor={col.accentColor}
                isLoading={ticketsHook.loading}
                onconsider={handlers.consider}
                onfinalize={handlers.finalize}
                onAddTicket={openAddModal}
                onEditTicket={openEditModal}
                onDeleteTicket={deleteTicket}
            />
        {/each}
    </div>
</div>

<!-- ── Add / Edit Modal ────────────────────────────────────────────────────── -->
<Modal
    bind:open={modalOpen}
    modalHeading={isEditing ? "Edit Ticket" : "New Ticket"}
    primaryButtonText={isEditing ? "Save Changes" : "Create Ticket"}
    secondaryButtonText="Cancel"
    on:click:button--primary={handleSubmit}
    on:click:button--secondary={() => (modalOpen = false)}
    primaryButtonDisabled={!form.title.trim() || submitting}
    size="sm"
>
    <div class="modal-form">
        <TextInput
            labelText="Title *"
            placeholder="e.g. Implement login screen"
            bind:value={form.title}
        />
        <TextArea
            labelText="Description"
            placeholder="Describe the ticket…"
            rows={3}
            bind:value={form.description}
        />
        <div class="form-row">
            <Select labelText="Priority" bind:selected={form.priority}>
                <SelectItem value="p3" text="Low" />
                <SelectItem value="p2" text="Medium" />
                <SelectItem value="p1" text="High" />
            </Select>
        </div>
        <div class="form-row">
            <TextInput
                labelText="Due Date"
                placeholder="e.g. May 10"
                bind:value={form.dueDate}
            />
        </div>
        <MultiSelect
            // titleText="Tags"
            label="Select tags…"
            items={TAG_OPTIONS.map((t) => ({ id: t, text: t }))}
            bind:selectedIds={form.tags}
        />
    </div>
</Modal>

<style>
    .board-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
    }

    /* Columns scroll area */
    .board-columns {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        align-items: flex-start;

        /* Nice momentum scroll on macOS/iOS */
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .board-columns::-webkit-scrollbar {
        height: 6px;
    }
    .board-columns::-webkit-scrollbar-track {
        background: transparent;
    }
    .board-columns::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 3px;
    }

    /* Toolbar extras */
    .toolbar-stats {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 1rem;
    }

    .stats-text {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        white-space: nowrap;
    }

    .progress-bar {
        width: 100px;
        height: 4px;
        background: var(--cds-ui-03);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--cds-support-02);
        border-radius: 2px;
        transition: width 0.4s ease;
    }

    /* Modal form */
    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-block: 0.5rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
</style>

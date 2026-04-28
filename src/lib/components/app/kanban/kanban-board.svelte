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
        Dropdown,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        DatePicker,
        DatePickerInput,
    } from "carbon-components-svelte";
    import KanbanColumn from "./kanban-column.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        type TicketType,
        TICKET_STATUS_CONFIG,
        TICKET_STATUS_ORDER,
        TICKET_TYPE_CONFIG,
        TICKET_TYPE_OPTIONS,
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

    // ── Column definitions from config ─────────────────────────────────────────
    const columnsDef = TICKET_STATUS_ORDER.map((status) => ({
        status,
        label: TICKET_STATUS_CONFIG[status].label,
        accentColor: TICKET_STATUS_CONFIG[status].accentColor,
    }));

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
        ticketType: TicketType;
        dueDate: string;
        tags: string[];
    }>({
        title: "",
        description: "",
        priority: "p2",
        ticketType: "feature",
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
            ticketType: "feature",
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
            ticketType: ticket.ticket_type,
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
                    ticket_type: form.ticketType,
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
                    ticket_type: form.ticketType,
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

    let deleteTicketId = $state<string | null>(null);
    let deleteTicketModalOpen = $state(false);

    function promptDeleteTicket(id: string) {
        deleteTicketId = id;
        deleteTicketModalOpen = true;
    }

    async function confirmDeleteTicket() {
        if (!deleteTicketId) return;
        try {
            actionError = null;
            await ticketsHook.remove(deleteTicketId);
        } catch (error) {
            actionError = String(error);
        } finally {
            deleteTicketModalOpen = false;
            deleteTicketId = null;
        }
    }

    // ── Stats (exclude backlog from progress) ─────────────────────────────────
    const activeTickets = $derived(
        columns
            .filter((c) => c.status !== "backlog")
            .reduce((s, c) => s + c.tickets.length, 0),
    );
    const doneCount = $derived(
        columns.find((c) => c.status === "done")?.tickets.length ?? 0,
    );
    const progress = $derived(
        activeTickets > 0 ? Math.round((doneCount / activeTickets) * 100) : 0,
    );
    const totalTickets = $derived(
        columns.reduce((s, c) => s + c.tickets.length, 0),
    );

    // Listen for create-ticket events from the command palette / shortcuts
    $effect(() => {
        const handler = () => openAddModal("todo");
        window.addEventListener("worklog:create-ticket", handler);
        return () =>
            window.removeEventListener("worklog:create-ticket", handler);
    });
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
                <span class="stats-text"
                    >{doneCount} / {activeTickets} done</span
                >
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {progress}%"></div>
                </div>
                {#if totalTickets !== activeTickets}
                    <span class="stats-text stats-backlog"
                        >+{totalTickets - activeTickets} backlog</span
                    >
                {/if}
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
                onDeleteTicket={promptDeleteTicket}
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
            <Dropdown
                labelText="Priority"
                bind:selectedId={form.priority}
                items={[
                    { id: "p3", text: "Low" },
                    { id: "p2", text: "Medium" },
                    { id: "p1", text: "High" },
                ]}
            />

            <Dropdown
                labelText="Type"
                bind:selectedId={form.ticketType}
                items={TICKET_TYPE_OPTIONS.map((typeKey) => ({
                    id: typeKey,
                    text: TICKET_TYPE_CONFIG[typeKey].label,
                }))}
            />
            x
        </div>
        <div class="form-row">
            <DatePicker
                bind:value={form.dueDate}
                datePickerType="single"
                dateFormat="Y-m-d"
            >
                <DatePickerInput
                    labelText="Due Date"
                    placeholder="yyyy-mm-dd"
                />
            </DatePicker>
        </div>
        <MultiSelect
            label="Select tags…"
            items={TAG_OPTIONS.map((t) => ({ id: t, text: t }))}
            bind:selectedIds={form.tags}
        />
    </div>
</Modal>

<Modal
    danger
    bind:open={deleteTicketModalOpen}
    modalHeading="Delete Ticket"
    primaryButtonText="Delete"
    size="xs"
    secondaryButtonText="Cancel"
    on:click:button--secondary={() => (deleteTicketModalOpen = false)}
    on:click:button--primary={confirmDeleteTicket}
>
    <p>
        Are you sure you want to delete this ticket? This action cannot be
        undone.
    </p>
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
        min-height: 0;

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

    .stats-backlog {
        opacity: 0.7;
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

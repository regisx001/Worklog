<!-- src/lib/components/app/kanban/kanban-board.svelte -->
<script lang="ts">
    import {
        Modal,
        TextInput,
        TextArea,
        Select,
        SelectItem,
        MultiSelect,
        Button,
        InlineNotification,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        ToastNotification,
    } from "carbon-components-svelte";
    import KanbanColumn from "./kanban-column.svelte";

    // ── Types ──────────────────────────────────────────────────────────────────
    type Priority = "low" | "medium" | "high" | "critical";
    type ColumnStatus = "todo" | "doing" | "done" | "blocked";

    type Ticket = {
        id: number;
        title: string;
        description?: string;
        priority: Priority;
        assignee?: string;
        dueDate?: string;
        tags?: string[];
        commentCount?: number;
    };

    type Column = {
        status: ColumnStatus;
        label: string;
        accentColor: string;
        tickets: Ticket[];
    };

    // ── Initial data ───────────────────────────────────────────────────────────
    let nextId = $state(10);

    let columns = $state<Column[]>([
        {
            status: "todo",
            label: "To Do",
            accentColor: "teal",
            tickets: [
                {
                    id: 1,
                    title: "Design authentication flow",
                    description:
                        "Create wireframes and user flow diagrams for login, registration and password reset screens.",
                    priority: "high",
                    assignee: "J. Martin",
                    dueDate: "May 10",
                    tags: ["design", "auth"],
                    commentCount: 3,
                },
                {
                    id: 2,
                    title: "Set up CI/CD pipeline",
                    description:
                        "Configure GitHub Actions for automated testing and deployment to staging.",
                    priority: "medium",
                    assignee: "A. Reyes",
                    dueDate: "May 14",
                    tags: ["devops"],
                    commentCount: 1,
                },
                {
                    id: 3,
                    title: "Write API documentation",
                    priority: "low",
                    tags: ["docs"],
                    commentCount: 0,
                },
            ],
        },
        {
            status: "doing",
            label: "In Progress",
            accentColor: "blue",
            tickets: [
                {
                    id: 4,
                    title: "Implement Kanban drag & drop",
                    description:
                        "Use svelte-dnd-action with Carbon Components to build this board.",
                    priority: "critical",
                    assignee: "You",
                    dueDate: "Apr 30",
                    tags: ["frontend", "svelte"],
                    commentCount: 7,
                },
                {
                    id: 5,
                    title: "Tauri file system integration",
                    description:
                        "Hook up native file pickers and OS-level drag-and-drop events.",
                    priority: "high",
                    assignee: "L. Chen",
                    tags: ["tauri", "native"],
                    commentCount: 2,
                },
            ],
        },
        {
            status: "done",
            label: "Done",
            accentColor: "green",
            tickets: [
                {
                    id: 6,
                    title: "Project scaffolding",
                    description:
                        "SvelteKit + Tauri + Carbon Components initial setup.",
                    priority: "medium",
                    assignee: "A. Reyes",
                    dueDate: "Apr 20",
                    tags: ["setup"],
                    commentCount: 4,
                },
                {
                    id: 7,
                    title: "Define ticket data model",
                    priority: "low",
                    dueDate: "Apr 22",
                    commentCount: 1,
                },
            ],
        },
        {
            status: "blocked",
            label: "Blocked",
            accentColor: "red",
            tickets: [
                {
                    id: 8,
                    title: "Integrate with backend API",
                    description:
                        "Blocked on backend team delivering the REST endpoints.",
                    priority: "critical",
                    assignee: "J. Martin",
                    tags: ["api", "blocked"],
                    commentCount: 5,
                },
            ],
        },
    ]);

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
                          t.tags?.some((tag) =>
                              tag
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()),
                          ),
                  )
                : col.tickets,
        })),
    );

    // ── DnD handlers ───────────────────────────────────────────────────────────
    function makeHandlers(targetStatus: ColumnStatus) {
        return {
            consider(e: CustomEvent) {
                const idx = columns.findIndex((c) => c.status === targetStatus);
                if (idx !== -1) columns[idx].tickets = e.detail.items;
            },
            finalize(e: CustomEvent) {
                const idx = columns.findIndex((c) => c.status === targetStatus);
                if (idx !== -1) columns[idx].tickets = e.detail.items;
                showToast = true;
                toastMessage = `Ticket moved to "${columns[idx]?.label}"`;
                setTimeout(() => (showToast = false), 3000);
            },
        };
    }

    // ── Modal state (Add / Edit) ───────────────────────────────────────────────
    let modalOpen = $state(false);
    let isEditing = $state(false);
    let targetStatus = $state<ColumnStatus>("todo");

    let form = $state<{
        id?: number;
        title: string;
        description: string;
        priority: Priority;
        assignee: string;
        dueDate: string;
        tags: string[];
    }>({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
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

    function openAddModal(status: ColumnStatus) {
        isEditing = false;
        targetStatus = status;
        form = {
            title: "",
            description: "",
            priority: "medium",
            assignee: "",
            dueDate: "",
            tags: [],
        };
        modalOpen = true;
    }

    function openEditModal(ticket: Ticket) {
        isEditing = true;
        form = {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description ?? "",
            priority: ticket.priority,
            assignee: ticket.assignee ?? "",
            dueDate: ticket.dueDate ?? "",
            tags: ticket.tags ?? [],
        };
        modalOpen = true;
    }

    function handleSubmit() {
        if (!form.title.trim()) return;

        if (isEditing && form.id !== undefined) {
            // Update existing ticket across all columns
            for (const col of columns) {
                const idx = col.tickets.findIndex((t) => t.id === form.id);
                if (idx !== -1) {
                    col.tickets[idx] = {
                        ...col.tickets[idx],
                        title: form.title,
                        description: form.description || undefined,
                        priority: form.priority,
                        assignee: form.assignee || undefined,
                        dueDate: form.dueDate || undefined,
                        tags: form.tags.length ? form.tags : undefined,
                    };
                    break;
                }
            }
        } else {
            const col = columns.find((c) => c.status === targetStatus);
            if (col) {
                col.tickets.push({
                    id: nextId++,
                    title: form.title,
                    description: form.description || undefined,
                    priority: form.priority,
                    assignee: form.assignee || undefined,
                    dueDate: form.dueDate || undefined,
                    tags: form.tags.length ? form.tags : undefined,
                    commentCount: 0,
                });
            }
        }

        modalOpen = false;
    }

    function deleteTicket(id: number) {
        for (const col of columns) {
            const idx = col.tickets.findIndex((t) => t.id === id);
            if (idx !== -1) {
                col.tickets.splice(idx, 1);
                break;
            }
        }
    }

    // ── Toast ──────────────────────────────────────────────────────────────────
    let showToast = $state(false);
    let toastMessage = $state("");

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
                on:input={(e: any) => (searchQuery = e.currentTarget.value)}
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

    <!-- Columns -->
    <div class="board-columns" role="main" aria-label="Kanban board">
        {#each filteredColumns as col (col.status)}
            {@const handlers = makeHandlers(col.status)}
            <KanbanColumn
                label={col.label}
                status={col.status}
                tickets={col.tickets}
                accentColor={col.accentColor}
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
    primaryButtonDisabled={!form.title.trim()}
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
                <SelectItem value="low" text="Low" />
                <SelectItem value="medium" text="Medium" />
                <SelectItem value="high" text="High" />
                <SelectItem value="critical" text="Critical" />
            </Select>
            <TextInput
                labelText="Assignee"
                placeholder="Name or initials"
                bind:value={form.assignee}
            />
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

<!-- ── Toast notification ──────────────────────────────────────────────────── -->
{#if showToast}
    <div class="toast-anchor">
        <ToastNotification
            kind="success"
            title="Moved"
            subtitle={toastMessage}
            timeout={3000}
            on:close={() => (showToast = false)}
        />
    </div>
{/if}

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

    /* Toast */
    .toast-anchor {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
    }
</style>

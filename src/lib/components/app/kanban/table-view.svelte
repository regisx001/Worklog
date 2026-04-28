<script lang="ts">
    import {
        Accordion,
        AccordionItem,
        DataTable,
        Tag,
        OverflowMenu,
        OverflowMenuItem,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        InlineNotification,
    } from "carbon-components-svelte";
    import {
        Pending,
        TaskComplete,
        InProgress as InProgressIcon,
        CheckmarkFilled,
        Calendar,
        ArrowUp,
        ArrowRight,
        ArrowDown,
        StarFilled,
        Debug,
        SettingsAdjust,
        ChartLineSmooth,
        Lightning,
        Explore,
        CopyFile,
        Edit,
        TrashCan,
    } from "carbon-icons-svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        type TicketType,
        TICKET_STATUS_ORDER,
        TICKET_STATUS_CONFIG,
        TICKET_PRIORITY_CONFIG,
        TICKET_TYPE_CONFIG,
    } from "$lib/components/app/types";

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const getBoardId = () => shell.boardsApi.active?.id ?? null;

    const ticketsHook = useTickets(getWorkspacePath, getBoardId);

    let searchQuery = $state("");

    // ── Icon Maps ──────────────────────────────────────────────────────────────
    const statusIconMap: Record<TicketStatus, any> = {
        backlog: Pending,
        todo: TaskComplete,
        in_progress: InProgressIcon,
        done: CheckmarkFilled,
    };

    const typeIconMap: Record<TicketType, any> = {
        feature: StarFilled,
        bug: Debug,
        chore: SettingsAdjust,
        improvement: ChartLineSmooth,
        epic: Lightning,
        spike: Explore,
    };

    const priorityIconMap: Record<TicketPriority, any> = {
        p1: ArrowUp,
        p2: ArrowRight,
        p3: ArrowDown,
    };

    const statusAccentMap: Record<TicketStatus, string> = {
        backlog: "#e5399e",
        todo: "var(--cds-support-04)",
        in_progress: "var(--cds-interactive-01)",
        done: "var(--cds-support-02)",
    };

    // ── Table Headers ──────────────────────────────────────────────────────────
    const headers: any = [
        { key: "title", value: "Title" },
        { key: "priority", value: "Priority" },
        { key: "type", value: "Type" },
        { key: "labels", value: "Labels" },
        { key: "dueDate", value: "Due Date" },
        { key: "created", value: "Created" },
        { key: "actions", empty: true },
    ];

    // ── Filtering ──────────────────────────────────────────────────────────────
    const filteredTickets = $derived(
        searchQuery.trim()
            ? ticketsHook.tickets.filter(
                  (t) =>
                      t.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      t.description
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      t.labels?.some((tag) =>
                          tag.toLowerCase().includes(searchQuery.toLowerCase()),
                      ),
              )
            : ticketsHook.tickets,
    );

    // ── Grouping ───────────────────────────────────────────────────────────────
    const groupedTickets = $derived(
        TICKET_STATUS_ORDER.map((status) => ({
            status,
            label: TICKET_STATUS_CONFIG[status].label,
            icon: statusIconMap[status],
            accentColor: statusAccentMap[status],
            tickets: filteredTickets.filter((t) => t.status === status),
        })),
    );

    // ── Sorting ────────────────────────────────────────────────────────────────
    function customSort(a: any, b: any, { key }: { key: string }) {
        switch (key) {
            case "priority":
                return String(a).localeCompare(String(b));
            case "type":
                return String(a).localeCompare(String(b));
            case "dueDate":
            case "created":
                if (!a) return 1;
                if (!b) return -1;
                return new Date(a).getTime() - new Date(b).getTime();
            default:
                return String(a).localeCompare(String(b));
        }
    }

    // ── Date Formatting ────────────────────────────────────────────────────────
    function formatRelativeDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    function formatDueDate(dateStr: string | null): {
        text: string;
        overdue: boolean;
    } {
        if (!dateStr) return { text: "—", overdue: false };
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0)
            return {
                text: `${Math.abs(diffDays)}d overdue`,
                overdue: true,
            };
        if (diffDays === 0) return { text: "Due today", overdue: false };
        if (diffDays === 1) return { text: "Tomorrow", overdue: false };
        if (diffDays < 7) return { text: `In ${diffDays}d`, overdue: false };
        return {
            text: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            overdue: false,
        };
    }

    // ── Actions ────────────────────────────────────────────────────────────────
    function handleEdit(ticketId: string) {
        const event = new CustomEvent("worklog:edit-ticket", {
            detail: { id: ticketId },
        });
        window.dispatchEvent(event);
    }

    function handleDelete(ticketId: string) {
        const event = new CustomEvent("worklog:delete-ticket", {
            detail: { id: ticketId },
        });
        window.dispatchEvent(event);
    }

    function copyId(ticketId: string) {
        if (navigator.clipboard) {
            void navigator.clipboard.writeText(ticketId);
        }
    }

    // ── Stats ──────────────────────────────────────────────────────────────────
    const totalCount = $derived(filteredTickets.length);
</script>

<div class="table-view-shell">
    <!-- Toolbar -->
    <div class="table-toolbar">
        <Toolbar>
            <ToolbarContent>
                <ToolbarSearch
                    bind:value={searchQuery}
                    placeholder="Search tickets…"
                    persistent
                />
            </ToolbarContent>
        </Toolbar>
        <div class="table-stats">
            <span class="stats-pill"
                >{totalCount} ticket{totalCount !== 1 ? "s" : ""}</span
            >
        </div>
    </div>

    <!-- Empty State -->
    {#if totalCount === 0 && searchQuery.trim()}
        <div class="table-empty-state">
            <InlineNotification
                kind="info"
                title="No results"
                subtitle="No tickets match '{searchQuery}'."
                hideCloseButton
            />
        </div>
    {/if}

    <!-- Grouped Table Content -->
    <div class="table-content">
        {#each groupedTickets as group}
            <div class="status-group" style="--accent: {group.accentColor}">
                <!-- Group header (custom, not accordion) -->
                <details class="group-details" open>
                    <summary class="group-header">
                        <div class="group-header-left">
                            <span class="group-accent-bar"></span>
                            <group.icon size={16} />
                            <strong class="group-label">{group.label}</strong>
                            <span class="group-count"
                                >{group.tickets.length}</span
                            >
                        </div>
                        <span class="group-chevron"></span>
                    </summary>

                    {#if group.tickets.length > 0}
                        <div class="group-table-wrapper">
                            <DataTable
                                sortable
                                size="short"
                                {headers}
                                rows={group.tickets.map((t) => ({
                                    id: t.id,
                                    title: t.title,
                                    priority: t.priority,
                                    type: t.ticket_type,
                                    labels: t.labels,
                                    dueDate: t.due_date,
                                    created: t.created_at,
                                }))}
                                sort={customSort}
                            >
                                <svelte:fragment slot="cell" let:row let:cell>
                                    {#if cell.key === "title"}
                                        <div class="cell-title">
                                            <span class="cell-title-text"
                                                >{cell.value}</span
                                            >
                                            <span class="cell-title-id"
                                                >{row.id}</span
                                            >
                                        </div>
                                    {:else if cell.key === "priority"}
                                        {@const PriorityIcon =
                                            priorityIconMap[
                                                cell.value as TicketPriority
                                            ]}
                                        <div class="cell-priority">
                                            {#if PriorityIcon}
                                                <PriorityIcon size={14} />
                                            {/if}
                                            <Tag
                                                type={TICKET_PRIORITY_CONFIG[
                                                    cell.value as TicketPriority
                                                ]?.tagColor || "blue"}
                                                size="sm"
                                            >
                                                {TICKET_PRIORITY_CONFIG[
                                                    cell.value as TicketPriority
                                                ]?.label || cell.value}
                                            </Tag>
                                        </div>
                                    {:else if cell.key === "type"}
                                        {@const TypeIcon =
                                            typeIconMap[
                                                cell.value as TicketType
                                            ]}
                                        <div class="cell-type">
                                            {#if TypeIcon}
                                                <TypeIcon size={14} />
                                            {/if}
                                            <Tag
                                                type={TICKET_TYPE_CONFIG[
                                                    cell.value as TicketType
                                                ]?.tagColor || "blue"}
                                                size="sm"
                                            >
                                                {TICKET_TYPE_CONFIG[
                                                    cell.value as TicketType
                                                ]?.label || cell.value}
                                            </Tag>
                                        </div>
                                    {:else if cell.key === "labels"}
                                        <div class="cell-labels">
                                            {#if Array.isArray(cell.value) && cell.value.length > 0}
                                                {#each cell.value.slice(0, 3) as label}
                                                    <Tag
                                                        type="outline"
                                                        size="sm">{label}</Tag
                                                    >
                                                {/each}
                                                {#if cell.value.length > 3}
                                                    <span class="labels-more"
                                                        >+{cell.value.length -
                                                            3}</span
                                                    >
                                                {/if}
                                            {:else}
                                                <span class="cell-muted">—</span
                                                >
                                            {/if}
                                        </div>
                                    {:else if cell.key === "dueDate"}
                                        {@const due = formatDueDate(cell.value)}
                                        <div
                                            class="cell-due"
                                            class:overdue={due.overdue}
                                        >
                                            <Calendar size={14} />
                                            <span>{due.text}</span>
                                        </div>
                                    {:else if cell.key === "created"}
                                        <span class="cell-date"
                                            >{formatRelativeDate(
                                                cell.value,
                                            )}</span
                                        >
                                    {:else if cell.key === "actions"}
                                        <div class="cell-actions">
                                            <OverflowMenu flipped size="sm">
                                                <OverflowMenuItem
                                                    text="Copy ID"
                                                    on:click={() =>
                                                        copyId(row.id)}
                                                />
                                                <OverflowMenuItem
                                                    text="Edit ticket"
                                                    on:click={() =>
                                                        handleEdit(row.id)}
                                                />
                                                <OverflowMenuItem
                                                    danger
                                                    text="Delete"
                                                    on:click={() =>
                                                        handleDelete(row.id)}
                                                />
                                            </OverflowMenu>
                                        </div>
                                    {:else}
                                        {cell.value}
                                    {/if}
                                </svelte:fragment>
                            </DataTable>
                        </div>
                    {:else}
                        <div class="group-empty">
                            <span>No tickets</span>
                        </div>
                    {/if}
                </details>
            </div>
        {/each}
    </div>
</div>

<style>
    /* ── Shell ──────────────────────────────────────────────────────────── */
    .table-view-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
    }

    /* ── Toolbar ────────────────────────────────────────────────────────── */
    .table-toolbar {
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .table-toolbar :global(.bx--toolbar) {
        flex: 1;
    }

    .table-stats {
        padding: 0 1rem;
        flex-shrink: 0;
    }

    .stats-pill {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        background: var(--cds-ui-01);
        padding: 0.125rem 0.625rem;
        border-radius: 10px;
        white-space: nowrap;
        border: 1px solid var(--cds-ui-03);
    }

    /* ── Empty state ───────────────────────────────────────────────────── */
    .table-empty-state {
        padding: 1rem;
    }

    /* ── Scrollable content ────────────────────────────────────────────── */
    .table-content {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;

        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .table-content::-webkit-scrollbar {
        width: 5px;
    }
    .table-content::-webkit-scrollbar-track {
        background: transparent;
    }
    .table-content::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 3px;
    }

    /* ── Status Group ──────────────────────────────────────────────────── */
    .status-group {
        margin-bottom: 0.25rem;
    }

    /* ── Group Header (using <details>) ────────────────────────────────── */
    .group-details {
        border: none;
    }

    .group-details > summary {
        list-style: none;
    }
    .group-details > summary::-webkit-details-marker {
        display: none;
    }

    .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        cursor: pointer;
        user-select: none;
        transition: background 0.12s ease;
        border-bottom: 1px solid transparent;
    }

    .group-header:hover {
        background: var(--cds-hover-ui);
    }

    .group-header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .group-accent-bar {
        width: 3px;
        height: 16px;
        border-radius: 2px;
        background: var(--accent);
        flex-shrink: 0;
    }

    .group-header-left :global(svg) {
        color: var(--accent);
        flex-shrink: 0;
    }

    .group-label {
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        letter-spacing: 0.01em;
    }

    .group-count {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--cds-text-02);
        background: var(--cds-ui-03);
        padding: 0 0.375rem;
        border-radius: 8px;
        min-width: 1.25rem;
        text-align: center;
        line-height: 1.25rem;
    }

    .group-chevron {
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 5px solid var(--cds-text-02);
        transition: transform 0.15s ease;
    }

    .group-details:not([open]) .group-chevron {
        transform: rotate(-90deg);
    }

    /* ── Table wrapper ─────────────────────────────────────────────────── */
    .group-table-wrapper {
        border-bottom: 1px solid var(--cds-ui-03);
    }

    /* Tighter DataTable styling */
    .group-table-wrapper :global(.bx--data-table) {
        border: none;
    }

    .group-table-wrapper :global(.bx--data-table thead) {
        background: var(--cds-ui-01);
    }

    .group-table-wrapper :global(.bx--data-table thead th) {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--cds-text-02);
        padding-top: 0.375rem;
        padding-bottom: 0.375rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .group-table-wrapper :global(.bx--data-table tbody tr) {
        transition: background 0.1s ease;
    }

    .group-table-wrapper :global(.bx--data-table tbody tr:hover) {
        background: var(--cds-hover-ui);
    }

    .group-table-wrapper :global(.bx--data-table td) {
        border-bottom: 1px solid
            color-mix(in srgb, var(--cds-ui-03) 50%, transparent);
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        vertical-align: middle;
    }

    /* ── Cell: Title ───────────────────────────────────────────────────── */
    .cell-title {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .cell-title-text {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-01);
        line-height: 1.3;
    }

    .cell-title-id {
        font-size: 0.6875rem;
        color: var(--cds-text-placeholder);
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
    }

    /* ── Cell: Priority ────────────────────────────────────────────────── */
    .cell-priority {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .cell-priority :global(svg) {
        flex-shrink: 0;
        color: var(--cds-text-02);
    }

    /* ── Cell: Type ────────────────────────────────────────────────────── */
    .cell-type {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .cell-type :global(svg) {
        flex-shrink: 0;
        color: var(--cds-text-02);
    }

    /* ── Cell: Labels ──────────────────────────────────────────────────── */
    .cell-labels {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
    }

    .labels-more {
        font-size: 0.6875rem;
        color: var(--cds-text-02);
        font-weight: 500;
    }

    /* ── Cell: Due Date ────────────────────────────────────────────────── */
    .cell-due {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
    }

    .cell-due :global(svg) {
        flex-shrink: 0;
        color: var(--cds-text-02);
    }

    .cell-due.overdue {
        color: var(--cds-support-01);
        font-weight: 500;
    }

    .cell-due.overdue :global(svg) {
        color: var(--cds-support-01);
    }

    /* ── Cell: Date ────────────────────────────────────────────────────── */
    .cell-date {
        font-size: 0.8125rem;
        color: var(--cds-text-02);
    }

    /* ── Cell: Muted placeholder ───────────────────────────────────────── */
    .cell-muted {
        color: var(--cds-text-placeholder);
    }

    /* ── Cell: Actions ─────────────────────────────────────────────────── */
    .cell-actions {
        display: flex;
        justify-content: flex-end;
    }

    /* ── Group empty state ─────────────────────────────────────────────── */
    .group-empty {
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        font-size: 0.75rem;
        color: var(--cds-text-placeholder);
        font-style: italic;
        border-bottom: 1px solid var(--cds-ui-03);
    }
</style>

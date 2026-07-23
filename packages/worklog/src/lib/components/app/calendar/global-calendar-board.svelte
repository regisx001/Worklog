<script lang="ts">
    import { InlineNotification } from "carbon-components-svelte";
    import { getTickets } from "$lib/hooks/tickets.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import type {
        Ticket,
        TicketStatus,
        Comment,
    } from "$lib/components/app/types";
    import { CalendarState, setCalendarState } from "./calendar-state.svelte";
    import CalendarHeader from "./calendar-header.svelte";
    import CalendarGrid from "./calendar-grid.svelte";
    import TicketAddEditModal from "../kanban/ticket-add-edit-modal.svelte";
    import TicketDeleteConfirm from "../kanban/ticket-delete-confirm.svelte";
    import TicketPreviewSheet from "../kanban/ticket-preview-sheet.svelte";
    import { getDb, SettingsRepo } from "$lib/db";
    import * as m from "$lib/paraglide/messages.js";

    let { searchQuery = "" }: { searchQuery?: string } = $props();

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const ticketsHook = getTickets(getWorkspacePath);

    // Create a proxy hook for the calendar state to prefix board names to titles
    const proxyTicketsHook = {
        get tickets(): Ticket[] {
            return ticketsHook.tickets.map((t) => {
                const board = shell.boardsApi.boards.find(
                    (b) => b.id === t.board_id,
                );
                const boardName = board?.name ?? "Unknown";
                return {
                    ...t,
                    title: `[${boardName}] ${t.title}`,
                    _originalTitle: t.title, // Keep track of original for edits
                } as Ticket & { _originalTitle: string };
            });
        },
        get loading() {
            return ticketsHook.loading;
        },
        load: () => ticketsHook.load(),
    };

    const calendar = new CalendarState(proxyTicketsHook, () => searchQuery);
    setCalendarState(calendar);

    $effect(() => {
        void proxyTicketsHook.load();
    });

    // ── Modal state ─────────────────────────────────────────────────────────────
    let editModalOpen = $state(false);
    let editTicket = $state<Ticket | null>(null);
    let deleteModalOpen = $state(false);
    let deleteTarget = $state<Ticket | null>(null);
    let previewOpen = $state(false);
    let previewTicketId = $state<string | null>(null);

    const previewTicket = $derived(
        previewTicketId
            ? (ticketsHook.tickets.find((t) => t.id === previewTicketId) ??
                  null)
            : null,
    );

    // Editing from global calendar will retain the original title
    function openEditModal(ticket: Ticket) {
        editTicket =
            ticketsHook.tickets.find((t) => t.id === ticket.id) ?? ticket;
        editModalOpen = true;
    }

    function openPreviewSheet(ticket: Ticket) {
        previewTicketId = ticket.id;
        previewOpen = true;
    }

    async function submitTicket(data: any) {
        if (data.id) {
            await ticketsHook.update(data.id, {
                title: data.title,
                description: data.description,
                priority: data.priority,
                ticket_type: data.ticketType,
                start_date: data.startDate || null,
                due_date: data.dueDate || null,
                labels: data.tags,
            });
        }
        // Creating tickets from global calendar is disabled
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        await ticketsHook.remove(deleteTarget.id);
        deleteTarget = null;
    }

    async function handleStatusChange(id: string, status: TicketStatus) {
        await ticketsHook.update(id, { status });
    }

    async function handleAddComment(ticketId: string, body: string) {
        const workspacePath = shell.workspace.path;
        if (!workspacePath) return;
        let author = "Anonymous";
        try {
            const db = await getDb(workspacePath);
            const settings = await SettingsRepo.getSettings(db);
            author = settings.author_name?.trim() || "Anonymous";
        } catch {
            /* use fallback */
        }
        const comment: Comment = {
            author,
            body,
            timestamp: new Date().toISOString(),
        };
        await ticketsHook.addComment(ticketId, comment);
    }

    const hasNoDateTickets = $derived(
        calendar.filteredTickets.length > 0 &&
            calendar.filteredTickets.every((t) => !t.due_date && !t.start_date),
    );
</script>

<div class="calendar-shell">
    <CalendarHeader />

    {#if hasNoDateTickets}
        <div class="cal-notice">
            <InlineNotification
                kind="info"
                title={m.calendar_no_dates()}
                subtitle={m.calendar_no_dates_msg()}
                hideCloseButton
            />
        </div>
    {/if}

    <CalendarGrid
        onTicketClick={openPreviewSheet}
        onDateClick={() => {
            /* Creating tickets from global calendar is disabled */
        }}
    />
</div>

<!-- ── Modals ────────────────────────────────────────────────────────────────── -->
<TicketAddEditModal
    bind:open={editModalOpen}
    ticket={editTicket}
    onSubmit={submitTicket}
/>

<TicketDeleteConfirm
    bind:open={deleteModalOpen}
    ticketTitle={deleteTarget?.title ?? ""}
    onConfirm={confirmDelete}
/>

{#if previewTicket}
    <TicketPreviewSheet
        bind:open={previewOpen}
        ticket={previewTicket}
        onEdit={(t) => {
            previewOpen = false;
            openEditModal(t);
        }}
        onDelete={(id) => {
            previewOpen = false;
            const t = ticketsHook.tickets.find((t) => t.id === id);
            if (t) {
                deleteTarget = t;
                deleteModalOpen = true;
            }
        }}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
    />
{/if}

<style>
    .calendar-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
        overflow: hidden;
    }

    .cal-notice {
        padding: 0.75rem 1rem 0;
        flex-shrink: 0;
    }
</style>

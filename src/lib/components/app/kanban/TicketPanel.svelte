<script lang="ts">
    import AppDrawer from "../layout/drawer/AppDrawer.svelte";
    import type { Task } from "./kanban.types.js";

    type TicketPanelUpdates = Partial<
        Pick<
            Task,
            | "title"
            | "description"
            | "status"
            | "priority"
            | "ticket_type"
            | "due_date"
            | "comments"
        >
    >;

    interface Props {
        open: boolean;
        boardName: string;
        ticket: Task | null;
        onClose: () => void;
        onUpdateTicket: (
            ticketId: string,
            updates: TicketPanelUpdates,
        ) => Promise<void> | void;
    }

    let { open, boardName, ticket, onClose, onUpdateTicket }: Props = $props();

    let initializedTicketId = $state<string | null>(null);
    let draftTitle = $state("");
    let draftDescription = $state("");
    let newComment = $state("");

    $effect(() => {
        if (!ticket || initializedTicketId === ticket.id) {
            return;
        }

        initializedTicketId = ticket.id;
        draftTitle = ticket.title;
        draftDescription = ticket.description;
        newComment = "";
    });

    async function saveTicket(updates: TicketPanelUpdates) {
        if (!ticket) {
            return;
        }

        await onUpdateTicket(ticket.id, updates);
    }

    async function handleTitleBlur() {
        if (!ticket) {
            return;
        }

        const nextTitle = draftTitle.trim();
        if (!nextTitle || nextTitle === ticket.title) {
            draftTitle = ticket.title;
            return;
        }

        await saveTicket({ title: nextTitle });
    }

    async function handleDescriptionBlur() {
        if (!ticket) {
            return;
        }

        const nextDescription = draftDescription.trim();
        if (nextDescription === ticket.description) {
            return;
        }

        await saveTicket({ description: nextDescription });
    }

    async function handleStatusChange(event: Event) {
        if (!ticket) {
            return;
        }

        const value = (event.currentTarget as HTMLSelectElement)
            .value as Task["status"];

        if (value === ticket.status) {
            return;
        }

        await saveTicket({ status: value });
    }

    async function handlePriorityChange(event: Event) {
        if (!ticket) {
            return;
        }

        const value = (event.currentTarget as HTMLSelectElement)
            .value as Task["priority"];

        if (value === ticket.priority) {
            return;
        }

        await saveTicket({ priority: value });
    }

    async function handleTypeChange(event: Event) {
        if (!ticket) {
            return;
        }

        const value = (event.currentTarget as HTMLSelectElement)
            .value as Task["ticket_type"];

        if (value === ticket.ticket_type) {
            return;
        }

        await saveTicket({ ticket_type: value });
    }

    async function handleDueDateChange(event: Event) {
        if (!ticket) {
            return;
        }

        const rawDate = (event.currentTarget as HTMLInputElement).value;
        const nextDueDate = rawDate
            ? new Date(`${rawDate}T00:00:00.000Z`).toISOString()
            : null;

        if (nextDueDate === ticket.due_date) {
            return;
        }

        await saveTicket({ due_date: nextDueDate });
    }

    async function handleAddComment() {
        if (!ticket) {
            return;
        }

        const body = newComment.trim();
        if (!body) {
            return;
        }

        const nextComments = [
            ...ticket.comments,
            {
                author: "You",
                body,
                timestamp: new Date().toISOString(),
            },
        ];

        await saveTicket({ comments: nextComments });
        newComment = "";
    }

    const dueDateValue = $derived(
        ticket?.due_date ? ticket.due_date.slice(0, 10) : "",
    );
</script>

{#if open && ticket}
    <AppDrawer
        {open}
        ariaLabel="Ticket details"
        width="calc(var(--pico-spacing) * 20)"
        {onClose}
    >
        {#snippet header()}
            <div class="ticket-panel-header">
                <small>
                    <span>{boardName}</span>
                    <span aria-hidden="true">›</span>
                    <span class="ticket-panel-id">{ticket.id}</span>
                </small>
            </div>
        {/snippet}

        {#snippet children()}
            <div class="ticket-panel-body">
                <label class="ticket-panel-block">
                    <small>Title</small>
                    <input
                        type="text"
                        bind:value={draftTitle}
                        onblur={handleTitleBlur}
                    />
                </label>

                <label class="ticket-panel-block">
                    <small>Description</small>
                    <textarea
                        rows="6"
                        bind:value={draftDescription}
                        onblur={handleDescriptionBlur}
                    ></textarea>
                </label>

                <section class="ticket-panel-block">
                    <small>Properties</small>
                    <dl>
                        <dt>Status</dt>
                        <dd>
                            <select
                                value={ticket.status}
                                onchange={handleStatusChange}
                            >
                                <option value="backlog">Backlog</option>
                                <option value="todo">Todo</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </dd>

                        <dt>Priority</dt>
                        <dd>
                            <select
                                value={ticket.priority}
                                onchange={handlePriorityChange}
                            >
                                <option value="p1">P1</option>
                                <option value="p2">P2</option>
                                <option value="p3">P3</option>
                            </select>
                        </dd>

                        <dt>Type</dt>
                        <dd>
                            <select
                                value={ticket.ticket_type}
                                onchange={handleTypeChange}
                            >
                                <option value="feature">Feature</option>
                                <option value="bug">Bug</option>
                                <option value="chore">Chore</option>
                            </select>
                        </dd>

                        <dt>Due Date</dt>
                        <dd>
                            <input
                                type="date"
                                value={dueDateValue}
                                onchange={handleDueDateChange}
                            />
                        </dd>

                        <dt>Board</dt>
                        <dd>{boardName}</dd>

                        <dt>Ticket ID</dt>
                        <dd>{ticket.id}</dd>
                    </dl>
                </section>

                <section class="ticket-panel-block">
                    <small>Activity</small>
                    <ul role="list" class="ticket-panel-activity-list">
                        {#if ticket.comments.length === 0}
                            <li class="ticket-panel-activity-empty">
                                No activity yet.
                            </li>
                        {/if}

                        {#each ticket.comments as comment, index (`${comment.timestamp}-${index}`)}
                            <li class="ticket-panel-activity-item">
                                <span
                                    class="ticket-panel-avatar"
                                    aria-hidden="true"
                                    >{comment.author
                                        .slice(0, 2)
                                        .toUpperCase()}</span
                                >
                                <span class="ticket-panel-activity-content">
                                    <span>
                                        <strong>{comment.author}</strong>
                                        {comment.body}
                                    </span>
                                    <small
                                        >{new Date(
                                            comment.timestamp,
                                        ).toLocaleString()}</small
                                    >
                                </span>
                            </li>
                        {/each}
                    </ul>

                    <div role="group" class="ticket-panel-comment-form">
                        <input
                            type="text"
                            placeholder="Add a comment"
                            bind:value={newComment}
                        />
                        <button type="button" onclick={handleAddComment}
                            >Add</button
                        >
                    </div>
                </section>
            </div>
        {/snippet}
    </AppDrawer>
{/if}

<style>
    .ticket-panel-header {
        min-width: 0;
    }

    .ticket-panel-header small {
        display: inline-flex;
        align-items: center;
        gap: calc(var(--pico-spacing) * 0.25);
        color: var(--pico-muted-color);
        font-family: var(--pico-font-family-monospace);
        font-size: var(--pico-font-size-small);
    }

    .ticket-panel-id {
        color: var(--pico-primary);
    }

    .ticket-panel-body {
        padding: var(--pico-spacing);
        display: flex;
        flex-direction: column;
        gap: var(--pico-spacing);
    }

    .ticket-panel-block {
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.35);
        margin: 0;
    }

    .ticket-panel-block > small {
        color: var(--pico-muted-color);
        font-size: calc(var(--pico-font-size-small) * 0.85);
        text-transform: uppercase;
        letter-spacing: 0.07em;
    }

    .ticket-panel-block dl {
        margin: 0;
    }

    .ticket-panel-block dt {
        color: var(--pico-muted-color);
        font-size: calc(var(--pico-font-size-small) * 0.85);
    }

    .ticket-panel-block dd {
        margin: 0 0 calc(var(--pico-spacing) * 0.6);
    }

    .ticket-panel-activity-list {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .ticket-panel-activity-item {
        display: flex;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: calc(var(--pico-spacing) * 0.4) 0;
        border-bottom: var(--pico-border-width) solid
            var(--pico-muted-border-color);
    }

    .ticket-panel-avatar {
        width: calc(var(--pico-spacing) * 1.5);
        height: calc(var(--pico-spacing) * 1.5);
        border-radius: 50%;
        background: var(--pico-card-sectioning-background-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: calc(var(--pico-font-size-small) * 0.75);
        font-weight: var(--pico-font-weight-bold);
        flex-shrink: 0;
    }

    .ticket-panel-activity-content {
        display: flex;
        flex-direction: column;
        gap: calc(var(--pico-spacing) * 0.15);
    }

    .ticket-panel-activity-content strong {
        color: var(--pico-color);
    }

    .ticket-panel-activity-content span {
        color: var(--pico-muted-color);
        font-size: var(--pico-font-size-small);
    }

    .ticket-panel-activity-content small {
        color: var(--pico-muted-color);
        font-family: var(--pico-font-family-monospace);
        font-size: calc(var(--pico-font-size-small) * 0.82);
    }

    .ticket-panel-activity-empty {
        color: var(--pico-muted-color);
        font-size: var(--pico-font-size-small);
        padding: calc(var(--pico-spacing) * 0.5) 0;
    }

    .ticket-panel-comment-form {
        margin-top: calc(var(--pico-spacing) * 0.4);
    }

    .ticket-panel-comment-form button {
        margin: 0;
    }
</style>

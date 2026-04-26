<!-- src/lib/components/app/kanban/kanban-ticket-card.svelte -->
<script lang="ts">
    import {
        Tag,
        OverflowMenu,
        OverflowMenuItem,
    } from "carbon-components-svelte";
    import { User, Calendar, ChatBot, Draggable } from "carbon-icons-svelte";

    type Ticket = {
        id: number;
        title: string;
        description?: string;
        priority: "low" | "medium" | "high" | "critical";
        assignee?: string;
        dueDate?: string;
        tags?: string[];
        commentCount?: number;
    };

    let {
        ticket,
        onEdit,
        onDelete,
    }: {
        ticket: Ticket;
        onEdit?: (ticket: Ticket) => void;
        onDelete?: (id: number) => void;
    } = $props();

    const priorityMap: Record<
        Ticket["priority"],
        { color: string; label: string }
    > = {
        low: { color: "green", label: "Low" },
        medium: { color: "teal", label: "Medium" },
        high: { color: "magenta", label: "High" },
        critical: { color: "red", label: "Critical" },
    };
</script>

<article class="ticket-card">
    <!-- Drag handle -->
    <div class="drag-handle" aria-hidden="true">
        <Draggable size={16} />
    </div>

    <!-- Priority stripe -->
    <div class="priority-stripe priority-stripe--{ticket.priority}"></div>

    <div class="ticket-body">
        <!-- Header row -->
        <div class="ticket-header">
            <span class="ticket-id">#{ticket.id}</span>
            <div class="ticket-actions">
                <OverflowMenu size="sm" flipped>
                    <OverflowMenuItem
                        text="Edit"
                        on:click={() => onEdit?.(ticket)}
                    />
                    <OverflowMenuItem
                        text="Delete"
                        danger
                        on:click={() => onDelete?.(ticket.id)}
                    />
                </OverflowMenu>
            </div>
        </div>

        <!-- Title -->
        <h4 class="ticket-title">{ticket.title}</h4>

        <!-- Description -->
        {#if ticket.description}
            <p class="ticket-desc">{ticket.description}</p>
        {/if}

        <!-- Tags -->
        {#if ticket.tags?.length}
            <div class="ticket-tags">
                {#each ticket.tags as tag}
                    <Tag size="sm" type="cool-gray">{tag}</Tag>
                {/each}
            </div>
        {/if}

        <!-- Footer -->
        <div class="ticket-footer">
            <Tag size="sm" type={priorityMap[ticket.priority].color}>
                {priorityMap[ticket.priority].label}
            </Tag>

            <div class="ticket-meta">
                {#if ticket.commentCount !== undefined}
                    <span class="meta-item">
                        <ChatBot size={14} />
                        <span>{ticket.commentCount}</span>
                    </span>
                {/if}
                {#if ticket.dueDate}
                    <span class="meta-item">
                        <Calendar size={14} />
                        <span>{ticket.dueDate}</span>
                    </span>
                {/if}
                {#if ticket.assignee}
                    <span class="meta-item">
                        <User size={14} />
                        <span>{ticket.assignee}</span>
                    </span>
                {/if}
            </div>
        </div>
    </div>
</article>

<style>
    .ticket-card {
        position: relative;
        display: flex;
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 2px;
        overflow: hidden;
        transition:
            box-shadow 0.15s ease,
            border-color 0.15s ease;
        cursor: grab;
    }

    .ticket-card:active {
        cursor: grabbing;
    }

    .ticket-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: var(--cds-interactive-03);
    }

    /* Drag handle — hidden until hover */
    .drag-handle {
        position: absolute;
        top: 0.5rem;
        right: 2rem;
        color: var(--cds-text-placeholder);
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
    }

    .ticket-card:hover .drag-handle {
        opacity: 1;
    }

    /* Priority left-border stripe */
    .priority-stripe {
        width: 4px;
        flex-shrink: 0;
    }

    .priority-stripe--low {
        background: var(--cds-support-02);
    }
    .priority-stripe--medium {
        background: var(--cds-support-04);
    }
    .priority-stripe--high {
        background: #e5399e;
    }
    .priority-stripe--critical {
        background: var(--cds-support-01);
    }

    .ticket-body {
        flex: 1;
        padding: 0.75rem 0.75rem 0.75rem 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        min-width: 0;
    }

    .ticket-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ticket-id {
        font-size: 0.6875rem;
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        color: var(--cds-text-helper);
        letter-spacing: 0.02em;
    }

    .ticket-actions {
        margin-right: -0.5rem;
        margin-top: -0.25rem;
    }

    .ticket-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--cds-text-01);
        line-height: 1.3;
        margin: 0;
        word-break: break-word;
    }

    .ticket-desc {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        line-height: 1.4;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .ticket-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .ticket-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.25rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .ticket-meta {
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6875rem;
        color: var(--cds-text-helper);
    }
</style>

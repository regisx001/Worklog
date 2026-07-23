<!-- src/lib/components/app/kanban/kanban-ticket-card.svelte -->
<script lang="ts">
    import {
        Tag,
        OverflowMenu,
        OverflowMenuItem,
        ContextMenu,
        ContextMenuOption,
        ContextMenuDivider,
    } from "carbon-components-svelte";
    import {
        Calendar,
        ChatBot,
        Draggable,
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
        Bookmark,
        Checkbox,
        List,
        Warning,
        ColorPalette,
        Document,
    } from "carbon-icons-svelte";
    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        type TicketType,
        TICKET_TYPE_CONFIG,
        TICKET_PRIORITY_CONFIG,
    } from "$lib/components/app/types";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import * as m from "$lib/paraglide/messages.js";

    let {
        ticket,
        onEdit,
        onDelete,
        onStatusChange,
        onPreview,
    }: {
        ticket: Ticket;
        onEdit?: (ticket: Ticket) => void;
        onDelete?: (id: string) => void;
        onStatusChange?: (id: string, status: TicketStatus) => void;
        onPreview?: (ticket: Ticket) => void;
    } = $props();

    const context = getWorkspaceShellContext();
    const ticketTypesApi = context?.ticketTypesApi;

    // Carbon icon map for fallback/default icons
    const typeIconMap: Record<string, any> = {
        feature: StarFilled,
        bug: Debug,
        chore: SettingsAdjust,
        improvement: ChartLineSmooth,
        epic: Lightning,
        spike: Explore,
        story: Bookmark,
        task: Checkbox,
        subtask: List,
        incident: Warning,
        design: ColorPalette,
        documentation: Document,
    };

    // Carbon icon map for priorities
    const priorityIconMap: Record<TicketPriority, any> = {
        p1: ArrowUp,
        p2: ArrowRight,
        p3: ArrowDown,
    };

    const customType = $derived(
        ticketTypesApi?.types?.find((t) => t.id === ticket.ticket_type)
    );

    const typeConfig = $derived({
        label: customType?.name ?? ticket.ticket_type,
        color: customType?.color ?? "#525252",
    });

    const TypeIcon = $derived(
        (customType?.icon && typeIconMap[customType.icon]) || 
        typeIconMap[ticket.ticket_type] || 
        Bookmark
    );

    const priorityConfig = $derived(TICKET_PRIORITY_CONFIG[ticket.priority]);
    const PriorityIcon = $derived(priorityIconMap[ticket.priority]);

    let cardElement = $state<HTMLElement>();

    const isOverdue = $derived.by(() => {
        if (!ticket.due_date || ticket.status === "done") return false;
        
        // Strip time from both dates for accurate day comparison
        const due = new Date(ticket.due_date);
        due.setHours(0, 0, 0, 0);
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        return due < now;
    });

    function copyToClipboard(text: string) {
        if (navigator.clipboard) {
            void navigator.clipboard.writeText(text);
        }
    }

    let isVisible = $state(false);

    function setupVisibility(node: HTMLElement) {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    isVisible = true;
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );
        observer.observe(node);
        return {
            destroy() {
                observer.disconnect();
            },
        };
    }
</script>

<article 
    class="ticket-card" 
    bind:this={cardElement}
    use:setupVisibility
>
    {#if isVisible}
        <ContextMenu target={cardElement ? [cardElement] : []}>
            <ContextMenuOption
                labelText={m.ticket_ctx_copy_id()}
                icon={CopyFile}
                on:click={() => copyToClipboard(ticket.id)}
            />
            <ContextMenuOption
                labelText={m.ticket_ctx_copy_title()}
                icon={CopyFile}
                on:click={() => copyToClipboard(ticket.title)}
            />
            <ContextMenuDivider />
            <ContextMenuOption labelText={m.ticket_ctx_move_to()} icon={ArrowRight}>
                <ContextMenuOption
                    labelText={m.status_backlog()}
                    on:click={() => onStatusChange?.(ticket.id, "backlog")}
                />
                <ContextMenuOption
                    labelText={m.status_todo()}
                    on:click={() => onStatusChange?.(ticket.id, "todo")}
                />
                <ContextMenuOption
                    labelText={m.status_in_progress()}
                    on:click={() => onStatusChange?.(ticket.id, "in_progress")}
                />
                <ContextMenuOption
                    labelText={m.status_done()}
                    on:click={() => onStatusChange?.(ticket.id, "done")}
                />
            </ContextMenuOption>
            <ContextMenuDivider />
            <ContextMenuOption
                labelText={m.ticket_ctx_edit()}
                icon={Edit}
                on:click={() => onEdit?.(ticket)}
            />
            <ContextMenuOption
                kind="danger"
                labelText={m.ticket_ctx_delete()}
                icon={TrashCan}
                on:click={() => onDelete?.(ticket.id)}
            />
        </ContextMenu>

        <!-- Drag handle -->
        <div class="drag-handle" aria-hidden="true">
            <Draggable size={16} />
        </div>

        <!-- Priority stripe -->
        <div class="priority-stripe priority-stripe--{ticket.priority}"></div>

    <div
            class="ticket-body"
            role="button"
            tabindex="0"
            aria-label={m.ticket_preview_aria({ title: ticket.title })}
            onclick={() => onPreview?.(ticket)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPreview?.(ticket); }}
        >
            <!-- Header row -->
            <div class="ticket-header">
                <span class="ticket-id">#{ticket.id}</span>
                <div
                    class="ticket-actions"
                    role="presentation"
                    onclick={(e) => e.stopPropagation()}
                    onkeydown={(e) => e.stopPropagation()}
                >
                    <OverflowMenu size="sm" flipped>
                        <OverflowMenuItem
                            text={m.ticket_ctx_edit()}
                            on:click={() => onEdit?.(ticket)}
                        />
                        <OverflowMenuItem
                            text={m.ticket_ctx_delete()}
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
            {#if ticket.labels?.length}
                <div class="ticket-tags">
                    {#each ticket.labels as tag}
                        <Tag size="sm" type="cool-gray">{tag}</Tag>
                    {/each}
                </div>
            {/if}

            <!-- Footer -->
            <div class="ticket-footer">
                <div class="ticket-badges">
                    <Tag size="sm" type={priorityConfig.tagColor}>
                        <span class="tag-with-icon">
                            <PriorityIcon size={12} />
                            {priorityConfig.label}
                        </span>
                    </Tag>
                    <Tag 
                        size="sm" 
                        style="background-color: {typeConfig.color}; color: white;"
                    >
                        <span class="tag-with-icon">
                            <TypeIcon size={12} />
                            {typeConfig.label}
                        </span>
                    </Tag>
                </div>

                <div class="ticket-meta">
                    {#if ticket.comments?.length}
                        <span class="meta-item">
                            <ChatBot size={14} />
                            <span>{ticket.comments.length}</span>
                        </span>
                    {/if}
                    {#if ticket.due_date}
                        <span class="meta-item" class:overdue={isOverdue}>
                            <Calendar size={14} />
                            <span>{ticket.due_date}</span>
                        </span>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <div class="ticket-skeleton"></div>
    {/if}
</article>

<style>
    .ticket-card {
        position: relative;
        display: flex;
        margin: 0;
        padding: 0;
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
        padding: 0.5rem;
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

    .priority-stripe--p3 {
        background: var(--cds-support-02);
    }
    .priority-stripe--p2 {
        background: var(--cds-support-04);
    }
    .priority-stripe--p1 {
        background: var(--cds-support-01);
    }

    .ticket-body {
        flex: 1;
        padding: 0.75rem 0.75rem 0.75rem 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        min-width: 0;
        /* clickable for preview */
        cursor: pointer;
        background: none;
        border: none;
        text-align: left;
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
        line-clamp: 2;
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

    .ticket-badges {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .tag-with-icon {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    .tag-with-icon :global(svg) {
        flex-shrink: 0;
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

    .meta-item.overdue {
        color: var(--cds-support-01);
        font-weight: 500;
    }

    .ticket-skeleton {
        height: 120px;
        width: 100%;
        background: var(--cds-ui-01);
    }
</style>

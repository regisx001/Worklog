<script lang="ts">
    import { Tag } from "carbon-components-svelte";
    import { Calendar } from "carbon-icons-svelte";
    import { getGanttState } from "./gantt-state.svelte";
    import {
        TICKET_STATUS_CONFIG,
        TICKET_PRIORITY_CONFIG,
    } from "$lib/components/app/types";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import * as m from "$lib/paraglide/messages.js";
    import { formatDate } from "$lib/utils/date-format";

    const state = getGanttState();
    const context = getWorkspaceShellContext();
    const ticketTypesApi = context?.ticketTypesApi;
</script>

{#if state.hoveredTicket}
    {@const customType = ticketTypesApi?.types?.find(
        (t) => t.id === state.hoveredTicket?.ticket_type,
    )}
    <div
        class="gantt-tip"
        style="left:{state.tooltipX + 14}px;top:{state.tooltipY - 8}px"
    >
        <strong>{state.hoveredTicket.title}</strong>
        <div class="tip-row">
            <span class="tip-label">{m.preview_status()}</span>
            <Tag type="gray" size="sm"
                >{TICKET_STATUS_CONFIG[state.hoveredTicket.status].label}</Tag
            >
        </div>
        <div class="tip-row">
            <span class="tip-label">{m.modal_type()}</span>
            <Tag
                style="background-color: {customType?.color ||
                    '#525252'}; color: white;"
                size="sm"
            >
                {customType?.name || state.hoveredTicket.ticket_type}
            </Tag>
        </div>
        <div class="tip-row">
            <span class="tip-label">{m.modal_priority()}</span>
            <Tag
                type={TICKET_PRIORITY_CONFIG[
                    state.hoveredTicket
                        .priority as keyof typeof TICKET_PRIORITY_CONFIG
                ]?.tagColor || "blue"}
                size="sm"
            >
                {TICKET_PRIORITY_CONFIG[
                    state.hoveredTicket
                        .priority as keyof typeof TICKET_PRIORITY_CONFIG
                ]?.label}
            </Tag>
        </div>
        <div class="tip-row">
            <span class="tip-label">{m.board_tab_timeline()}</span>
            <span
                class="tip-val"
                class:tip-overdue={state.isOverdue(state.hoveredTicket)}
                >{state.getDaysLeft(state.hoveredTicket)}</span
            >
        </div>
        {#if state.hoveredTicket.start_date}
            <div class="tip-row">
                <Calendar size={12} />
                <span class="tip-label">{m.gantt_start()}</span>
                <span class="tip-val"
                    >{formatDate(new Date(state.hoveredTicket.start_date), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}</span
                >
            </div>
        {/if}
        {#if state.hoveredTicket.due_date}
            <div class="tip-row">
                <Calendar size={12} />
                <span class="tip-label">{m.gantt_due()}</span>
                <span class="tip-val"
                    >{formatDate(new Date(state.hoveredTicket.due_date), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}</span
                >
            </div>
        {/if}
    </div>
{/if}

<style>
    .gantt-tip {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 6px;
        padding: 0.625rem 0.75rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        min-width: 180px;
        max-width: 280px;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    .gantt-tip strong {
        font-size: 0.8125rem;
        color: var(--cds-text-01);
    }
    .tip-row {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }
    .tip-label {
        font-size: 0.6875rem;
        color: var(--cds-text-02);
        min-width: 48px;
    }
    .tip-val {
        font-size: 0.75rem;
        color: var(--cds-text-01);
    }
    .tip-overdue {
        color: var(--cds-support-01) !important;
        font-weight: 600;
    }
    .tip-row :global(svg) {
        color: var(--cds-text-02);
        flex-shrink: 0;
    }
</style>

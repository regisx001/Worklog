<script lang="ts">
    import { ChevronLeft, ChevronRight } from "carbon-icons-svelte";
    import { getCalendarState } from "./calendar-state.svelte";
    import * as m from "$lib/paraglide/messages.js";

    const state = getCalendarState();
</script>

<div class="cal-header">
    <div class="cal-nav">
        <button class="nav-btn" onclick={() => state.prevPeriod()} aria-label={m.calendar_previous_period()}>
            <ChevronLeft size={16} />
        </button>
        <h2 class="cal-title">{state.displayTitle}</h2>
        <button class="nav-btn" onclick={() => state.nextPeriod()} aria-label={m.calendar_next_period()}>
            <ChevronRight size={16} />
        </button>
        <button class="today-btn" onclick={() => state.goToToday()}>{m.calendar_today()}</button>
    </div>

    <div class="view-toggle" role="group" aria-label={m.calendar_view()}>
        <button
            class="toggle-btn"
            class:active={state.viewMode === "month"}
            onclick={() => (state.viewMode = "month")}
        >{m.calendar_month()}</button>
        <button
            class="toggle-btn"
            class:active={state.viewMode === "week"}
            onclick={() => (state.viewMode = "week")}
        >{m.calendar_week()}</button>
    </div>
</div>

<style>
    .cal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 1rem;
        border-bottom: 1px solid var(--cds-ui-03);
        flex-shrink: 0;
        gap: 1rem;
        background: var(--cds-ui-background);
    }

    .cal-nav {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .cal-title {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--cds-text-01);
        min-width: 10rem;
        text-align: center;
    }

    .nav-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 4px;
        color: var(--cds-text-02);
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
    }

    .nav-btn:hover {
        background: var(--cds-hover-ui);
        color: var(--cds-text-01);
    }

    .today-btn {
        all: unset;
        margin-left: 0.5rem;
        padding: 0.25rem 0.75rem;
        font-size: 0.8125rem;
        border: 1px solid var(--cds-ui-03);
        border-radius: 4px;
        color: var(--cds-text-02);
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        white-space: nowrap;
    }

    .today-btn:hover {
        background: var(--cds-hover-ui);
        color: var(--cds-text-01);
        border-color: var(--cds-ui-04);
    }

    .view-toggle {
        display: flex;
        border: 1px solid var(--cds-ui-03);
        border-radius: 4px;
        overflow: hidden;
    }

    .toggle-btn {
        all: unset;
        padding: 0.25rem 0.75rem;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
        white-space: nowrap;
    }

    .toggle-btn + .toggle-btn {
        border-left: 1px solid var(--cds-ui-03);
    }

    .toggle-btn:hover {
        background: var(--cds-hover-ui);
        color: var(--cds-text-01);
    }

    .toggle-btn.active {
        background: var(--cds-interactive-01, #0f62fe);
        color: #fff;
    }
</style>

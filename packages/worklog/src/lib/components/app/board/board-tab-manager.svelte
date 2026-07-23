<script lang="ts">
    import {
        Settings,
        Dashboard,
        Table,
        ChartBarFloating,
        Calendar,
        Document,
    } from "carbon-icons-svelte";
    import type { TabType } from "$lib/components/app/types";
    import { ALL_BOARD_TABS } from "$lib/components/app/types";
    import * as m from "$lib/paraglide/messages.js";

    interface Props {
        enabledTabs: TabType[];
        onToggleTab: (tab: TabType) => void;
    }

    let { enabledTabs, onToggleTab }: Props = $props();

    let isOpen = $state(false);
    let menuEl = $state<HTMLElement | null>(null);
    let triggerEl = $state<HTMLButtonElement | null>(null);

    // Tab display config
    const TAB_LABELS: Record<TabType, () => string> = {
        kanban: () => m.board_tab_board(),
        table: () => m.board_tab_table(),
        timeline: () => m.board_tab_timeline(),
        calendar: () => m.board_tab_calendar(),
        docs: () => m.board_tab_docs(),
    };

    function toggle() {
        isOpen = !isOpen;
    }

    function handleToggleTab(tab: TabType) {
        onToggleTab(tab);
    }

    function handleClickOutside(e: MouseEvent) {
        if (
            isOpen &&
            menuEl &&
            !menuEl.contains(e.target as Node) &&
            triggerEl &&
            !triggerEl.contains(e.target as Node)
        ) {
            isOpen = false;
        }
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            return () => {
                document.removeEventListener("click", handleClickOutside);
            };
        }
    });

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && isOpen) {
            isOpen = false;
            triggerEl?.focus();
        }
    }
</script>

<div class="tab-manager-wrap">
    <button
        bind:this={triggerEl}
        class="tab-manager-trigger"
        onclick={toggle}
        aria-label={m.board_tab_manage()}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={m.board_tab_manage()}
    >
        <Settings size={16} />
    </button>

    {#if isOpen}
        <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
        <div
            bind:this={menuEl}
            class="tab-manager-menu"
            role="menu"
            tabindex="-1"
            onkeydown={handleKeydown}
        >
            <div class="tab-manager-header">
                {m.board_tab_manage()}
            </div>
            <div class="tab-manager-list">
                {#each ALL_BOARD_TABS as tab}
                    <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                    <div
                        class="tab-manager-item"
                        class:tab-manager-item--disabled={tab === "kanban"}
                        role="menuitemcheckbox"
                        aria-checked={enabledTabs.includes(tab)}
                        onclick={() => {
                            if (tab !== "kanban") handleToggleTab(tab);
                        }}
                        onkeydown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (tab !== "kanban") handleToggleTab(tab);
                            }
                        }}
                        tabindex={tab === "kanban" ? -1 : 0}
                    >
                        <span class="tab-manager-item-icon">
                            {#if tab === "kanban"}
                                <Dashboard size={16} />
                            {:else if tab === "table"}
                                <Table size={16} />
                            {:else if tab === "timeline"}
                                <ChartBarFloating size={16} />
                            {:else if tab === "calendar"}
                                <Calendar size={16} />
                            {:else if tab === "docs"}
                                <Document size={16} />
                            {/if}
                        </span>
                        <span class="tab-manager-item-label"
                            >{TAB_LABELS[tab]()}</span
                        >
                        <input
                            type="checkbox"
                            checked={enabledTabs.includes(tab)}
                            disabled={tab === "kanban"}
                            tabindex="-1"
                            aria-hidden="true"
                        />
                        {#if tab === "kanban"}
                            <span
                                class="tab-manager-locked"
                                title={m.board_tab_always_visible()}
                            >
                                🔒
                            </span>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .tab-manager-wrap {
        position: relative;
        display: flex;
        align-items: stretch;
    }

    .tab-manager-trigger {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 0.5rem;
        cursor: pointer;
        color: var(--cds-text-02);
        transition:
            color 0.15s ease,
            background 0.15s ease;
    }

    .tab-manager-trigger:hover {
        color: var(--cds-text-01);
        background: var(--cds-hover-ui);
    }

    .tab-manager-trigger:focus-visible {
        outline: 2px solid var(--cds-focus, #0f62fe);
        outline-offset: -2px;
    }

    .tab-manager-menu {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 100;
        min-width: 180px;
        background: var(--cds-ui-01, #161616);
        border: 1px solid var(--cds-ui-03, #393939);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: tab-manager-fade-in 0.1s ease-out;
    }

    @keyframes tab-manager-fade-in {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .tab-manager-header {
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--cds-text-02, #c6c6c6);
        border-bottom: 1px solid var(--cds-ui-03, #393939);
    }

    .tab-manager-list {
        padding: 0.25rem 0;
    }

    .tab-manager-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01, #f4f4f4);
        cursor: pointer;
        transition: background 0.1s ease;
        user-select: none;
    }

    .tab-manager-item:hover {
        background: var(--cds-hover-ui, #353535);
    }

    .tab-manager-item--disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .tab-manager-item--disabled:hover {
        background: transparent;
    }

    .tab-manager-item-icon {
        width: 1rem;
        height: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .tab-manager-item-icon :global(svg) {
        display: block;
    }

    .tab-manager-item-label {
        flex: 1;
    }

    .tab-manager-item input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        accent-color: var(--cds-interactive-01, #0f62fe);
        flex-shrink: 0;
    }

    .tab-manager-locked {
        font-size: 0.625rem;
        opacity: 0.5;
        flex-shrink: 0;
    }
</style>

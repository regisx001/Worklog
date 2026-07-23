<!-- src/lib/components/app/layout/command-palette/command-palette.svelte -->
<script lang="ts">
    import { Search, ArrowRight, Keyboard } from "carbon-icons-svelte";
    import { page } from "$app/stores";
    import {
        getCommandPalette,
        fuzzyMatch,
        highlightMatches,
    } from "$lib/hooks/command-palette.svelte";
    import type { PaletteMode } from "$lib/hooks/command-palette.svelte";
    import type { CommandAction } from "$lib/components/app/types";
    import * as m from "$lib/paraglide/messages.js";

    const palette = getCommandPalette();

    // ── Mode detection ─────────────────────────────────────────────────────
    // Determined reactively from the first character of the query string.
    const activeMode = $derived.by<PaletteMode>(() => {
        const q = palette.query;
        if (q.startsWith("?")) return "shortcuts";
        if (q.startsWith("#")) return "boards";
        if (q.startsWith("/")) return "navigate";
        return "commands";
    });

    // Clean query with mode prefix stripped
    const searchQuery = $derived.by<string>(() => {
        const q = palette.query;
        const first = q[0];
        if (first === "?" || first === "#" || first === "/") {
            return q.slice(1).trimStart();
        }
        return q;
    });

    // ── Context: current route ─────────────────────────────────────────────
    const currentPath = $derived($page.url.pathname);

    const routeContext = $derived.by<string>(() => {
        const path = currentPath;
        if (path === "/") return "home";
        if (path.startsWith("/workspace/settings")) return "settings";
        if (path.startsWith("/workspace/calendar")) return "calendar";
        if (path.startsWith("/workspace/overview")) return "overview";
        if (path.startsWith("/workspace/")) {
            const parts = path.split("/").filter(Boolean);
            if (parts.length >= 2 && parts[1].length > 0) return "board-detail";
            return "boards-list";
        }
        return "default";
    });

    // Priority boost per route context — command IDs that should rank higher
    const contextPriorityIds: Record<string, Set<string>> = {
        "boards-list": new Set(["create-board"]),
        "board-detail": new Set(["create-ticket"]),
        calendar: new Set(["create-ticket"]),
        overview: new Set(["go-to-workspace", "export-data"]),
        settings: new Set(["go-to-workspace"]),
        home: new Set(["open-workspace"]),
    };

    // ── Filtered + scored actions ──────────────────────────────────────────
    interface ScoredAction {
        action: CommandAction;
        score: number;
        labelIndices: number[];
        subtitleIndices: number[];
    }

    const CATEGORY_ORDER: Record<string, number> = {
        Application: 1,
        Navigation: 2,
        Workspace: 3,
        Boards: 4,
        Actions: 5,
        Commands: 6,
    };

    // Mode-specific category allowlist
    const MODE_CATEGORIES: Record<PaletteMode, Set<string> | null> = {
        commands: null, // all categories
        shortcuts: null, // all categories (reference view)
        boards: new Set(["Boards", "Workspace"]),
        navigate: new Set(["Navigation"]),
    };

    const scored = $derived.by<ScoredAction[]>(() => {
        const all = palette.actions;
        const mode = activeMode;
        const query = searchQuery.trim().toLowerCase();
        const ctxPriorities = contextPriorityIds[routeContext] ?? new Set();

        // Mode-based category filtering
        const allowedCats = MODE_CATEGORIES[mode];

        // In shortcuts mode, show ALL actions unsorted (reference list)
        if (mode === "shortcuts") {
            return all.map((action) => ({
                action,
                score: 0,
                labelIndices: [],
                subtitleIndices: [],
            }));
        }

        const results: ScoredAction[] = [];

        for (const action of all) {
            // Apply mode category filter
            if (allowedCats !== null) {
                const cat = action.category ?? "Commands";
                if (!allowedCats.has(cat)) continue;
            }

            // Fuzzy match against label, subtitle, shortcut
            const labelMatch = fuzzyMatch(query, action.label);
            const subMatch = query ? fuzzyMatch(query, action.subtitle) : null;
            const scMatch = query ? fuzzyMatch(query, action.shortcut) : null;

            const candidates = [labelMatch, subMatch, scMatch].filter(
                (m): m is NonNullable<typeof m> => m !== null,
            );

            if (query && candidates.length === 0) continue;

            // Best score across all matched fields
            const best = candidates.reduce(
                (best, c) => (c.score > best.score ? c : best),
                candidates[0] ?? { score: 0, indices: [] },
            );

            // Context-aware priority boost: promoted commands get +200
            const contextBoost =
                query === "" && ctxPriorities.has(action.id) ? 200 : 0;

            results.push({
                action,
                score: best.score + contextBoost,
                labelIndices: labelMatch?.indices ?? [],
                subtitleIndices: subMatch?.indices ?? [],
            });
        }

        // Sort: by category order (so arrow-keys follow visual grouping),
        // then by score (desc) within each category, then original position.
        results.sort((a, b) => {
            const catA = CATEGORY_ORDER[a.action.category ?? "Commands"] ?? 99;
            const catB = CATEGORY_ORDER[b.action.category ?? "Commands"] ?? 99;
            if (catA !== catB) return catA - catB;
            if (a.score !== b.score) return b.score - a.score;
            // Stable sort: preserve original order for equal scores
            const idxA = all.indexOf(a.action);
            const idxB = all.indexOf(b.action);
            return idxA - idxB;
        });

        return results;
    });

    // ── Grouped by category ────────────────────────────────────────────────
    interface GroupEntry {
        category: string;
        actions: { action: CommandAction; flatIndex: number }[];
    }

    const grouped = $derived.by(() => {
        const map = new Map<
            string,
            { action: CommandAction; flatIndex: number }[]
        >();
        scored.forEach(({ action }, i) => {
            const cat = action.category ?? "Commands";
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push({ action, flatIndex: i });
        });
        const result: GroupEntry[] = [];
        for (const [category, actions] of map.entries()) {
            result.push({ category, actions });
        }
        return result;
    });

    const filtered = $derived(scored.map((s) => s.action));

    // ── Mode label map ─────────────────────────────────────────────────────
    function modeLabel(mode: PaletteMode): { badge: string; hint: string } {
        switch (mode) {
            case "shortcuts":
                return { badge: "?", hint: m.palette_mode_shortcuts_hint() };
            case "boards":
                return { badge: "#", hint: m.palette_mode_boards_hint() };
            case "navigate":
                return { badge: "/", hint: m.palette_mode_navigate_hint() };
            default:
                return { badge: "", hint: m.palette_mode_commands_hint() };
        }
    }

    function categoryLabel(category: string): string {
        switch (category) {
            case "Application":
                return m.command_category_application();
            case "Navigation":
                return m.command_category_navigation();
            case "Workspace":
                return m.command_category_workspace();
            case "Boards":
                return m.command_category_boards();
            case "Actions":
                return m.command_category_actions();
            case "Commands":
                return m.command_category_commands();
            default:
                return category;
        }
    }

    // ── Resolve match data for a flat index ────────────────────────────────
    function getMatchData(flatIndex: number) {
        return scored[flatIndex] ?? null;
    }

    // ── Keyboard navigation ────────────────────────────────────────────────
    function handleKeydown(e: KeyboardEvent) {
        if (!palette.isOpen) return;

        if (e.key === "Escape") {
            e.preventDefault();
            // If in a sub-mode, return to commands mode first
            if (activeMode !== "commands") {
                palette.setQuery("");
                palette.setMode("commands");
                return;
            }
            palette.close();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            palette.setSelectedIndex(
                Math.min(palette.selectedIndex + 1, filtered.length - 1),
            );
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            palette.setSelectedIndex(Math.max(palette.selectedIndex - 1, 0));
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            // In shortcuts mode, Enter does nothing (reference view)
            if (activeMode === "shortcuts") return;
            const action = filtered[palette.selectedIndex];
            if (action) {
                palette.runAction(action);
            }
            return;
        }
    }

    // ── Click outside to close ─────────────────────────────────────────────
    function handleBackdropClick(e: MouseEvent) {
        if (
            (e.target as HTMLElement)?.classList?.contains("palette-backdrop")
        ) {
            palette.close();
        }
    }

    // ── Keep selected index in bounds ──────────────────────────────────────
    $effect(() => {
        if (palette.selectedIndex >= filtered.length) {
            palette.setSelectedIndex(Math.max(0, filtered.length - 1));
        }
    });

    // ── Focus input when opened ────────────────────────────────────────────
    let inputRef = $state<HTMLInputElement | null>(null);

    $effect(() => {
        if (palette.isOpen && inputRef) {
            requestAnimationFrame(() => {
                inputRef?.focus();
            });
        }
    });

    // ── Scroll selected item into view ─────────────────────────────────────
    $effect(() => {
        if (!palette.isOpen) return;
        const idx = palette.selectedIndex;
        const el = document.getElementById(`palette-item-${idx}`);
        el?.scrollIntoView({ block: "nearest" });
    });

    function formatShortcut(shortcut: string): string[] {
        if (!shortcut) return [];
        return shortcut.split("+").map((k) => k.trim());
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if palette.isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="palette-backdrop" onclick={handleBackdropClick}>
        <div
            class="palette-container"
            role="dialog"
            aria-label={m.palette_aria_label()}
        >
            <!-- Search input -->
            <div class="palette-search">
                <Search size={20} class="palette-search-icon" />
                {#if activeMode !== "commands"}
                    <span class="palette-mode-badge"
                        >{modeLabel(activeMode).badge}</span
                    >
                {/if}
                <input
                    bind:this={inputRef}
                    type="text"
                    class="palette-input"
                    class:palette-input--has-mode={activeMode !== "commands"}
                    placeholder={activeMode === "commands"
                        ? m.palette_placeholder()
                        : modeLabel(activeMode).hint}
                    value={palette.query}
                    oninput={(e) =>
                        palette.setQuery(
                            (e.currentTarget as HTMLInputElement).value,
                        )}
                    autocomplete="off"
                    spellcheck="false"
                />
                <kbd class="palette-esc-badge">ESC</kbd>
            </div>

            <!-- Results list (grouped) -->
            <div class="palette-results" role="listbox">
                {#if filtered.length === 0}
                    <div class="palette-empty">
                        <span>{m.palette_no_commands()}</span>
                    </div>
                {:else}
                    {#each grouped as group}
                        <div class="palette-group">
                            <div class="palette-group-header">
                                {categoryLabel(group.category)}
                            </div>
                            {#each group.actions as { action, flatIndex } (action.id)}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <div
                                    id="palette-item-{flatIndex}"
                                    class="palette-item"
                                    class:palette-item--selected={flatIndex ===
                                        palette.selectedIndex}
                                    role="option"
                                    tabindex="-1"
                                    aria-selected={flatIndex ===
                                        palette.selectedIndex}
                                    onmouseenter={() =>
                                        palette.setSelectedIndex(flatIndex)}
                                    onclick={() => palette.runAction(action)}
                                >
                                    <div class="palette-item-left">
                                        {#if action.icon}
                                            {@const Icon = action.icon}
                                            <Icon
                                                size={16}
                                                class="palette-item-icon"
                                            />
                                        {:else}
                                            <ArrowRight
                                                size={16}
                                                class="palette-item-icon"
                                            />
                                        {/if}
                                        <div class="palette-item-text">
                                            <span class="palette-item-label">
                                                {#if activeMode !== "shortcuts" && searchQuery.trim()}
                                                    {@const md =
                                                        getMatchData(flatIndex)}
                                                    {#if md}
                                                        {@html highlightMatches(
                                                            action.label,
                                                            md.labelIndices,
                                                        )}
                                                    {:else}
                                                        {action.label}
                                                    {/if}
                                                {:else}
                                                    {action.label}
                                                {/if}
                                            </span>
                                            {#if action.subtitle}
                                                <span
                                                    class="palette-item-subtitle"
                                                >
                                                    {#if activeMode !== "shortcuts" && searchQuery.trim()}
                                                        {@const md =
                                                            getMatchData(
                                                                flatIndex,
                                                            )}
                                                        {#if md}
                                                            {@html highlightMatches(
                                                                action.subtitle,
                                                                md.subtitleIndices,
                                                            )}
                                                        {:else}
                                                            {action.subtitle}
                                                        {/if}
                                                    {:else}
                                                        {action.subtitle}
                                                    {/if}
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                    {#if action.shortcut}
                                        <div class="palette-item-shortcut">
                                            {#each formatShortcut(action.shortcut) as key}
                                                <kbd class="palette-kbd"
                                                    >{key}</kbd
                                                >
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Footer -->
            <div class="palette-footer">
                <div class="palette-hint">
                    <Keyboard size={14} />
                    {#if activeMode === "shortcuts"}
                        <span><kbd>Esc</kbd> {m.palette_footer_go_back()}</span>
                    {:else if activeMode === "commands"}
                        <span
                            ><kbd>↑↓</kbd> {m.palette_footer_navigate()} &middot;
                            <kbd>Enter</kbd> {m.palette_footer_run()} &middot;
                            <kbd>Esc</kbd> {m.palette_footer_close()}</span
                        >
                    {:else}
                        <span
                            ><kbd>↑↓</kbd> {m.palette_footer_navigate()} &middot;
                            <kbd>Enter</kbd> {m.palette_footer_run()} &middot;
                            <kbd>Esc</kbd> {m.palette_footer_go_back()}</span
                        >
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .palette-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 20vh;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        animation: fadeIn 0.12s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .palette-container {
        width: min(580px, 90vw);
        max-height: 420px;
        display: flex;
        flex-direction: column;
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 8px;
        box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.24),
            0 4px 12px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        animation: slideDown 0.15s ease-out;
    }

    /* ── Search ────────────────────────────────────────────── */
    .palette-search {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
        border-bottom: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-background);
    }

    .palette-search :global(svg) {
        color: var(--cds-text-02);
        flex-shrink: 0;
    }

    .palette-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 1rem;
        font-family: inherit;
        color: var(--cds-text-01);
        caret-color: var(--cds-interactive-01);
    }

    .palette-input::placeholder {
        color: var(--cds-text-placeholder);
    }

    .palette-input--has-mode {
        padding-left: 0.25rem;
    }

    /* ── Mode Badge ────────────────────────────────────────── */
    .palette-mode-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        font-size: 0.75rem;
        font-weight: 700;
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        border-radius: 4px;
        background: var(--cds-interactive-01, #0f62fe);
        color: var(--cds-text-04, #fff);
        flex-shrink: 0;
        line-height: 1;
        user-select: none;
    }

    /* ── Match Highlighting ────────────────────────────────── */
    :global(.palette-match) {
        background: transparent;
        color: var(--cds-interactive-01, #0f62fe);
        font-weight: 600;
        border-radius: 1px;
        padding: 0;
    }

    .palette-item--selected :global(.palette-match) {
        color: var(--cds-link-01, #78a9ff);
    }

    .palette-esc-badge {
        font-size: 0.625rem;
        font-weight: 600;
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        background: var(--cds-ui-03);
        color: var(--cds-text-02);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border: 1px solid var(--cds-ui-04, rgba(255, 255, 255, 0.1));
        flex-shrink: 0;
    }

    /* ── Results ───────────────────────────────────────────── */
    .palette-results {
        flex: 1;
        overflow-y: auto;
        padding: 0.25rem;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .palette-results::-webkit-scrollbar {
        width: 4px;
    }
    .palette-results::-webkit-scrollbar-track {
        background: transparent;
    }
    .palette-results::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 2px;
    }

    .palette-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        color: var(--cds-text-placeholder);
        font-size: 0.875rem;
        font-style: italic;
    }

    /* ── Group ─────────────────────────────────────────────── */
    .palette-group {
        padding: 0.25rem 0;
    }

    .palette-group:not(:first-child) {
        border-top: 1px solid var(--cds-ui-03);
        margin-top: 0.25rem;
        padding-top: 0.5rem;
    }

    .palette-group-header {
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--cds-text-02);
        padding: 0.25rem 0.75rem 0.375rem;
        user-select: none;
    }

    /* ── Item ──────────────────────────────────────────────── */
    .palette-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        transition:
            background 0.1s ease,
            color 0.1s ease;
        user-select: none;
    }

    .palette-item:hover,
    .palette-item--selected {
        background: var(--cds-hover-ui);
    }

    .palette-item--selected {
        background: var(--cds-selected-ui, var(--cds-hover-ui));
    }

    .palette-item-left {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        min-width: 0;
    }

    .palette-item-left :global(svg) {
        color: var(--cds-text-02);
        flex-shrink: 0;
        transition: color 0.1s ease;
    }

    .palette-item--selected .palette-item-left :global(svg) {
        color: var(--cds-interactive-01);
    }

    .palette-item-text {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
    }

    .palette-item-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--cds-text-01);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .palette-item-subtitle {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .palette-item-shortcut {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
    }

    .palette-kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.25rem;
        height: 1.25rem;
        padding: 0 0.3rem;
        font-size: 0.6875rem;
        font-weight: 600;
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        border-radius: 3px;
        background: var(--cds-ui-03);
        color: var(--cds-text-02);
        border: 1px solid var(--cds-ui-04, rgba(255, 255, 255, 0.1));
        line-height: 1;
    }

    /* ── Footer ────────────────────────────────────────────── */
    .palette-footer {
        padding: 0.5rem 1rem;
        border-top: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-background);
    }

    .palette-hint {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.6875rem;
        color: var(--cds-text-02);
    }

    .palette-hint :global(svg) {
        flex-shrink: 0;
        opacity: 0.7;
    }

    .palette-hint kbd {
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        font-weight: 600;
        font-size: inherit;
    }
</style>

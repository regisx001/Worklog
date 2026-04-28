<!-- src/lib/components/app/layout/command-palette/command-palette.svelte -->
<script lang="ts">
    import { Search, ArrowRight, Keyboard } from "carbon-icons-svelte";
    import { useCommandPalette } from "$lib/hooks/command-palette.svelte";
    import type { CommandAction } from "$lib/components/app/types";

    const palette = useCommandPalette();

    // ── Filtered actions ───────────────────────────────────────────────────
    const filtered = $derived<CommandAction[]>(
        palette.query.trim()
            ? palette.actions.filter(
                  (action) =>
                      action.label
                          .toLowerCase()
                          .includes(palette.query.toLowerCase()) ||
                      action.subtitle
                          .toLowerCase()
                          .includes(palette.query.toLowerCase()) ||
                      action.shortcut
                          .toLowerCase()
                          .includes(palette.query.toLowerCase()),
              )
            : palette.actions,
    );

    // ── Keyboard navigation ────────────────────────────────────────────────
    function handleKeydown(e: KeyboardEvent) {
        if (!palette.isOpen) return;

        if (e.key === "Escape") {
            e.preventDefault();
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
            const action = filtered[palette.selectedIndex];
            if (action) {
                palette.runAction(action);
            }
            return;
        }
    }

    // ── Click outside to close ─────────────────────────────────────────────
    function handleBackdropClick(e: MouseEvent) {
        if ((e.target as HTMLElement)?.classList?.contains("palette-backdrop")) {
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
            // Slight delay to allow the DOM to render
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
        <div class="palette-container" role="dialog" aria-label="Command palette">
            <!-- Search input -->
            <div class="palette-search">
                <Search size={20} class="palette-search-icon" />
                <input
                    bind:this={inputRef}
                    type="text"
                    class="palette-input"
                    placeholder="Type a command..."
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

            <!-- Results list -->
            <div class="palette-results" role="listbox">
                {#if filtered.length === 0}
                    <div class="palette-empty">
                        <span>No commands found</span>
                    </div>
                {:else}
                    {#each filtered as action, i (action.id)}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <div
                            id="palette-item-{i}"
                            class="palette-item"
                            class:palette-item--selected={i ===
                                palette.selectedIndex}
                            role="option"
                            tabindex="-1"
                            aria-selected={i === palette.selectedIndex}
                            onmouseenter={() => palette.setSelectedIndex(i)}
                            onclick={() => palette.runAction(action)}
                        >
                            <div class="palette-item-left">
                                <ArrowRight
                                    size={16}
                                    class="palette-item-icon"
                                />
                                <div class="palette-item-text">
                                    <span class="palette-item-label"
                                        >{action.label}</span
                                    >
                                    {#if action.subtitle}
                                        <span class="palette-item-subtitle"
                                            >{action.subtitle}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                            {#if action.shortcut}
                                <div class="palette-item-shortcut">
                                    {#each formatShortcut(action.shortcut) as key}
                                        <kbd class="palette-kbd">{key}</kbd>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Footer -->
            <div class="palette-footer">
                <div class="palette-hint">
                    <Keyboard size={14} />
                    <span
                        ><kbd>↑↓</kbd> navigate &middot; <kbd>Enter</kbd> run &middot;
                        <kbd>Esc</kbd> close</span
                    >
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

    .palette-esc-badge {
        font-size: 0.625rem;
        font-weight: 600;
        font-family: var(
            --cds-code-01-font-family,
            "IBM Plex Mono",
            monospace
        );
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
        padding: 0.5rem;
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

    .palette-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
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
        font-family: var(
            --cds-code-01-font-family,
            "IBM Plex Mono",
            monospace
        );
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
        font-family: var(
            --cds-code-01-font-family,
            "IBM Plex Mono",
            monospace
        );
        font-weight: 600;
        font-size: inherit;
    }
</style>

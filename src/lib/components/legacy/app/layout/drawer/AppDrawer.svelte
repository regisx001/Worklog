<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        open: boolean;
        onClose: () => void;
        ariaLabel?: string;
        width?: string;
        header?: Snippet;
        children?: Snippet;
        footer?: Snippet;
    }

    let {
        open,
        onClose,
        ariaLabel = "Drawer",
        width = "calc(var(--pico-spacing) * 20)",
        header,
        children,
        footer,
    }: Props = $props();

    function handleEscape(event: KeyboardEvent) {
        if (!open || event.key !== "Escape") {
            return;
        }

        event.preventDefault();
        onClose();
    }

    function handleLayerClick(event: MouseEvent) {
        if (event.target !== event.currentTarget) {
            return;
        }

        onClose();
    }

    $effect(() => {
        if (!open) {
            return;
        }

        const root = document.documentElement;
        root.classList.add("drawer-is-open");

        return () => {
            root.classList.remove("drawer-is-open");
        };
    });
</script>

<svelte:window onkeydown={handleEscape} />

{#if open}
    <div
        class="app-drawer-layer"
        role="presentation"
        onclick={handleLayerClick}
    >
        <div
            class="app-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            style={`--drawer-width: ${width};`}
        >
            <header class="app-drawer-header">
                <div class="app-drawer-header-content">
                    {#if header}
                        {@render header()}
                    {/if}
                </div>

                <button
                    type="button"
                    class="app-drawer-close"
                    aria-label="Close"
                    onclick={onClose}
                >
                    ×
                </button>
            </header>

            <div class="app-drawer-body">
                {#if children}
                    {@render children()}
                {/if}
            </div>

            {#if footer}
                <footer class="app-drawer-footer">
                    {@render footer()}
                </footer>
            {/if}
        </div>
    </div>
{/if}

<style>
    .app-drawer-layer {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        justify-content: flex-end;
        background: color-mix(
            in oklch,
            var(--pico-background-color) 10%,
            transparent
        );
    }

    .app-drawer {
        width: var(--drawer-width);
        max-width: 100vw;
        min-width: min(100vw, calc(var(--pico-spacing) * 16));
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--pico-card-background-color);
        border-left: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        box-shadow: calc(var(--pico-spacing) * -0.5) 0
            calc(var(--pico-spacing) * 2)
            color-mix(in oklch, var(--pico-background-color) 70%, transparent);
        overflow: hidden;
    }

    .app-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: calc(var(--pico-spacing) * 0.6) var(--pico-spacing);
        border-bottom: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        background: var(--pico-card-background-color);
    }

    .app-drawer-header-content {
        flex: 1;
        min-width: 0;
    }

    .app-drawer-close {
        margin: 0;
        min-width: 1.8rem;
        padding: 0 calc(var(--pico-spacing) * 0.35);
        line-height: 1.2;
    }

    .app-drawer-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
    }

    .app-drawer-footer {
        display: flex;
        justify-content: flex-end;
        gap: calc(var(--pico-spacing) * 0.5);
        padding: calc(var(--pico-spacing) * 0.6) var(--pico-spacing);
        border-top: var(--pico-border-width) solid
            var(--pico-muted-border-color);
        background: var(--pico-card-background-color);
    }

    @media (max-width: 760px) {
        .app-drawer {
            min-width: 100vw;
        }
    }
</style>

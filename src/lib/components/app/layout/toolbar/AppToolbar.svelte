<script lang="ts">
    import { X, SquareIcon, Minus } from "@lucide/svelte";
    type WindowControlAction = "minimize" | "maximize" | "close";

    const runWindowControl = async (action: WindowControlAction) => {
        try {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            const appWindow = getCurrentWindow();

            if (action === "minimize") {
                await appWindow.minimize();
                return;
            }

            if (action === "maximize") {
                await appWindow.maximize();
                return;
            }

            await appWindow.close();
        } catch (error) {
            console.error("Window control action failed", action, error);
        }
    };
</script>

<header class="app-toolbar-wrap">
    <nav
        class="app-toolbar container-fluid"
        aria-label="Application toolbar"
        data-tauri-drag-region
    >
        <ul class="toolbar-brand">
            <li>
                <strong data-tauri-drag-region>Worklog</strong>
            </li>
        </ul>

        <ul class="toolbar-actions toolbar-window-controls">
            <li>
                <button
                    type="button"
                    class="secondary"
                    onclick={() => runWindowControl("minimize")}
                    aria-label="Minimize window"
                >
                    <Minus />
                </button>
            </li>
            <li>
                <button
                    type="button"
                    class="secondary"
                    onclick={() => runWindowControl("maximize")}
                    aria-label="Maximize window"
                    ><SquareIcon />
                </button>
            </li>
            <li>
                <button
                    type="button"
                    onclick={() => runWindowControl("close")}
                    aria-label="Close window"
                >
                    <X />
                </button>
            </li>
        </ul>
    </nav>
</header>

<style>
    .app-toolbar-wrap {
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(14px);
        background: linear-gradient(
            180deg,
            var(--color-surface-1) 0%,
            var(--color-surface-2) 100%
        );
        border-bottom: 1px solid var(--color-border-soft);
    }

    .app-toolbar {
        min-height: 3.6rem;
    }

    .app-toolbar ul {
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
    }

    .toolbar-brand strong {
        font-family: var(--font-display);
        font-size: 0.9rem;
        letter-spacing: 0.02em;
    }

    .toolbar-actions button {
        margin-bottom: 0;
        padding: 0.34rem 0.58rem;
        border-radius: 0.45rem;
        font-size: 0.75rem;
    }

    .toolbar-window-controls {
        margin-left: auto;
    }

    .window-close {
        border-color: rgba(255, 144, 144, 0.35);
        background: rgba(151, 52, 52, 0.35);
    }

    @media (max-width: 760px) {
        .app-toolbar {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.5rem;
            padding-top: 0.6rem;
            padding-bottom: 0.65rem;
        }

        .app-toolbar > ul {
            justify-content: center;
            flex-wrap: wrap;
        }

        .app-shell-content {
            padding: 0.7rem 0.8rem 1rem;
        }
    }
</style>

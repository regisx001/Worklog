<script lang="ts">
    import { XIcon, SquareIcon, MinusIcon } from "@lucide/svelte";
    type WindowControlAction = "minimize" | "toggle-maximize" | "close";

    let isMaximized = $state(false);

    const runWindowControl = async (action: WindowControlAction) => {
        try {
            const { getCurrentWindow } = await import("@tauri-apps/api/window");
            const appWindow = getCurrentWindow();

            if (action === "minimize") {
                await appWindow.minimize();
                return;
            }

            if (action === "toggle-maximize") {
                if (await appWindow.isMaximized()) {
                    await appWindow.unmaximize();
                } else {
                    await appWindow.maximize();
                }

                isMaximized = await appWindow.isMaximized();
                return;
            }

            await appWindow.close();
        } catch (error) {
            console.error("Window control action failed", action, error);
        }
    };

    $effect(() => {
        let unlistenResize: (() => void) | undefined;
        let isAlive = true;

        (async () => {
            try {
                const { getCurrentWindow } = await import(
                    "@tauri-apps/api/window"
                );
                const appWindow = getCurrentWindow();

                isMaximized = await appWindow.isMaximized();
                unlistenResize = await appWindow.onResized(async () => {
                    if (!isAlive) {
                        return;
                    }

                    isMaximized = await appWindow.isMaximized();
                });
            } catch (error) {
                console.error(
                    "Unable to subscribe to window state changes",
                    error,
                );
            }
        })();

        return () => {
            isAlive = false;
            unlistenResize?.();
        };
    });
</script>

<header class="app-toolbar-wrap">
    <div class="app-toolbar" aria-label="Application toolbar">
        <div class="toolbar-drag-region" data-tauri-drag-region>
            <strong>Worklog</strong>
        </div>

        <div
            class="toolbar-window-controls"
            role="toolbar"
            aria-label="Window controls"
        >
            <button
                type="button"
                class="window-control"
                onclick={() => runWindowControl("minimize")}
                aria-label="Minimize window"
                title="Minimize"
            >
                <MinusIcon
                    absoluteStrokeWidth
                    strokeWidth={0.8}
                    style="padding: 5px;"
                />
            </button>

            <button
                type="button"
                class="window-control"
                onclick={() => runWindowControl("toggle-maximize")}
                aria-label={isMaximized ? "Restore window" : "Maximize window"}
                title={isMaximized ? "Restore down" : "Maximize"}
            >
                <SquareIcon
                    absoluteStrokeWidth
                    strokeWidth={0.8}
                    style="padding: 5px;"
                />
            </button>

            <button
                type="button"
                class="window-control window-control-close"
                onclick={() => runWindowControl("close")}
                aria-label="Close window"
                title="Close"
            >
                <XIcon
                    absoluteStrokeWidth
                    strokeWidth={0.8}
                    style="padding: 5px;"
                />
            </button>
        </div>
    </div>
</header>

<style>
    .app-toolbar-wrap {
        position: relative;
        z-index: 10;
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--color-border-soft);
    }

    .app-toolbar {
        --window-control-width: 2.9rem;
        min-height: 2rem;
        position: relative;
        display: flex;
        align-items: stretch;
        justify-content: space-between;
        padding: 0;
    }

    .toolbar-drag-region {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 2rem;
        display: flex;
        align-items: center;
        padding-inline: 0.7rem;
        padding-right: calc((var(--window-control-width) * 3) + 0.6rem);
    }

    .toolbar-drag-region strong {
        font-family: var(--font-display);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.045em;
        text-transform: uppercase;
        color: var(--color-text-muted);
    }

    .toolbar-window-controls {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        width: calc(var(--window-control-width) * 3);
        max-width: calc(var(--window-control-width) * 3);
        display: inline-flex;
        justify-content: flex-end;
        align-items: stretch;
    }

    .window-control {
        flex: 0 0 var(--window-control-width);
        width: var(--window-control-width);
        min-width: var(--window-control-width);
        height: 2rem;
        margin: 0;
        padding: 0;
        border-radius: 0;
        border: 0;
        background: transparent;
        color: rgba(234, 242, 251, 0.88);
        display: grid;
        place-items: center;
    }

    .window-control:hover {
        background: rgba(132, 149, 176, 0.2);
    }

    .window-control:active {
        background: rgba(132, 149, 176, 0.32);
    }

    .window-control:focus-visible {
        outline: 1px solid rgba(165, 187, 220, 0.6);
        outline-offset: -1px;
    }

    .window-control-close:hover {
        background: #e81123;
        color: #ffffff;
    }

    .window-control-close:active {
        background: #c50f1f;
    }

    @media (max-width: 760px) {
        .app-toolbar {
            --window-control-width: 2.45rem;
        }

        .toolbar-drag-region {
            padding-inline: 0.55rem;
            padding-right: calc((var(--window-control-width) * 3) + 0.45rem);
        }
    }
</style>

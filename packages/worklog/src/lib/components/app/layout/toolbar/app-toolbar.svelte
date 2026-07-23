<script lang="ts">
    import {
        Close,
        Maximize,
        Minimize,
        Settings,
        Subtract,
        Asleep,
        LightFilled,
        Renew,
        Search,
        Undo,
        Redo,
    } from "carbon-icons-svelte";

    import {
        Header,
        HeaderUtilities,
        Button,
        ImageLoader,
        SkipToContent,
    } from "carbon-components-svelte";

    import { syncState } from "$lib/sync/sync-scheduler.svelte";
    import { useAppAppearance } from "$lib/hooks/app-appearance.svelte";
    import { getUndoRedo } from "$lib/hooks/undo-redo.svelte";
    import * as m from "$lib/paraglide/messages.js";

    type WindowControlAction = "minimize" | "toggle-maximize" | "close";

    interface AppToolbarProps {
        showSettings?: boolean;
        onOpenSettings?: () => void;
        onOpenPalette?: () => void;
        onUndo?: () => void;
        onRedo?: () => void;
    }

    const noop = () => {};

    let {
        showSettings = false,
        onOpenSettings = noop,
        onOpenPalette = noop,
        onUndo = noop,
        onRedo = noop,
    }: AppToolbarProps = $props();

    const undoRedo = getUndoRedo();

    const appAppearance = useAppAppearance();
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

    function toggleTheme() {
        if (appAppearance.theme === "dark") {
            appAppearance.theme = "light";
            return;
        }
        appAppearance.theme = "dark";
    }

    let logo = $derived(
        appAppearance.theme === "dark" ||
            (appAppearance.theme === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
            ? "/logo-white.png"
            : "/logo-black.png",
    );

    // Listen for theme toggle events from the command palette / shortcuts
    $effect(() => {
        const handler = () => toggleTheme();
        window.addEventListener("worklog:toggle-theme", handler);
        return () =>
            window.removeEventListener("worklog:toggle-theme", handler);
    });

    // @ts-ignore
    const version = __APP_VERSION__;

    const formattedSyncTime = $derived.by(() => {
        if (syncState.isSyncing) return m.toolbar_syncing();
        if (!syncState.nextSyncAt) return "";
        const totalSeconds = Math.ceil(syncState.timeRemainingMs / 1000);
        if (totalSeconds <= 0) return m.toolbar_syncing_soon();
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return m.toolbar_next_sync({ m: min, s: sec });
    });
</script>

<Header companyName="" platformName="" isSideNavOpen>
    <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>

    <img
        style="position: absolute; margin: 0 1rem;"
        src={logo}
        width="100px"
        alt=""
        srcset=""
    />
    <div
        aria-hidden="true"
        class="toolbar-drag-region"
        data-tauri-drag-region
        ondblclick={() => runWindowControl("toggle-maximize")}
    ></div>

    {#if formattedSyncTime}
        <div class="sync-status">
            {formattedSyncTime}
        </div>
    {/if}

    <HeaderUtilities>
        <Button
            onclick={onOpenPalette}
            kind="ghost"
            aria-label={m.toolbar_open_command_palette()}
        >
            <Search />
        </Button>

        <Button
            disabled={!undoRedo.canUndo}
            onclick={onUndo}
            kind="ghost"
            aria-label={m.command_undo()}
        >
            <Undo />
        </Button>

        <Button
            disabled={!undoRedo.canRedo}
            onclick={onRedo}
            kind="ghost"
            aria-label={m.command_redo()}
        >
            <Redo />
        </Button>

        <Button
            onclick={() => {
                window.location.reload();
            }}
            kind="ghost"
            aria-label={m.toolbar_refresh_app()}
        >
            <Renew />
        </Button>

        <Button
            onclick={toggleTheme}
            kind="ghost"
            aria-label={m.toolbar_toggle_theme()}
        >
            {#if appAppearance.theme === "dark"}
                <LightFilled />
            {:else}
                <Asleep />
            {/if}
        </Button>

        {#if showSettings}
            <Button
                aria-label={m.toolbar_open_settings()}
                onclick={onOpenSettings}
                kind="ghost"
            >
                <Settings />
            </Button>
        {/if}

        <Button onclick={() => runWindowControl("minimize")} kind="ghost">
            <Subtract />
        </Button>

        <Button
            onclick={() => runWindowControl("toggle-maximize")}
            kind="ghost"
        >
            {#if isMaximized}
                <Minimize />
            {:else}
                <Maximize />
            {/if}
        </Button>

        <Button onclick={() => runWindowControl("close")} kind="danger-ghost">
            <Close />
        </Button>
    </HeaderUtilities>
</Header>

<style>
    .toolbar-drag-region {
        flex: 1 1 auto;
        min-width: 0;
        height: 100%;
    }

    :global(.bx--header__global) {
        margin-left: 0;
    }
    .sync-status {
        position: absolute;
        right: 25rem;
        top: 0;
        height: 3rem;
        display: flex;
        align-items: center;
        font-size: 0.75rem;
        color: var(--cds-text-secondary);
        opacity: 0.8;
    }
</style>

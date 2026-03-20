<script lang="ts">
    import { onMount } from "svelte";
    import ToolbarActions from "./ToolbarActions.svelte";
    import ToolbarIdentity from "./ToolbarIdentity.svelte";
    import WindowControls from "./WindowControls.svelte";
    import type { SyncState } from "../types.js";

    interface AppToolbarProps {
        projectName: string;
        pendingChanges: number;
        syncState: SyncState;
        onOpenPalette: () => void;
        onCreateTicket: () => void;
        onManualSync: () => void;
    }

    interface AppWindowHandle {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        close: () => Promise<void>;
        startDragging: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
        onResized: (handler: () => void | Promise<void>) => Promise<() => void>;
    }

    let {
        projectName,
        pendingChanges,
        syncState,
        onOpenPalette,
        onCreateTicket,
        onManualSync,
    }: AppToolbarProps = $props();

    let appWindow: AppWindowHandle | null = null;
    let isTauri = $state(false);
    let isMaximized = $state(false);
    let toolbarEl: HTMLElement | null = null;

    const syncLabel = $derived.by(() => {
        if (syncState === "syncing") return "Syncing";
        if (syncState === "pending_changes") return "Pending";
        return "Up to date";
    });

    onMount(() => {
        let unlistenResize: (() => void) | null = null;
        const handleMouseDown = (event: MouseEvent) => {
            void startToolbarDrag(event);
        };
        const handleDoubleClick = (event: MouseEvent) => {
            void handleToolbarDoubleClick(event);
        };

        async function initWindowControls() {
            try {
                const { getCurrentWindow } = await import(
                    "@tauri-apps/api/window"
                );
                const win = getCurrentWindow() as unknown as AppWindowHandle;
                appWindow = win;
                isTauri = true;
                isMaximized = await win.isMaximized();
                unlistenResize = await win.onResized(async () => {
                    if (!appWindow) return;
                    isMaximized = await appWindow.isMaximized();
                });
            } catch {
                appWindow = null;
                isTauri = false;
            }
        }

        if (toolbarEl) {
            toolbarEl.addEventListener("mousedown", handleMouseDown);
            toolbarEl.addEventListener("dblclick", handleDoubleClick);
        }

        void initWindowControls();

        return () => {
            if (toolbarEl) {
                toolbarEl.removeEventListener("mousedown", handleMouseDown);
                toolbarEl.removeEventListener("dblclick", handleDoubleClick);
            }
            if (unlistenResize) {
                unlistenResize();
            }
        };
    });

    async function minimizeWindow() {
        if (!appWindow) return;
        await appWindow.minimize();
    }

    async function toggleMaximizeWindow() {
        if (!appWindow) return;

        if (isMaximized) {
            await appWindow.unmaximize();
            isMaximized = false;
        } else {
            await appWindow.maximize();
            isMaximized = true;
        }
    }

    async function closeWindow() {
        if (!appWindow) return;
        await appWindow.close();
    }

    function isToolbarActionTarget(target: EventTarget | null) {
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest("[data-toolbar-action='true']"));
    }

    async function startToolbarDrag(event: MouseEvent) {
        if (
            !appWindow ||
            event.button !== 0 ||
            isToolbarActionTarget(event.target)
        ) {
            return;
        }

        await appWindow.startDragging();
    }

    async function handleToolbarDoubleClick(event: MouseEvent) {
        if (!appWindow || isToolbarActionTarget(event.target)) {
            return;
        }

        await toggleMaximizeWindow();
    }
</script>

<header
    bind:this={toolbarEl}
    class="relative z-[60] flex h-[var(--app-toolbar-height)] min-h-[var(--app-toolbar-height)] w-full select-none items-center border-b border-border bg-card px-2"
>
    <ToolbarIdentity {projectName} />

    <div
        class="flex shrink-0 items-center gap-1.5 pl-2"
        data-toolbar-action="true"
    >
        <ToolbarActions
            {pendingChanges}
            {syncLabel}
            {syncState}
            {onOpenPalette}
            {onCreateTicket}
            {onManualSync}
        />

        <WindowControls
            {isTauri}
            {isMaximized}
            onMinimize={minimizeWindow}
            onToggleMaximize={toggleMaximizeWindow}
            onClose={closeWindow}
        />
    </div>
</header>

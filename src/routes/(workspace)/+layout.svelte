<script lang="ts">
    import Sidebar from "$lib/components/app/Sidebar/Sidebar.svelte";
    import SyncStatusBar from "$lib/components/app/SyncStatus/SyncStatusBar.svelte";
    import WorkspaceInset from "$lib/components/app/theme-v2/WorkspaceInset.svelte";

    import { toolbarState } from "$lib/hooks/toolbar.svelte.js";
    const { children } = $props();
</script>

<div class="flex h-full min-h-0 flex-col p-1.5 sm:p-2 md:p-3">
    <WorkspaceInset class="min-h-0 flex-1">
        <div
            class="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[15rem_1fr] lg:grid-cols-[18rem_1fr]"
        >
            <Sidebar />

            <div
                class="flex min-h-0 min-w-0 flex-col border-t border-border/70 bg-gradient-to-b from-surface-raised to-surface-panel/60 md:border-t-0"
            >
                <main class="min-h-0 flex-1">{@render children()}</main>

                <SyncStatusBar
                    syncState={toolbarState.syncState}
                    pendingChanges={toolbarState.pendingChanges}
                    onManualSync={toolbarState.onManualSync}
                />
            </div>
        </div>
    </WorkspaceInset>
</div>

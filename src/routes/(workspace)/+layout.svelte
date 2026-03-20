<script lang="ts">
    import Sidebar from "$lib/components/app/Sidebar/Sidebar.svelte";
    import SyncStatusBar from "$lib/components/app/SyncStatus/SyncStatusBar.svelte";

    import { toolbarState } from "$lib/hooks/toolbar.svelte.js";
    const { children } = $props();
</script>

<div class="flex h-full min-h-0 flex-col">
    <div class="grid min-h-0 flex-1 grid-cols-[18rem_1fr]">
        <Sidebar />

        <div class="flex min-h-0 min-w-0 flex-col">
            <main class="min-h-0 flex-1">{@render children()}</main>

            <SyncStatusBar
                syncState={toolbarState.syncState}
                pendingChanges={toolbarState.pendingChanges}
                onManualSync={toolbarState.onManualSync}
            />
        </div>
    </div>
</div>

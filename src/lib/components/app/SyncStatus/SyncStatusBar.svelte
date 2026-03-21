<script lang="ts">
    import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
    import CircleDotIcon from "@lucide/svelte/icons/circle-dot";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import type { SyncState } from "$lib/components/app/types.js";

    interface SyncStatusBarProps {
        syncState: SyncState;
        pendingChanges: number;
        onManualSync: () => void;
    }

    let { syncState, pendingChanges, onManualSync }: SyncStatusBarProps =
        $props();

    const statusText = $derived.by(() => {
        if (syncState === "syncing") return "Syncing with Git";
        if (syncState === "pending_changes")
            return `${pendingChanges} pending local changes`;
        return "Up to date";
    });

    const indicatorClass = $derived.by(() => {
        if (syncState === "syncing") return "bg-chart-2 animate-pulse";
        if (syncState === "pending_changes") return "bg-chart-4";
        return "bg-chart-1";
    });
</script>

<div class="bg-surface-panel/85 backdrop-blur-[1px]">
    <Separator />
    <footer class="flex h-10 items-center justify-between px-4 text-xs">
        <div class="text-muted-foreground flex items-center gap-2">
            <span class={`size-2 rounded-full ${indicatorClass}`}></span>
            <CircleDotIcon class="size-3.5" />
            <span>{statusText}</span>
        </div>

        <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-[10px]">Ctrl/Cmd+S</Badge>
            <Button
                variant="outline"
                size="sm"
                onclick={onManualSync}
                disabled={syncState === "syncing"}
                aria-label="Manual sync"
            >
                <RefreshCcwIcon
                    class={syncState === "syncing" ? "animate-spin" : undefined}
                />
                Sync now
            </Button>
        </div>
    </footer>
</div>

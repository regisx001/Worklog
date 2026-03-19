<script lang="ts">
    import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
    import SearchIcon from "@lucide/svelte/icons/search";
    import PlusIcon from "@lucide/svelte/icons/plus";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import type { SyncState } from "../types.js";

    interface ToolbarActionsProps {
        pendingChanges: number;
        syncLabel: string;
        syncState: SyncState;
        onOpenPalette: () => void;
        onCreateTicket: () => void;
        onManualSync: () => void;
    }

    let {
        pendingChanges,
        syncLabel,
        syncState,
        onOpenPalette,
        onCreateTicket,
        onManualSync,
    }: ToolbarActionsProps = $props();
</script>

<div class="flex items-center gap-1.5" data-toolbar-action="true">
    <Badge variant="outline" class="hidden text-[10px] xl:inline-flex"
        >{syncLabel}</Badge
    >
    <Badge variant="outline" class="hidden text-[10px] lg:inline-flex"
        >{pendingChanges} changes</Badge
    >

    <Button
        variant="ghost"
        size="sm"
        class="h-7 gap-1.5 max-[920px]:px-2"
        data-toolbar-action="true"
        onclick={onOpenPalette}
    >
        <SearchIcon class="size-3.5" />
        <span class="max-[1040px]:hidden">Ctrl/Cmd+K</span>
    </Button>

    <Button
        variant="outline"
        size="sm"
        class="h-7 gap-1.5 max-[920px]:px-2"
        data-toolbar-action="true"
        onclick={onManualSync}
        disabled={syncState === "syncing"}
    >
        <RefreshCcwIcon
            class={`size-3.5 ${syncState === "syncing" ? "animate-spin" : ""}`}
        />
        <span class="max-[1040px]:hidden">Sync</span>
    </Button>

    <Button
        size="sm"
        class="h-7 gap-1.5 max-[920px]:px-2"
        data-toolbar-action="true"
        onclick={onCreateTicket}
    >
        <PlusIcon class="size-3.5" />
        <span class="max-[1040px]:hidden">Ticket</span>
    </Button>
</div>

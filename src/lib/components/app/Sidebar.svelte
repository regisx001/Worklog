<script lang="ts">
    import PlusIcon from "@lucide/svelte/icons/plus";
    import SearchIcon from "@lucide/svelte/icons/search";
    import SettingsIcon from "@lucide/svelte/icons/settings";
    import SignalIcon from "@lucide/svelte/icons/signal";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import {
        Tooltip,
        TooltipContent,
        TooltipTrigger,
    } from "$lib/components/ui/tooltip/index.js";
    import type { Board, SyncState } from "./types.js";

    interface SidebarProps {
        boards: Board[];
        activeBoardId: string | null;
        syncState: SyncState;
        onSelectBoard: (boardId: string) => void;
        onOpenPalette: () => void;
        onOpenSettings: () => void;
        onCreateTicket: () => void;
    }

    let {
        boards,
        activeBoardId,
        syncState,
        onSelectBoard,
        onOpenPalette,
        onOpenSettings,
        onCreateTicket,
    }: SidebarProps = $props();

    const syncLabel = $derived.by(() => {
        if (syncState === "syncing") return "Syncing";
        if (syncState === "pending_changes") return "Pending";
        return "Up to date";
    });

    const syncDotClass = $derived.by(() => {
        if (syncState === "syncing") return "bg-chart-2 animate-pulse";
        if (syncState === "pending_changes") return "bg-chart-4";
        return "bg-chart-1";
    });
</script>

<aside
    class="bg-sidebar text-sidebar-foreground flex h-full w-72 flex-col border-r border-sidebar-border"
>
    <header class="flex items-center justify-between px-3 py-2.5">
        <div
            class="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
            <span>Boards</span>
            <Badge variant="outline" class="h-5 px-1.5">{boards.length}</Badge>
        </div>
        <Tooltip>
            <TooltipTrigger>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Create ticket"
                    onclick={onCreateTicket}
                >
                    <PlusIcon />
                </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}
                >Create ticket (Ctrl/Cmd+N)</TooltipContent
            >
        </Tooltip>
    </header>

    <Separator />

    <nav class="min-h-0 flex-1 overflow-y-auto p-2">
        <ul class="space-y-1">
            {#if boards.length === 0}
                <li>
                    <p
                        class="rounded-md border border-dashed border-border px-2.5 py-4 text-center text-xs text-muted-foreground"
                    >
                        No boards available
                    </p>
                </li>
            {:else}
                {#each boards as board (board.id)}
                    <li>
                        <button
                            type="button"
                            onclick={() => onSelectBoard(board.id)}
                            class="hover:bg-sidebar-accent focus-visible:ring-ring/50 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2"
                            class:bg-sidebar-accent={board.id === activeBoardId}
                            aria-current={board.id === activeBoardId
                                ? "page"
                                : undefined}
                        >
                            <div class="min-w-0">
                                <p class="truncate font-medium">{board.name}</p>
                                <p
                                    class="mt-0.5 text-[11px] text-muted-foreground"
                                >
                                    {board.description || "No description"}
                                </p>
                            </div>
                            <Badge variant="outline" class="shrink-0">
                                {board.id.slice(-4).toUpperCase()}
                            </Badge>
                        </button>
                    </li>
                {/each}
            {/if}
        </ul>
    </nav>

    <Separator />

    <div class="space-y-2 p-2.5">
        <div
            class="flex items-center justify-between rounded-md border border-border/70 px-2.5 py-2 text-xs"
        >
            <div class="flex items-center gap-2">
                <span class={`size-2 rounded-full ${syncDotClass}`}></span>
                <SignalIcon class="size-3.5 text-muted-foreground" />
                <span>{syncLabel}</span>
            </div>
            <Badge variant="outline" class="h-4 px-1 text-[10px]">local</Badge>
        </div>

        <div class="flex items-center gap-2">
            <Button
                variant="outline"
                class="flex-1 justify-start"
                onclick={onOpenPalette}
            >
                <SearchIcon />
                Command Palette
            </Button>
            <Button
                variant="outline"
                size="icon-sm"
                aria-label="Settings"
                onclick={onOpenSettings}
            >
                <SettingsIcon />
            </Button>
        </div>
    </div>
</aside>

<script lang="ts">
    import SearchIcon from "@lucide/svelte/icons/search";
    import CornerDownLeftIcon from "@lucide/svelte/icons/corner-down-left";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import type { CommandAction } from "$lib/components/app/types.js";

    interface CommandPaletteProps {
        open: boolean;
        actions: CommandAction[];
    }

    let { open = $bindable(false), actions }: CommandPaletteProps = $props();

    let query = $state("");
    let selectedIndex = $state(0);

    const filteredActions = $derived.by(() => {
        const term = query.trim().toLowerCase();
        if (!term) return actions;
        return actions.filter((action) => {
            const haystack = `${action.label} ${action.subtitle}`.toLowerCase();
            return haystack.includes(term);
        });
    });

    $effect(() => {
        if (open) {
            query = "";
            selectedIndex = 0;
        }
    });

    function runSelectedAction(index: number) {
        const action = filteredActions[index];
        if (!action) return;
        action.run();
        open = false;
    }

    function onInputKeyDown(event: KeyboardEvent) {
        if (!filteredActions.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedIndex = Math.min(
                selectedIndex + 1,
                filteredActions.length - 1,
            );
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
        }

        if (event.key === "Enter") {
            event.preventDefault();
            runSelectedAction(selectedIndex);
        }
    }
</script>

<Dialog bind:open>
    <DialogContent
        class="max-w-2xl border border-border/90 bg-surface-card p-0 text-foreground antialiased shadow-xl data-open:zoom-in-100 data-closed:zoom-out-100"
        showCloseButton={false}
    >
        <DialogHeader class="border-b border-border/80 px-3 pt-3 pb-2">
            <div class="flex items-center justify-between gap-3">
                <DialogTitle class="text-sm font-semibold tracking-wide"
                    >Command Palette</DialogTitle
                >
                <Badge variant="outline" class="text-[10px]"
                    >{filteredActions.length} result{filteredActions.length ===
                    1
                        ? ""
                        : "s"}</Badge
                >
            </div>
            <DialogDescription class="text-[11px] text-foreground/75">
                Search actions and press Enter to run.
            </DialogDescription>
        </DialogHeader>

        <div class="border-b border-border/80 px-3 py-2.5">
            <div class="relative">
                <SearchIcon
                    class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    bind:value={query}
                    autocomplete="off"
                    class="h-8 border-border/90 bg-background pl-8 text-xs text-foreground placeholder:text-foreground/45"
                    placeholder="Search actions, boards, tickets..."
                    onkeydown={onInputKeyDown}
                    aria-label="Command search"
                />
            </div>
        </div>

        <div class="max-h-80 overflow-y-auto p-2 no-scrollbar">
            {#if filteredActions.length === 0}
                <p
                    class="rounded-md border border-dashed border-border/80 px-2 py-6 text-center text-xs text-muted-foreground"
                >
                    No command found
                </p>
            {:else}
                <ul class="space-y-1">
                    {#each filteredActions as action, index (action.id)}
                        <li>
                            <button
                                type="button"
                                onmouseenter={() => {
                                    selectedIndex = index;
                                }}
                                onclick={() => runSelectedAction(index)}
                                class="group flex w-full items-center justify-between rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:bg-accent/70"
                                class:bg-accent={selectedIndex === index}
                                class:border-primary={selectedIndex === index}
                            >
                                <div class="min-w-0">
                                    <p class="truncate text-xs font-semibold">
                                        {action.label}
                                    </p>
                                    <p
                                        class="truncate text-[11px] text-muted-foreground"
                                    >
                                        {action.subtitle}
                                    </p>
                                </div>
                                <div class="ml-3 flex items-center gap-1.5">
                                    {#if selectedIndex === index}
                                        <CornerDownLeftIcon
                                            class="size-3 text-primary"
                                        />
                                    {/if}
                                    <Badge
                                        variant="outline"
                                        class="text-[10px] text-muted-foreground"
                                        >{action.shortcut}</Badge
                                    >
                                </div>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <Separator />

        <div
            class="flex items-center justify-between px-3 py-1.5 text-[10px] text-muted-foreground"
        >
            <span>Arrow keys to navigate</span>
            <span>Enter to run</span>
        </div>
    </DialogContent>
</Dialog>

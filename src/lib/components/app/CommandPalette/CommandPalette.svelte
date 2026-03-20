<script lang="ts">
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
        class="max-w-xl border border-border bg-card p-0"
        showCloseButton={false}
    >
        <DialogHeader class="px-3 pt-3 pb-1">
            <DialogTitle class="text-sm">Command Palette</DialogTitle>
            <DialogDescription class="text-xs text-muted-foreground">
                Type to filter actions. Navigate with arrows and Enter.
            </DialogDescription>
        </DialogHeader>

        <div class="px-3 pb-3">
            <Input
                bind:value={query}
                autocomplete="off"
                placeholder="Search actions..."
                onkeydown={onInputKeyDown}
                aria-label="Command search"
            />
        </div>

        <Separator />

        <div class="max-h-80 overflow-y-auto p-2">
            {#if filteredActions.length === 0}
                <p class="px-2 py-6 text-center text-xs text-muted-foreground">
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
                                class="hover:bg-muted flex w-full items-center justify-between rounded-none px-2 py-2 text-left"
                                class:bg-muted={selectedIndex === index}
                            >
                                <div>
                                    <p class="text-xs font-medium">
                                        {action.label}
                                    </p>
                                    <p
                                        class="text-[11px] text-muted-foreground"
                                    >
                                        {action.subtitle}
                                    </p>
                                </div>
                                <Badge variant="outline" class="text-[10px]"
                                    >{action.shortcut}</Badge
                                >
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </DialogContent>
</Dialog>

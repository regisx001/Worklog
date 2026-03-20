<script lang="ts">
    import { cn } from "$lib/utils.js";
    import type { Snippet } from "svelte";

    interface WorkspaceInsetProps {
        class?: string;
        children?: Snippet;
    }

    let { class: className, children }: WorkspaceInsetProps = $props();
</script>

<div
    class={cn(
        "m-0.5 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border/70 bg-surface-panel/90 shadow-sm ring-1 ring-white/5 backdrop-blur-[1px] sm:m-1 md:m-2",
        className,
    )}
>
    {@render children?.()}
</div>

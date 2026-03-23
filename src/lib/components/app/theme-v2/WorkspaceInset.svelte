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
        "flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border/90 bg-surface-panel shadow-sm",
        className,
    )}
>
    {@render children?.()}
</div>

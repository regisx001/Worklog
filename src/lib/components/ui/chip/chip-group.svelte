<script lang="ts">
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    let { class: className, children }: { class?: string, children: Snippet } = $props();
</script>

<div class={cn("flex flex-wrap gap-2", className)}>
    {@render children()}
</div>
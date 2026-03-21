<script lang="ts">
    import { cn } from "$lib/utils.js";
    import type { Snippet } from "svelte";

    interface SurfaceCardProps {
        title?: string;
        subtitle?: string;
        class?: string;
        bodyClass?: string;
        children?: Snippet;
    }

    let {
        title,
        subtitle,
        class: className,
        bodyClass,
        children,
    }: SurfaceCardProps = $props();
</script>

<section
    class={cn(
        "rounded-xl border border-border/70 bg-surface-card shadow-xs",
        className,
    )}
>
    {#if title || subtitle}
        <header class="space-y-1 border-b border-border/70 px-4 py-3">
            {#if title}
                <h2 class="text-sm font-semibold text-foreground">{title}</h2>
            {/if}
            {#if subtitle}
                <p class="text-[11px] text-muted-foreground">{subtitle}</p>
            {/if}
        </header>
    {/if}

    <div class={cn("p-4", bodyClass)}>
        {@render children?.()}
    </div>
</section>

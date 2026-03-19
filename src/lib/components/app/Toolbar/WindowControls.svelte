<script lang="ts">
    import CopyIcon from "@lucide/svelte/icons/copy";
    import MinusIcon from "@lucide/svelte/icons/minus";
    import SquareIcon from "@lucide/svelte/icons/square";
    import XIcon from "@lucide/svelte/icons/x";

    interface WindowControlsProps {
        isTauri: boolean;
        isMaximized: boolean;
        onMinimize: () => void | Promise<void>;
        onToggleMaximize: () => void | Promise<void>;
        onClose: () => void | Promise<void>;
    }

    let {
        isTauri,
        isMaximized,
        onMinimize,
        onToggleMaximize,
        onClose,
    }: WindowControlsProps = $props();
</script>

<div
    class="ml-1 flex items-center border-l border-border"
    data-toolbar-action="true"
>
    <button
        type="button"
        class="inline-flex h-10 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground disabled:cursor-default disabled:opacity-45"
        aria-label="Minimize window"
        title="Minimize"
        data-toolbar-action="true"
        onclick={onMinimize}
        disabled={!isTauri}
    >
        <MinusIcon class="size-3.5" />
    </button>

    <button
        type="button"
        class="inline-flex h-10 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent/70 hover:text-accent-foreground disabled:cursor-default disabled:opacity-45"
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
        title={isMaximized ? "Restore" : "Maximize"}
        data-toolbar-action="true"
        onclick={onToggleMaximize}
        disabled={!isTauri}
    >
        {#if isMaximized}
            <CopyIcon class="size-3.5" />
        {:else}
            <SquareIcon class="size-3.5" />
        {/if}
    </button>

    <button
        type="button"
        class="inline-flex h-10 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-red-600 hover:text-white disabled:cursor-default disabled:opacity-45"
        aria-label="Close window"
        title="Close"
        data-toolbar-action="true"
        onclick={onClose}
        disabled={!isTauri}
    >
        <XIcon class="size-3.5" />
    </button>
</div>

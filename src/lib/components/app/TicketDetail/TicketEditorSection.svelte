<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import type { TicketStatus } from "$lib/components/app/types.js";

    interface TicketEditorSectionProps {
        title: string;
        label: string;
        status: TicketStatus;
        statusOptions: Array<{ value: TicketStatus; label: string }>;
        onTitleChange: (value: string) => void;
        onLabelChange: (value: string) => void;
        onStatusChange: (value: TicketStatus) => void;
        onEditorKeyDown: (event: KeyboardEvent) => void;
    }

    let {
        title,
        label,
        status,
        statusOptions,
        onTitleChange,
        onLabelChange,
        onStatusChange,
        onEditorKeyDown,
    }: TicketEditorSectionProps = $props();
</script>

<div class="space-y-4">
    <div class="space-y-1.5">
        <label
            class="text-xs font-medium text-muted-foreground"
            for="ticket-title">Title</label
        >
        <Input
            id="ticket-title"
            value={title}
            placeholder="Ticket title"
            oninput={(event) => {
                onTitleChange((event.currentTarget as HTMLInputElement).value);
            }}
            onkeydown={onEditorKeyDown}
        />
    </div>

    <div class="space-y-1.5">
        <label
            class="text-xs font-medium text-muted-foreground"
            for="ticket-label">Label</label
        >
        <Input
            id="ticket-label"
            value={label}
            placeholder="bug, feat, refactor..."
            oninput={(event) => {
                onLabelChange((event.currentTarget as HTMLInputElement).value);
            }}
            onkeydown={onEditorKeyDown}
        />
    </div>

    <div class="space-y-1.5">
        <p class="text-xs font-medium text-muted-foreground">Status</p>
        <div class="grid grid-cols-3 gap-2">
            {#each statusOptions as option}
                <Button
                    variant={status === option.value ? "default" : "outline"}
                    onclick={() => {
                        onStatusChange(option.value);
                    }}
                >
                    {option.label}
                </Button>
            {/each}
        </div>
    </div>
</div>

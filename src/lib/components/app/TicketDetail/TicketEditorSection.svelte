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

<div
    class="space-y-2.5 rounded-lg border border-border/70 bg-surface-panel/70 p-2.5 sm:space-y-3 sm:p-3"
>
    <div>
        <label
            class="mb-2.5 block text-[12px] font-medium text-muted-foreground"
            for="ticket-title">Title</label
        >
        <Input
            id="ticket-title"
            value={title}
            class="h-8 border-border/70 bg-card/80 text-[12px]"
            placeholder="Ticket title"
            oninput={(event) => {
                onTitleChange((event.currentTarget as HTMLInputElement).value);
            }}
            onkeydown={onEditorKeyDown}
        />
    </div>

    <div>
        <label
            class="mb-2.5 block text-[12px] font-medium text-muted-foreground"
            for="ticket-label">Label</label
        >
        <Input
            id="ticket-label"
            value={label}
            class="h-8 border-border/70 bg-card/80 text-[12px]"
            placeholder="bug, feat, refactor (comma separated)"
            oninput={(event) => {
                onLabelChange((event.currentTarget as HTMLInputElement).value);
            }}
            onkeydown={onEditorKeyDown}
        />
    </div>

    <div>
        <p class="mb-2.5 text-[11px] font-medium text-muted-foreground">
            Status
        </p>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2">
            {#each statusOptions as option}
                <Button
                    size="sm"
                    variant={status === option.value ? "default" : "outline"}
                    class="h-8 justify-start rounded-md px-2 text-[11px] sm:h-7 sm:justify-center"
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

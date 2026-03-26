<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { TagInput } from "$lib/components/ui/tag-input";
    import type {
        TicketPriority,
        TicketStatus,
    } from "$lib/components/app/types.js";

    interface TicketEditorSectionProps {
        title: string;
        label: string;
        status: TicketStatus;
        priority: TicketPriority;
        statusOptions: Array<{ value: TicketStatus; label: string }>;
        priorityOptions: Array<{ value: TicketPriority; label: string }>;
        onTitleChange: (value: string) => void;
        onLabelChange: (value: string) => void;
        onStatusChange: (value: TicketStatus) => void;
        onPriorityChange: (value: TicketPriority) => void;
        onEditorKeyDown: (event: KeyboardEvent) => void;
    }

    let {
        title,
        label,
        status,
        priority,
        statusOptions,
        priorityOptions,
        onTitleChange,
        onLabelChange,
        onStatusChange,
        onPriorityChange,
        onEditorKeyDown,
    }: TicketEditorSectionProps = $props();

    function labelsFromText(value: string) {
        const parsed = value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

        return [...new Set(parsed)];
    }

    function labelsToText(values: string[]) {
        return values.join(", ");
    }

    let tags = $state<string[]>([]);

    $effect(() => {
        const nextTags = labelsFromText(label);

        if (labelsToText(tags) !== labelsToText(nextTags)) {
            tags = nextTags;
        }
    });
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
            for="ticket-labels">Labels</label
        >
        <div id="ticket-labels">
            <TagInput
                bind:tags
                placeholder="Add labels and press Enter"
                onadd={() => {
                    onLabelChange(labelsToText(tags));
                }}
                onremove={() => {
                    onLabelChange(labelsToText(tags));
                }}
            />
        </div>
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

    <div>
        <p class="mb-2.5 text-[11px] font-medium text-muted-foreground">
            Priority
        </p>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2">
            {#each priorityOptions as option}
                <Button
                    size="sm"
                    variant={priority === option.value ? "default" : "outline"}
                    class="h-8 justify-start rounded-md px-2 text-[11px] capitalize sm:h-7 sm:justify-center"
                    onclick={() => {
                        onPriorityChange(option.value);
                    }}
                >
                    {option.label}
                </Button>
            {/each}
        </div>
    </div>
</div>

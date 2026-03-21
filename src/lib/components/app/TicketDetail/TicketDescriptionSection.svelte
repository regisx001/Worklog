<script lang="ts">
    import { Textarea } from "$lib/components/ui/textarea/index.js";

    interface TicketDescriptionSectionProps {
        description: string;
        onDescriptionChange: (value: string) => void;
        onEditorKeyDown: (event: KeyboardEvent) => void;
    }

    let {
        description,
        onDescriptionChange,
        onEditorKeyDown,
    }: TicketDescriptionSectionProps = $props();

    const escapedDescription = $derived.by(() => {
        const text = description
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

        return text.replaceAll("\n", "<br />");
    });
</script>

<div
    class="space-y-1.5 rounded-lg border border-border/70 bg-surface-panel/70 p-2.5 sm:p-3"
>
    <label
        class="text-[11px] mb-2.5 block font-medium text-muted-foreground"
        for="ticket-description"
    >
        Description
    </label>
    <Textarea
        id="ticket-description"
        value={description}
        class="min-h-24 border-border/70 bg-card/80 text-[12px] sm:min-h-28"
        placeholder="What should be done? Use markdown style plain text."
        oninput={(event) => {
            onDescriptionChange(
                (event.currentTarget as HTMLTextAreaElement).value,
            );
        }}
        onkeydown={onEditorKeyDown}
    />
    <div
        class="prose prose-invert prose-p:my-1 max-w-none rounded-md border border-border/70 bg-muted/30 p-2 text-[11px]"
    >
        {@html escapedDescription}
    </div>
</div>

<script lang="ts">
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import { Markdown } from "$lib/components/ui/markdown";
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

    const markdownPreview = $derived(description.trim());
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
        class="min-h-28 border-border/70 bg-card/80 font-mono text-[12px] leading-relaxed sm:min-h-32"
        placeholder="# Summary

- What needs to be done
- Acceptance criteria

Use Markdown to format your notes."
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
        <Markdown
            content={markdownPreview.length > 0
                ? markdownPreview
                : "_Preview appears here as you write Markdown._"}
            class=""
        />
    </div>
</div>

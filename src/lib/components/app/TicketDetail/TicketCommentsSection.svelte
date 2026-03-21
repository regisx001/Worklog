<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import type { Comment } from "$lib/components/app/types.js";

    interface TicketCommentsSectionProps {
        comments: Comment[];
        newCommentDraft: string;
        onCommentChange: (value: string) => void;
        onAddComment: () => void;
        onEditorKeyDown: (event: KeyboardEvent) => void;
    }

    let {
        comments,
        newCommentDraft,
        onCommentChange,
        onAddComment,
        onEditorKeyDown,
    }: TicketCommentsSectionProps = $props();

    function formatTimestamp(timestamp: string) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return timestamp;
        }

        return date.toLocaleString(undefined, {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div
    class="space-y-2 rounded-lg border border-border/70 bg-surface-panel/70 p-2.5 sm:p-3"
>
    <p class="text-[11px] mb-2.5 block font-medium text-muted-foreground">
        Comments ({comments.length})
    </p>
    <div class="space-y-2">
        {#if comments.length === 0}
            <p
                class="rounded-md border border-dashed border-border/80 px-2.5 py-3 text-center text-[11px] text-muted-foreground"
            >
                No comments yet
            </p>
        {:else}
            {#each comments as comment, index (`${comment.author}-${comment.timestamp}-${index}`)}
                <div
                    class="rounded-md border border-border/80 bg-card/70 px-2 py-1.5"
                >
                    <div
                        class="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"
                    >
                        <span>{comment.author}</span>
                        <span>{formatTimestamp(comment.timestamp)}</span>
                    </div>
                    <p class="text-[11px] leading-relaxed">{comment.body}</p>
                </div>
            {/each}
        {/if}
    </div>
    <Textarea
        value={newCommentDraft}
        class="min-h-16 border-border/70 bg-card/80 text-[12px]"
        placeholder="Add comment and hit Enter on Add"
        oninput={(event) => {
            onCommentChange((event.currentTarget as HTMLTextAreaElement).value);
        }}
        onkeydown={onEditorKeyDown}
    />
    <div class="flex justify-end">
        <Button
            size="sm"
            variant="secondary"
            class="w-full sm:w-auto"
            onclick={onAddComment}>Add comment</Button
        >
    </div>
</div>

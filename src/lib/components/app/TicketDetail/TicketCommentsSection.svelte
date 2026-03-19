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
</script>

<div class="space-y-2">
    <p class="text-xs font-medium text-muted-foreground">Comments</p>
    <div class="space-y-2">
        {#if comments.length === 0}
            <p
                class="rounded-none border border-dashed border-border px-2.5 py-4 text-center text-xs text-muted-foreground"
            >
                No comments yet
            </p>
        {:else}
            {#each comments as comment, index (`${comment.author}-${comment.timestamp}-${index}`)}
                <div class="rounded-none border border-border/80 px-2.5 py-2">
                    <div
                        class="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"
                    >
                        <span>{comment.author}</span>
                        <span>{comment.timestamp}</span>
                    </div>
                    <p class="text-xs leading-relaxed">{comment.body}</p>
                </div>
            {/each}
        {/if}
    </div>
    <Textarea
        value={newCommentDraft}
        class="min-h-20"
        placeholder="Add comment and hit Enter on Add"
        oninput={(event) => {
            onCommentChange((event.currentTarget as HTMLTextAreaElement).value);
        }}
        onkeydown={onEditorKeyDown}
    />
    <div class="flex justify-end">
        <Button variant="secondary" onclick={onAddComment}>Add comment</Button>
    </div>
</div>

<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Sheet, SheetContent } from "$lib/components/ui/sheet/index.js";
    import TicketCommentsSection from "$lib/components/app/TicketDetail/TicketCommentsSection.svelte";
    import TicketDescriptionSection from "$lib/components/app/TicketDetail/TicketDescriptionSection.svelte";
    import TicketDetailHeader from "$lib/components/app/TicketDetail/TicketDetailHeader.svelte";
    import TicketEditorSection from "$lib/components/app/TicketDetail/TicketEditorSection.svelte";
    import type { Ticket, TicketStatus } from "$lib/components/app/types.js";

    interface TicketDetailPanelProps {
        open: boolean;
        ticket: Ticket | null;
        draftTitle: string;
        draftDescription: string;
        draftLabel: string;
        draftStatus: TicketStatus;
        statusOptions: Array<{ value: TicketStatus; label: string }>;
        newCommentDraft: string;
        onDraftTitleChange: (value: string) => void;
        onDraftDescriptionChange: (value: string) => void;
        onDraftLabelChange: (value: string) => void;
        onDraftStatusChange: (value: TicketStatus) => void;
        onNewCommentChange: (value: string) => void;
        onSaveTicket: () => void;
        onSubmitComment: () => void;
        onEditorKeyDown: (event: KeyboardEvent) => void;
    }

    let {
        open = $bindable(false),
        ticket,
        draftTitle,
        draftDescription,
        draftLabel,
        draftStatus,
        statusOptions,
        newCommentDraft,
        onDraftTitleChange,
        onDraftDescriptionChange,
        onDraftLabelChange,
        onDraftStatusChange,
        onNewCommentChange,
        onSaveTicket,
        onSubmitComment,
        onEditorKeyDown,
    }: TicketDetailPanelProps = $props();
</script>

<Sheet bind:open>
    <SheetContent
        side="right"
        class="w-140 max-w-[92vw] border-l border-border/80 p-0"
        aria-label="Ticket details"
    >
        {#if ticket}
            <div class="flex h-full flex-col">
                <TicketDetailHeader {ticket} />

                <Separator />

                <div
                    class="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
                >
                    <TicketEditorSection
                        title={draftTitle}
                        label={draftLabel}
                        status={draftStatus}
                        {statusOptions}
                        onTitleChange={onDraftTitleChange}
                        onLabelChange={onDraftLabelChange}
                        onStatusChange={onDraftStatusChange}
                        {onEditorKeyDown}
                    />

                    <TicketDescriptionSection
                        description={draftDescription}
                        onDescriptionChange={onDraftDescriptionChange}
                        {onEditorKeyDown}
                    />

                    <Separator />

                    <TicketCommentsSection
                        comments={ticket.comments}
                        newCommentDraft={newCommentDraft}
                        onCommentChange={onNewCommentChange}
                        onAddComment={onSubmitComment}
                        {onEditorKeyDown}
                    />
                </div>

                <Separator />

                <div class="flex items-center justify-end gap-2 px-4 py-3">
                    <Button variant="outline" onclick={() => (open = false)}
                        >Close</Button
                    >
                    <Button onclick={onSaveTicket}>Save changes</Button>
                </div>
            </div>
        {:else}
            <div
                class="flex h-full items-center justify-center p-6 text-xs text-muted-foreground"
            >
                Pick a ticket to inspect
            </div>
        {/if}
    </SheetContent>
</Sheet>

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

    const hasDraftChanges = $derived.by(() => {
        if (!ticket) return false;

        const currentLabel = ticket.labels[0] ?? "";
        return (
            draftTitle.trim() !== ticket.title.trim() ||
            draftDescription.trim() !== ticket.description.trim() ||
            draftLabel.trim() !== currentLabel.trim() ||
            draftStatus !== ticket.status
        );
    });

    const hasPendingComment = $derived.by(
        () => newCommentDraft.trim().length > 0,
    );
</script>

<Sheet bind:open>
    <SheetContent
        side="right"
        overlayClass="top-[var(--app-toolbar-height)]"
        class="w-140 max-w-[92vw] border-l border-border/80 p-0 text-[12px] data-[side=right]:top-[var(--app-toolbar-height)] data-[side=right]:h-[calc(100dvh-var(--app-toolbar-height))]"
        aria-label="Ticket details"
    >
        {#if ticket}
            <div class="flex h-full flex-col">
                <TicketDetailHeader {ticket} />

                <Separator />

                <div
                    class="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
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
                        {newCommentDraft}
                        onCommentChange={onNewCommentChange}
                        onAddComment={onSubmitComment}
                        {onEditorKeyDown}
                    />
                </div>

                <Separator />

                <div class="flex items-center justify-between gap-2 px-3 py-2">
                    <div class="text-[11px] text-muted-foreground">
                        <span
                            >{hasDraftChanges
                                ? "Unsaved edits"
                                : "All edits saved"}</span
                        >
                        {#if hasPendingComment}
                            <span class="ml-2 text-chart-4"
                                >Comment draft pending</span
                            >
                        {/if}
                        <span class="ml-2">Ctrl/Cmd+Enter to save</span>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => (open = false)}
                        >
                            Close
                        </Button>
                        <Button
                            size="sm"
                            onclick={onSaveTicket}
                            disabled={!hasDraftChanges}
                        >
                            {hasDraftChanges ? "Save changes" : "Saved"}
                        </Button>
                    </div>
                </div>
            </div>
        {:else}
            <div
                class="flex h-full items-center justify-center p-6 text-[11px] text-muted-foreground"
            >
                Pick a ticket to inspect
            </div>
        {/if}
    </SheetContent>
</Sheet>

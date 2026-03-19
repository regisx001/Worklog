<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Sheet, SheetContent } from "$lib/components/ui/sheet/index.js";
    import { useTicketDraft } from "$lib/hooks/ticket-draft.svelte";
    import TicketCommentsSection from "$lib/components/app/TicketDetail/TicketCommentsSection.svelte";
    import TicketDescriptionSection from "$lib/components/app/TicketDetail/TicketDescriptionSection.svelte";
    import TicketDetailHeader from "$lib/components/app/TicketDetail/TicketDetailHeader.svelte";
    import TicketEditorSection from "$lib/components/app/TicketDetail/TicketEditorSection.svelte";
    import type { Ticket } from "./types.js";

    interface TicketDetailPanelProps {
        open: boolean;
        ticket: Ticket | null;
        onUpdateTicket: (
            ticketId: string,
            updates: Partial<
                Pick<Ticket, "title" | "description" | "status" | "labels">
            >,
        ) => void;
        onAddComment: (ticketId: string, body: string) => void;
    }

    let {
        open = $bindable(false),
        ticket,
        onUpdateTicket,
        onAddComment,
    }: TicketDetailPanelProps = $props();

    const ticketDraft = useTicketDraft({
        getTicket: () => ticket,
        onUpdateTicket: (ticketId, updates) => {
            onUpdateTicket(ticketId, updates);
        },
        onAddComment: (ticketId, body) => {
            onAddComment(ticketId, body);
        },
    });

    function onEditorKeyDown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            ticketDraft.saveTicket();
        }
    }
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

                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <div
                    class="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
                >
                    <TicketEditorSection
                        title={ticketDraft.draftTitle}
                        label={ticketDraft.draftLabel}
                        status={ticketDraft.draftStatus}
                        statusOptions={ticketDraft.statusOptions}
                        onTitleChange={ticketDraft.setDraftTitle}
                        onLabelChange={ticketDraft.setDraftLabel}
                        onStatusChange={ticketDraft.setDraftStatus}
                        {onEditorKeyDown}
                    />

                    <TicketDescriptionSection
                        description={ticketDraft.draftDescription}
                        onDescriptionChange={ticketDraft.setDraftDescription}
                        {onEditorKeyDown}
                    />

                    <Separator />

                    <TicketCommentsSection
                        comments={ticket.comments}
                        newCommentDraft={ticketDraft.newComment}
                        onCommentChange={ticketDraft.setNewComment}
                        onAddComment={ticketDraft.addComment}
                        {onEditorKeyDown}
                    />
                </div>

                <Separator />

                <div class="flex items-center justify-end gap-2 px-4 py-3">
                    <Button variant="outline" onclick={() => (open = false)}
                        >Close</Button
                    >
                    <Button onclick={ticketDraft.saveTicket}
                        >Save changes</Button
                    >
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

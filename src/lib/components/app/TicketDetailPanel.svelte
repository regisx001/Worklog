<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import {
        Sheet,
        SheetContent,
        SheetDescription,
        SheetHeader,
        SheetTitle,
    } from "$lib/components/ui/sheet/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import type { Ticket, TicketStatus } from "./types.js";

    interface TicketDetailPanelProps {
        open: boolean;
        ticket: Ticket | null;
        onUpdateTicket: (
            ticketId: string,
            updates: Partial<
                Pick<Ticket, "title" | "description" | "status" | "label">
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

    let draftTitle = $state("");
    let draftDescription = $state("");
    let draftLabel = $state("");
    let draftStatus = $state<TicketStatus>("todo");
    let newComment = $state("");

    $effect(() => {
        if (!ticket) return;
        draftTitle = ticket.title;
        draftDescription = ticket.description;
        draftLabel = ticket.label;
        draftStatus = ticket.status;
        newComment = "";
    });

    const escapedDescription = $derived.by(() => {
        const text = draftDescription
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

        return text.replaceAll("\n", "<br />");
    });

    function saveTicket() {
        if (!ticket) return;
        onUpdateTicket(ticket.id, {
            title: draftTitle.trim() || ticket.title,
            description: draftDescription.trim(),
            label: draftLabel.trim() || "general",
            status: draftStatus,
        });
    }

    function addComment() {
        if (!ticket || !newComment.trim()) return;
        onAddComment(ticket.id, newComment.trim());
        newComment = "";
    }

    function onEditorKeyDown(event: KeyboardEvent) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            saveTicket();
        }
    }

    const statusOptions: Array<{ value: TicketStatus; label: string }> = [
        { value: "todo", label: "Todo" },
        { value: "in-progress", label: "In Progress" },
        { value: "done", label: "Done" },
    ];
</script>

<Sheet bind:open>
    <SheetContent
        side="right"
        class="w-[560px] max-w-[92vw] border-l border-border/80 p-0"
        aria-label="Ticket details"
    >
        {#if ticket}
            <div class="flex h-full flex-col">
                <SheetHeader class="gap-1 px-4 py-3">
                    <div class="flex items-center gap-2">
                        <SheetTitle class="text-sm font-semibold"
                            >{ticket.id}</SheetTitle
                        >
                        <Badge variant="outline" class="uppercase"
                            >{ticket.label}</Badge
                        >
                    </div>
                    <SheetDescription class="text-xs text-muted-foreground">
                        Inline editing enabled. Save with Ctrl/Cmd+Enter.
                    </SheetDescription>
                </SheetHeader>

                <Separator />

                <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <div
                    class="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
                >
                    <div class="space-y-1.5">
                        <label
                            class="text-xs font-medium text-muted-foreground"
                            for="ticket-title">Title</label
                        >
                        <Input
                            id="ticket-title"
                            bind:value={draftTitle}
                            placeholder="Ticket title"
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
                            bind:value={draftLabel}
                            placeholder="bug, feat, refactor..."
                            onkeydown={onEditorKeyDown}
                        />
                    </div>

                    <div class="space-y-1.5">
                        <p class="text-xs font-medium text-muted-foreground">
                            Status
                        </p>
                        <div class="grid grid-cols-3 gap-2">
                            {#each statusOptions as option}
                                <Button
                                    variant={draftStatus === option.value
                                        ? "default"
                                        : "outline"}
                                    onclick={() => {
                                        draftStatus = option.value;
                                    }}
                                >
                                    {option.label}
                                </Button>
                            {/each}
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <label
                            class="text-xs font-medium text-muted-foreground"
                            for="ticket-description"
                        >
                            Description (markdown)
                        </label>
                        <Textarea
                            id="ticket-description"
                            bind:value={draftDescription}
                            class="min-h-36"
                            placeholder="What should be done? Use markdown style plain text."
                            onkeydown={onEditorKeyDown}
                        />
                        <div
                            class="prose prose-invert prose-p:my-1 max-w-none rounded-none border border-border bg-muted/20 p-2.5 text-xs"
                        >
                            {@html escapedDescription}
                        </div>
                    </div>

                    <Separator />

                    <div class="space-y-2">
                        <p class="text-xs font-medium text-muted-foreground">
                            Comments
                        </p>
                        <div class="space-y-2">
                            {#if ticket.comments.length === 0}
                                <p
                                    class="rounded-none border border-dashed border-border px-2.5 py-4 text-center text-xs text-muted-foreground"
                                >
                                    No comments yet
                                </p>
                            {:else}
                                {#each ticket.comments as comment (comment.id)}
                                    <div
                                        class="rounded-none border border-border/80 px-2.5 py-2"
                                    >
                                        <div
                                            class="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"
                                        >
                                            <span>{comment.author}</span>
                                            <span>{comment.createdAt}</span>
                                        </div>
                                        <p class="text-xs leading-relaxed">
                                            {comment.body}
                                        </p>
                                    </div>
                                {/each}
                            {/if}
                        </div>
                        <Textarea
                            bind:value={newComment}
                            class="min-h-20"
                            placeholder="Add comment and hit Enter on Add"
                            onkeydown={onEditorKeyDown}
                        />
                        <div class="flex justify-end">
                            <Button variant="secondary" onclick={addComment}
                                >Add comment</Button
                            >
                        </div>
                    </div>
                </div>

                <Separator />

                <div class="flex items-center justify-end gap-2 px-4 py-3">
                    <Button variant="outline" onclick={() => (open = false)}
                        >Close</Button
                    >
                    <Button onclick={saveTicket}>Save changes</Button>
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

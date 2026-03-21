import type { Ticket, TicketStatus, UpdateTicketInput } from "$lib/components/app/types";

interface UseTicketDraftOptions {
    getTicket: () => Ticket | null;
    onUpdateTicket: (ticketId: string, updates: UpdateTicketInput) => void;
    onAddComment: (ticketId: string, body: string) => void;
}

export function useTicketDraft(options: UseTicketDraftOptions) {
    const { getTicket, onUpdateTicket, onAddComment } = options;

    let draftTitle = $state("");
    let draftDescription = $state("");
    let draftLabel = $state("");
    let draftStatus = $state<TicketStatus>("todo");
    let newComment = $state("");

    const statusOptions: Array<{ value: TicketStatus; label: string }> = [
        { value: "todo", label: "Todo" },
        { value: "in_progress", label: "In Progress" },
        { value: "done", label: "Done" },
    ];

    function labelsToDraft(labels: string[]) {
        const sanitized = labels
            .map((label) => label.trim())
            .filter((label) => label.length > 0);
        return sanitized.join(", ");
    }

    function draftToLabels(value: string) {
        const parsed = value
            .split(",")
            .map((label) => label.trim())
            .filter((label) => label.length > 0);

        // Preserve first-seen order while avoiding duplicate labels.
        return [...new Set(parsed)];
    }

    $effect(() => {
        const ticket = getTicket();
        if (!ticket) return;

        draftTitle = ticket.title;
        draftDescription = ticket.description;
        draftLabel = labelsToDraft(ticket.labels);
        draftStatus = ticket.status;
        newComment = "";
    });

    function saveTicket() {
        const ticket = getTicket();
        if (!ticket) return;

        const nextLabels = draftToLabels(draftLabel);

        onUpdateTicket(ticket.id, {
            title: draftTitle.trim() || ticket.title,
            description: draftDescription.trim(),
            labels: nextLabels.length > 0 ? nextLabels : ["general"],
            status: draftStatus,
        });
    }

    function addComment() {
        const ticket = getTicket();
        if (!ticket || !newComment.trim()) return;

        onAddComment(ticket.id, newComment.trim());
        newComment = "";
    }

    return {
        get draftTitle() {
            return draftTitle;
        },
        get draftDescription() {
            return draftDescription;
        },
        get draftLabel() {
            return draftLabel;
        },
        get draftStatus() {
            return draftStatus;
        },
        get newComment() {
            return newComment;
        },
        get statusOptions() {
            return statusOptions;
        },
        setDraftTitle(value: string) {
            draftTitle = value;
        },
        setDraftDescription(value: string) {
            draftDescription = value;
        },
        setDraftLabel(value: string) {
            draftLabel = value;
        },
        setDraftStatus(value: TicketStatus) {
            draftStatus = value;
        },
        setNewComment(value: string) {
            newComment = value;
        },
        saveTicket,
        addComment,
    };
}

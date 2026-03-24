import type {
    Ticket,
    TicketPriority,
    TicketStatus,
    UpdateTicketInput,
} from "$lib/components/app/types";

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
    let draftPriority = $state<TicketPriority>("medium");
    let newComment = $state("");

    const statusOptions: Array<{ value: TicketStatus; label: string }> = [
        { value: "todo", label: "Todo" },
        { value: "in_progress", label: "In Progress" },
        { value: "done", label: "Done" },
    ];

    const priorityOptions: Array<{ value: TicketPriority; label: string }> = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
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
        draftPriority = ticket.priority;
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
            priority: draftPriority,
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
        get draftPriority() {
            return draftPriority;
        },
        get newComment() {
            return newComment;
        },
        get statusOptions() {
            return statusOptions;
        },
        get priorityOptions() {
            return priorityOptions;
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
        setDraftPriority(value: TicketPriority) {
            draftPriority = value;
        },
        setNewComment(value: string) {
            newComment = value;
        },
        saveTicket,
        addComment,
    };
}

import type {
    Ticket,
    TicketPriority,
    TicketStatus,
    TicketType,
    UpdateTicketInput,
} from "$lib/components/app/types";
import { TICKET_TYPE_OPTIONS, TICKET_TYPE_CONFIG } from "$lib/components/app/types";

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
    let draftPriority = $state<TicketPriority>("p2");
    let draftTicketType = $state<TicketType>("feature");
    let newComment = $state("");

    const statusOptions: Array<{ value: TicketStatus; label: string }> = [
        { value: "backlog", label: "Backlog" },
        { value: "todo", label: "Todo" },
        { value: "in_progress", label: "In Progress" },
        { value: "done", label: "Done" },
    ];

    const priorityOptions: Array<{ value: TicketPriority; label: string }> = [
        { value: "p1", label: "P1" },
        { value: "p2", label: "P2" },
        { value: "p3", label: "P3" },
    ];

    const ticketTypeOptions: Array<{ value: TicketType; label: string }> =
        TICKET_TYPE_OPTIONS.map((type) => ({
            value: type,
            label: TICKET_TYPE_CONFIG[type].label,
        }));

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
        draftTicketType = ticket.ticket_type;
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
            ticket_type: draftTicketType,
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
        get draftTicketType() {
            return draftTicketType;
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
        get ticketTypeOptions() {
            return ticketTypeOptions;
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
        setDraftTicketType(value: TicketType) {
            draftTicketType = value;
        },
        setNewComment(value: string) {
            newComment = value;
        },
        saveTicket,
        addComment,
    };
}

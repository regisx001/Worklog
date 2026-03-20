import type {
    Board,
    SyncState,
    Ticket,
    TicketStatus,
} from "$lib/components/app/types.js";

export interface WorkspaceShellContext {
    get boards(): Board[];
    get activeBoardId(): string | null;
    get syncState(): SyncState;
    get todoTickets(): Ticket[];
    get inProgressTickets(): Ticket[];
    get doneTickets(): Ticket[];
    get selectedTicketId(): string | null;
    get pendingChanges(): number;
    onCreateBoard: () => void;
    onSelectBoard: (boardId: string) => void;
    onCreateTicketForBoard: (boardId: string) => void;
    onDeleteBoard: (boardId: string) => void;
    onOpenPalette: () => void;
    onOpenSettings: () => void;
    onCreateTicket: () => void;
    onSelectTicket: (ticketId: string) => void;
    onDropTicket: (ticketId: string, status: TicketStatus) => void;
    onQuickMoveTicket: (ticketId: string) => void;
    onMoveTicketToStatus: (ticketId: string, status: TicketStatus) => void;
    onDeleteTicket: (ticketId: string) => void;
    onManualSync: () => void;
}

export const workspaceShellContextKey = Symbol("workspace-shell-context");

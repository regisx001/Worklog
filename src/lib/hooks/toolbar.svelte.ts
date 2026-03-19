import type { SyncState } from "$lib/components/app/types.js";

export interface ToolbarState {
    projectName: string;
    pendingChanges: number;
    syncState: SyncState;
    onOpenPalette: () => void;
    onCreateTicket: () => void;
    onManualSync: () => void;
}

const noop = () => { };

const initialToolbarState: ToolbarState = {
    projectName: "Project",
    pendingChanges: 0,
    syncState: "up_to_date",
    onOpenPalette: noop,
    onCreateTicket: noop,
    onManualSync: noop,
};

export const toolbarState = $state<ToolbarState>({ ...initialToolbarState });

export function setToolbarState(next: Partial<ToolbarState>) {
    Object.assign(toolbarState, next);
}

export function resetToolbarState() {
    Object.assign(toolbarState, initialToolbarState);
}
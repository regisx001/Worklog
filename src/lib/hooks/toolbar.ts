import { writable } from "svelte/store";
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

export const toolbarState = writable<ToolbarState>(initialToolbarState);

export function setToolbarState(next: Partial<ToolbarState>) {
    toolbarState.update((current) => ({ ...current, ...next }));
}

export function resetToolbarState() {
    toolbarState.set(initialToolbarState);
}

import { useCommandPalette } from "$lib/hooks/command-palette.svelte";
import type { CommandAction } from "$lib/components/app/types";

// ── Shortcut Definitions ───────────────────────────────────────────────────
// Each shortcut maps a key combo to a handler function.

export interface ShortcutDef {
    /** Key to match (e.g. "k", "n", "b") */
    key: string;
    /** Whether Ctrl (or Cmd on macOS) is required */
    ctrlOrCmd: boolean;
    /** Whether Shift is required */
    shift?: boolean;
    /** Description for display */
    label: string;
    /** Handler to execute */
    run: () => void;
}

/**
 * Returns true if the given keyboard event matches the shortcut.
 */
function matchesShortcut(e: KeyboardEvent, shortcut: ShortcutDef): boolean {
    const ctrlOrCmd = e.ctrlKey || e.metaKey;

    if (shortcut.ctrlOrCmd && !ctrlOrCmd) return false;
    if (!shortcut.ctrlOrCmd && ctrlOrCmd) return false;
    if (shortcut.shift && !e.shiftKey) return false;
    if (!shortcut.shift && e.shiftKey) return false;

    return e.key.toLowerCase() === shortcut.key.toLowerCase();
}

/**
 * Format a shortcut for display (e.g. "Ctrl + K" or "⌘ + K").
 * Detects macOS at runtime.
 */
function formatShortcut(shortcut: ShortcutDef): string {
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
    const parts: string[] = [];

    if (shortcut.ctrlOrCmd) {
        parts.push(isMac ? "⌘" : "Ctrl");
    }
    if (shortcut.shift) {
        parts.push("Shift");
    }
    parts.push(shortcut.key.toUpperCase());

    return parts.join(" + ");
}

// ── Build Command Actions ──────────────────────────────────────────────────
// Creates the full set of command palette actions from app-level callbacks.

export interface AppCallbacks {
    openSettings: () => void;
    createBoard: () => void;
    createTicket: () => void;
    goToWorkspace: () => void;
    toggleTheme: () => void;
    refreshApp: () => void;
    closeWorkspace: () => void;
    openWorkspace: () => void;
}

export function buildCommandActions(callbacks: AppCallbacks): CommandAction[] {
    return [
        {
            id: "open-command-palette",
            label: "Command Palette",
            subtitle: "Search and run commands",
            shortcut: formatShortcut({ key: "k", ctrlOrCmd: true, label: "" , run: () => {} }),
            run: () => { /* handled by shortcut directly */ },
        },
        {
            id: "create-ticket",
            label: "Create Ticket",
            subtitle: "Add a new ticket to the active board",
            shortcut: formatShortcut({ key: "n", ctrlOrCmd: true, label: "", run: () => {} }),
            run: callbacks.createTicket,
        },
        {
            id: "create-board",
            label: "Create Board",
            subtitle: "Create a new board in the workspace",
            shortcut: formatShortcut({ key: "b", ctrlOrCmd: true, label: "", run: () => {} }),
            run: callbacks.createBoard,
        },
        {
            id: "open-settings",
            label: "Open Settings",
            subtitle: "Workspace preferences and diagnostics",
            shortcut: formatShortcut({ key: ",", ctrlOrCmd: true, label: "", run: () => {} }),
            run: callbacks.openSettings,
        },
        {
            id: "go-to-workspace",
            label: "Go to Workspace",
            subtitle: "Navigate to the workspace board list",
            shortcut: formatShortcut({ key: "h", ctrlOrCmd: true, label: "", run: () => {} }),
            run: callbacks.goToWorkspace,
        },
        {
            id: "toggle-theme",
            label: "Toggle Theme",
            subtitle: "Switch between light and dark mode",
            shortcut: formatShortcut({ key: "j", ctrlOrCmd: true, label: "", run: () => {} }),
            run: callbacks.toggleTheme,
        },
        {
            id: "refresh-app",
            label: "Refresh Application",
            subtitle: "Reload the application window",
            shortcut: formatShortcut({ key: "r", ctrlOrCmd: true, shift: true, label: "", run: () => {} }),
            run: callbacks.refreshApp,
        },
        {
            id: "close-workspace",
            label: "Close Workspace",
            subtitle: "Close the current workspace and return to selector",
            shortcut: formatShortcut({ key: "w", ctrlOrCmd: true, shift: true, label: "", run: () => {} }),
            run: callbacks.closeWorkspace,
        },
        {
            id: "open-workspace",
            label: "Open Workspace",
            subtitle: "Open a different workspace folder",
            shortcut: formatShortcut({ key: "o", ctrlOrCmd: true, label: "", run: () => {} }),
            run: callbacks.openWorkspace,
        },
    ];
}

// ── Build Shortcut Definitions ─────────────────────────────────────────────
// Maps keybindings to their action handlers.

export function buildShortcuts(callbacks: AppCallbacks & { openCommandPalette: () => void }): ShortcutDef[] {
    return [
        { key: "k", ctrlOrCmd: true, label: "Open Command Palette", run: callbacks.openCommandPalette },
        { key: "n", ctrlOrCmd: true, label: "Create Ticket", run: callbacks.createTicket },
        { key: "b", ctrlOrCmd: true, label: "Create Board", run: callbacks.createBoard },
        { key: ",", ctrlOrCmd: true, label: "Open Settings", run: callbacks.openSettings },
        { key: "h", ctrlOrCmd: true, label: "Go to Workspace", run: callbacks.goToWorkspace },
        { key: "j", ctrlOrCmd: true, label: "Toggle Theme", run: callbacks.toggleTheme },
        { key: "r", ctrlOrCmd: true, shift: true, label: "Refresh Application", run: callbacks.refreshApp },
        { key: "w", ctrlOrCmd: true, shift: true, label: "Close Workspace", run: callbacks.closeWorkspace },
        { key: "o", ctrlOrCmd: true, label: "Open Workspace", run: callbacks.openWorkspace },
    ];
}

/**
 * Global keyboard event handler.
 * Returns true if a shortcut was matched and executed.
 */
export function handleGlobalShortcut(e: KeyboardEvent, shortcuts: ShortcutDef[]): boolean {
    // Don't intercept when typing in inputs (except for Ctrl+K)
    const target = e.target as HTMLElement;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

    for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut)) {
            // Only allow Ctrl+K and Escape in inputs
            if (isInput && shortcut.key !== "k") {
                continue;
            }

            e.preventDefault();
            e.stopPropagation();
            shortcut.run();
            return true;
        }
    }

    return false;
}

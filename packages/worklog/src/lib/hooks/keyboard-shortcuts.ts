import { getCommandPalette } from "$lib/hooks/command-palette.svelte";
import type { CommandAction } from "$lib/components/app/types";
import * as m from "$lib/paraglide/messages.js";
import {
    Search,
    Add,
    Dashboard,
    Settings,
    Home,
    Asleep,
    Renew,
    Close,
    FolderOpen,
    Download,
    Upload,
    Undo,
    Redo,
} from "carbon-icons-svelte";

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
    exportData: () => void;
    importData: () => void;
    undo: () => void;
    redo: () => void;
}

export function buildCommandActions(callbacks: AppCallbacks): CommandAction[] {
    return [
        {
            id: "open-command-palette",
            label: m.command_palette_label(),
            subtitle: m.command_palette_subtitle(),
            shortcut: formatShortcut({ key: "k", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Application",
            icon: Search,
            run: () => { /* handled by shortcut directly */ },
        },
        {
            id: "create-ticket",
            label: m.command_create_ticket(),
            subtitle: m.command_create_ticket_subtitle(),
            shortcut: formatShortcut({ key: "n", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Actions",
            icon: Add,
            run: callbacks.createTicket,
        },
        {
            id: "create-board",
            label: m.command_create_board(),
            subtitle: m.command_create_board_subtitle(),
            shortcut: formatShortcut({ key: "b", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Actions",
            icon: Dashboard,
            run: callbacks.createBoard,
        },
        {
            id: "open-settings",
            label: m.command_open_settings(),
            subtitle: m.command_open_settings_subtitle(),
            shortcut: formatShortcut({ key: ",", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Navigation",
            icon: Settings,
            run: callbacks.openSettings,
        },
        {
            id: "go-to-workspace",
            label: m.command_go_to_workspace(),
            subtitle: m.command_go_to_workspace_subtitle(),
            shortcut: formatShortcut({ key: "h", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Navigation",
            icon: Home,
            run: callbacks.goToWorkspace,
        },
        {
            id: "toggle-theme",
            label: m.command_toggle_theme(),
            subtitle: m.command_toggle_theme_subtitle(),
            shortcut: formatShortcut({ key: "j", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Application",
            icon: Asleep,
            run: callbacks.toggleTheme,
        },
        {
            id: "refresh-app",
            label: m.command_refresh_app(),
            subtitle: m.command_refresh_app_subtitle(),
            shortcut: formatShortcut({ key: "r", ctrlOrCmd: true, shift: true, label: "", run: () => { } }),
            category: "Application",
            icon: Renew,
            run: callbacks.refreshApp,
        },
        {
            id: "close-workspace",
            label: m.command_close_workspace(),
            subtitle: m.command_close_workspace_subtitle(),
            shortcut: formatShortcut({ key: "w", ctrlOrCmd: true, shift: true, label: "", run: () => { } }),
            category: "Workspace",
            icon: Close,
            run: callbacks.closeWorkspace,
        },
        {
            id: "open-workspace",
            label: m.command_open_workspace(),
            subtitle: m.command_open_workspace_subtitle(),
            shortcut: formatShortcut({ key: "o", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Workspace",
            icon: FolderOpen,
            run: callbacks.openWorkspace,
        },
        {
            id: "export-data",
            label: m.command_export_data(),
            subtitle: m.command_export_data_subtitle(),
            shortcut: formatShortcut({ key: "e", ctrlOrCmd: true, shift: true, label: "", run: () => { } }),
            category: "Actions",
            icon: Download,
            run: callbacks.exportData,
        },
        {
            id: "import-data",
            label: m.command_import_data(),
            subtitle: m.command_import_data_subtitle(),
            shortcut: "",
            category: "Actions",
            icon: Upload,
            run: callbacks.importData,
        },
        {
            id: "undo",
            label: m.command_undo(),
            subtitle: m.command_undo_subtitle(),
            shortcut: formatShortcut({ key: "z", ctrlOrCmd: true, label: "", run: () => { } }),
            category: "Actions",
            icon: Undo,
            run: callbacks.undo,
        },
        {
            id: "redo",
            label: m.command_redo(),
            subtitle: m.command_redo_subtitle(),
            shortcut: formatShortcut({ key: "z", ctrlOrCmd: true, shift: true, label: "", run: () => { } }),
            category: "Actions",
            icon: Redo,
            run: callbacks.redo,
        },
    ];
}

// ── Build Shortcut Definitions ─────────────────────────────────────────────
// Maps keybindings to their action handlers.

export function buildShortcuts(callbacks: AppCallbacks & { openCommandPalette: () => void }): ShortcutDef[] {
    return [
        { key: "k", ctrlOrCmd: true, label: m.toolbar_open_command_palette(), run: callbacks.openCommandPalette },
        { key: "n", ctrlOrCmd: true, label: m.command_create_ticket(), run: callbacks.createTicket },
        { key: "b", ctrlOrCmd: true, label: m.command_create_board(), run: callbacks.createBoard },
        { key: ",", ctrlOrCmd: true, label: m.command_open_settings(), run: callbacks.openSettings },
        { key: "h", ctrlOrCmd: true, label: m.command_go_to_workspace(), run: callbacks.goToWorkspace },
        { key: "j", ctrlOrCmd: true, label: m.command_toggle_theme(), run: callbacks.toggleTheme },
        { key: "r", ctrlOrCmd: true, shift: true, label: m.command_refresh_app(), run: callbacks.refreshApp },
        { key: "w", ctrlOrCmd: true, shift: true, label: m.command_close_workspace(), run: callbacks.closeWorkspace },
        { key: "o", ctrlOrCmd: true, label: m.command_open_workspace(), run: callbacks.openWorkspace },
        { key: "e", ctrlOrCmd: true, shift: true, label: m.command_export_data(), run: callbacks.exportData },
        { key: "z", ctrlOrCmd: true, label: m.command_undo(), run: callbacks.undo },
        { key: "z", ctrlOrCmd: true, shift: true, label: m.command_redo(), run: callbacks.redo },
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

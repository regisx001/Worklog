import type { CommandAction } from "$lib/components/app/types";

// ── Command Palette State ──────────────────────────────────────────────────
// Module-level runes state shared across the app.

let _open = $state(false);
let _query = $state("");
let _actions = $state<CommandAction[]>([]);
let _selectedIndex = $state(0);

export function useCommandPalette() {

    function open() {
        _open = true;
        _query = "";
        _selectedIndex = 0;
    }

    function close() {
        _open = false;
        _query = "";
        _selectedIndex = 0;
    }

    function toggle() {
        if (_open) {
            close();
        } else {
            open();
        }
    }

    function setQuery(q: string) {
        _query = q;
        _selectedIndex = 0;
    }

    function setSelectedIndex(idx: number) {
        _selectedIndex = idx;
    }

    function registerActions(actions: CommandAction[]) {
        _actions = actions;
    }

    function runAction(action: CommandAction) {
        close();
        action.run();
    }

    return {
        get isOpen() { return _open; },
        get query() { return _query; },
        get actions() { return _actions; },
        get selectedIndex() { return _selectedIndex; },
        open,
        close,
        toggle,
        setQuery,
        setSelectedIndex,
        registerActions,
        runAction,
    };
}

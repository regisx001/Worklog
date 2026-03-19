import type { WorkspaceMeta } from '$lib/components/app/types';
import { getDb, closeDb, WorkspaceRepo } from '$lib/db';
import { runMigrations } from '$lib/db/migrate';

const WORKSPACE_PATH_KEY = 'last_workspace_path';
let initInFlight: Promise<void> | null = null;

function getSavedWorkspacePath(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage.getItem(WORKSPACE_PATH_KEY);
    } catch {
        return null;
    }
}

function saveWorkspacePath(path: string) {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(WORKSPACE_PATH_KEY, path);
    } catch {
        // Ignore storage failures and continue with in-memory app state.
    }
}

function clearSavedWorkspacePath() {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.removeItem(WORKSPACE_PATH_KEY);
    } catch {
        // Ignore storage failures and continue with in-memory app state.
    }
}

type WorkspaceStatus =
    | 'idle'        // app just opened, checking persisted path
    | 'no_workspace'// no saved path or path invalid — show open screen
    | 'loading'     // initializing DB
    | 'ready'       // fully loaded, show board view
    | 'error'       // something went wrong

let _path = $state<string | null>(null);
let _meta = $state<WorkspaceMeta | null>(null);
let _status = $state<WorkspaceStatus>('idle');
let _error = $state<string | null>(null);

export function useWorkspace() {

    // Called once on app boot from +layout.svelte
    async function init() {
        if (_status === 'ready' && _path) return;
        if (initInFlight) return initInFlight;

        initInFlight = (async () => {
            try {
                _status = 'idle';
                _error = null;

                const saved = getSavedWorkspacePath();
                if (!saved) {
                    _status = 'no_workspace';
                    return;
                }

                await open_workspace(saved);

                if (_path !== saved) {
                    _path = null;
                    _meta = null;
                    clearSavedWorkspacePath();
                    _status = 'no_workspace';
                }
            } catch (e) {
                _error = String(e);
                _status = 'error';
            } finally {
                initInFlight = null;
            }
        })();

        return initInFlight;
    }

    // Called when user picks a folder via OS dialog
    async function pick() {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({ directory: true, multiple: false });
            if (!selected) return; // user cancelled
            await open_workspace(selected as string);
        } catch (e) {
            _error = String(e);
            _status = 'error';
        }
    }

    async function open_workspace(path: string) {
        try {
            _status = 'loading';
            _error = null;

            const db = await getDb(path);
            await runMigrations(db);
            await WorkspaceRepo.initWorkspace(db, path.split('/').pop() ?? 'My Workspace');

            _meta = await WorkspaceRepo.getWorkspaceMeta(db);
            _path = path;

            saveWorkspacePath(path);

            _status = 'ready';
        } catch (e) {
            _error = String(e);
            _status = 'error';
        }
    }

    async function close() {
        await closeDb();
        clearSavedWorkspacePath();
        _path = null;
        _meta = null;
        _status = 'no_workspace';
        _error = null;
    }

    return {
        get path() { return _path },
        get meta() { return _meta },
        get status() { return _status },
        get error() { return _error },
        init, pick, close
    };
}

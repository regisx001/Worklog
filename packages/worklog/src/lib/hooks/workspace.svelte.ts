import type { WorkspaceMeta } from '$lib/components/app/types';
import { getDb, closeDb, WorkspaceRepo } from '$lib/db';
import { runMigrations } from '$lib/db/migrate';
import * as m from "$lib/paraglide/messages.js";

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

/** Normalize Windows backslashes to forward slashes for consistent path handling. */
function normalizePath(p: string): string {
    return p.replaceAll('\\', '/');
}

/** Classify common Tauri errors into user-friendly messages. */
function classifyWorkspaceError(raw: string): string {
    // Tauri filesystem scope violations (Windows "forbidden path")
    if (
        raw.toLowerCase().includes('forbidden') ||
        raw.toLowerCase().includes('not allowed') ||
        raw.toLowerCase().includes('permission denied') ||
        raw.includes('tauri::fs') ||
        raw.includes('not permitted')
    ) {
        return m.workspace_folder_not_accessible();
    }
    return raw;
}

let _path = $state<string | null>(null);
let _meta = $state<WorkspaceMeta | null>(null);
let _status = $state<WorkspaceStatus>('idle');
let _error = $state<string | null>(null);

export function getWorkspace() {

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

                const resolved = normalizePath(saved);
                await open_workspace(resolved);

                if (_path !== resolved) {
                    _path = null;
                    _meta = null;
                    clearSavedWorkspacePath();
                    _status = 'no_workspace';
                }
            } catch (e) {
                const msg = String(e);
                _error = classifyWorkspaceError(msg);

                // If the saved path is no longer accessible (e.g. drive removed,
                // permissions changed), clear it so the next launch goes straight
                // to the workspace selector instead of re-triggering the error.
                if (
                    msg.toLowerCase().includes('forbidden') ||
                    msg.toLowerCase().includes('not allowed') ||
                    msg.toLowerCase().includes('permission denied') ||
                    msg.toLowerCase().includes('no such file or directory') ||
                    msg.toLowerCase().includes('enosys')
                ) {
                    _path = null;
                    _meta = null;
                    clearSavedWorkspacePath();
                    _status = 'no_workspace';
                } else {
                    _status = 'error';
                }
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
            await open_workspace(normalizePath(selected as string));
        } catch (e) {
            _error = String(e);
            _status = 'error';
        }
    }

    async function open_workspace(rawPath: string) {
        try {
            _status = 'loading';
            _error = null;

            const path = normalizePath(rawPath);
            const db = await getDb(path);
            await runMigrations(db);
            await WorkspaceRepo.initWorkspace(db, path.split('/').pop() ?? m.workspace_default_name());

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

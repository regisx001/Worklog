import type { WorkspaceMeta } from '$lib/components/app/types';
import { getDb, closeDb, WorkspaceRepo } from '$lib/db';
import { runMigrations } from '$lib/db/migrate';

interface AppStoreLike {
    get: <T>(key: string) => Promise<T | null | undefined>;
    set: (key: string, value: unknown) => Promise<void>;
    save: () => Promise<void>;
}

let appStore: AppStoreLike | null = null;
let appStoreInitTried = false;

async function getAppStore(): Promise<AppStoreLike | null> {
    if (appStore || appStoreInitTried) return appStore;

    appStoreInitTried = true;
    try {
        const { load } = await import('@tauri-apps/plugin-store');
        appStore = await load('worklog.json');
    } catch {
        // Running outside Tauri (e.g. browser dev mode): store is optional.
        appStore = null;
    }

    return appStore;
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
        try {
            _status = 'idle';
            _error = null;

            const store = await getAppStore();
            const saved = store
                ? (await store.get<string>('last_workspace_path')) ?? null
                : null;

            if (saved) {
                await open_workspace(saved);
                return;
            }

            _status = 'no_workspace';
        } catch (e) {
            _error = String(e);
            _status = 'error';
        }
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

            const store = await getAppStore();
            if (store) {
                await store.set('last_workspace_path', path);
                await store.save();
            }

            _status = 'ready';
        } catch (e) {
            _error = String(e);
            _status = 'error';
        }
    }

    async function close() {
        await closeDb();
        _path = null;
        _meta = null;
        _status = 'no_workspace';
    }

    return {
        get path() { return _path },
        get meta() { return _meta },
        get status() { return _status },
        get error() { return _error },
        init, pick, close
    };
}

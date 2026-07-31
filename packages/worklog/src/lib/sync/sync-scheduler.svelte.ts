import { getWorkspace } from '$lib/hooks/workspace.svelte';
import { getSyncConfig } from '$lib/sync/sync-config.svelte';
import { SyncEngine } from '$lib/sync/sync-engine';
import { getDb } from '$lib/db';
import { notifications } from '$lib/hooks/notifications.svelte';
import type { SyncConfig, SyncOperation, SyncResult } from '$lib/sync/types';
import * as m from '$lib/paraglide/messages.js';
import { SyncOperationGate } from './sync-operation-gate';
import { runAutomaticSync } from './sync-flow';

let schedulerInterval: number | null = null;
let countdownInterval: number | null = null;
const syncOperationGate = new SyncOperationGate();

export const syncState = $state({
    isSyncing: false,
    activeOperation: null as SyncOperation | null,
    nextSyncAt: null as number | null,
    timeRemainingMs: 0,
    lastResult: null as SyncResult | null,
    pendingResolution: null as SyncResult | null,
});

export async function runSyncOperation(
    workspacePath: string,
    config: SyncConfig,
    operation: SyncOperation,
): Promise<SyncResult> {
    return syncOperationGate.run(
        async () => {
            syncState.isSyncing = true;
            syncState.activeOperation = operation;

            try {
                const db = await getDb(workspacePath);
                const engine = new SyncEngine(workspacePath);
                if (!(await engine.isGitAvailable())) {
                    const result: SyncResult = {
                        status: 'error',
                        message: m.settings_git_not_found(),
                        timestamp: new Date().toISOString(),
                    };
                    syncState.lastResult = result;
                    return result;
                }

                let result: SyncResult;
                switch (operation) {
                    case 'push':
                        result = await engine.push(db, config);
                        break;
                    case 'pull':
                        result = await engine.pull(db, config);
                        break;
                    case 'force_push':
                        result = await engine.forcePush(db, config);
                        break;
                    case 'force_pull':
                        result = await engine.forcePull(db, config);
                        break;
                    case 'auto':
                        result = await runAutomaticSync(
                            () => engine.pull(db, config),
                            () => engine.push(db, config),
                        );
                        break;
                }
                syncState.lastResult = result;
                if (result.status === 'remote_has_data' || result.status === 'conflict') {
                    requestSyncResolution(result);
                }
                return result;
            } catch (error) {
                const result: SyncResult = {
                    status: 'error',
                    message: config.access_token
                        ? [
                              config.access_token,
                              encodeURIComponent(config.access_token),
                          ].reduce(
                              (redacted, token) =>
                                  redacted.split(token).join('***'),
                              String(error),
                          )
                        : String(error),
                    timestamp: new Date().toISOString(),
                };
                syncState.lastResult = result;
                return result;
            } finally {
                syncState.activeOperation = null;
                syncState.isSyncing = false;
            }
        },
        () => ({
            status: 'busy',
            message: m.sync_operation_busy(),
            timestamp: new Date().toISOString(),
        }),
    );
}

export function requestSyncResolution(result: SyncResult): void {
    syncState.pendingResolution = result;
}

export function clearSyncResolution(): void {
    syncState.pendingResolution = null;
}

/**
 * Initializes the background synchronization loop.
 * It checks every minute if an auto-sync is due based on the configured interval.
 */
export function initSyncScheduler() {
    const workspace = getWorkspace();
    const syncConfig = getSyncConfig();

    if (schedulerInterval !== null) clearInterval(schedulerInterval);
    if (countdownInterval !== null) clearInterval(countdownInterval);

    countdownInterval = window.setInterval(() => {
        if (
            !syncConfig.config.auto_sync ||
            !syncConfig.config.remote_url ||
            !syncConfig.config.access_token
        ) {
            syncState.nextSyncAt = null;
            syncState.timeRemainingMs = 0;
            return;
        }

        const lastSyncedAt = syncConfig.config.last_synced_at
            ? new Date(syncConfig.config.last_synced_at).getTime()
            : Date.now();
        syncState.nextSyncAt =
            lastSyncedAt + syncConfig.config.auto_sync_interval * 60 * 1000;
        syncState.timeRemainingMs = Math.max(
            0,
            syncState.nextSyncAt - Date.now(),
        );
    }, 1000);

    schedulerInterval = window.setInterval(async () => {
        if (workspace.status !== 'ready' || !workspace.path) return;
        if (
            !syncConfig.config.auto_sync ||
            !syncConfig.config.remote_url ||
            !syncConfig.config.access_token ||
            syncState.isSyncing
        ) {
            return;
        }

        const lastSyncedAt = syncConfig.config.last_synced_at
            ? new Date(syncConfig.config.last_synced_at).getTime()
            : 0;
        const intervalMs = syncConfig.config.auto_sync_interval * 60 * 1000;
        if (Date.now() - lastSyncedAt < intervalMs) return;

        const result = await runSyncOperation(
            workspace.path,
            syncConfig.config,
            'auto',
        );

        if (result.status === 'success') {
            syncConfig.updateLastSynced(result.timestamp);
            const db = await getDb(workspace.path);
            await syncConfig.save(db);
            return;
        }

        if (result.status !== 'busy') {
            notifications.add({
                kind: 'error',
                title: m.sync_auto_failed(),
                subtitle: result.message,
                timeout: 5000,
            });
        }
    }, 60 * 1000);
}

export function destroySyncScheduler() {
    if (schedulerInterval !== null) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    if (countdownInterval !== null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

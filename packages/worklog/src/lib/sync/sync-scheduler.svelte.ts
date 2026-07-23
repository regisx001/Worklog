import { getWorkspace } from "$lib/hooks/workspace.svelte";
import { getSyncConfig } from "$lib/sync/sync-config.svelte";
import { SyncEngine } from "$lib/sync/sync-engine";
import { getDb } from "$lib/db";
import { notifications } from "$lib/hooks/notifications.svelte";
import * as m from "$lib/paraglide/messages.js";

let schedulerInterval: number | null = null;
let countdownInterval: number | null = null;

export const syncState = $state({
    isSyncing: false,
    nextSyncAt: null as number | null,
    timeRemainingMs: 0,
});

/**
 * Initializes the background synchronization loop.
 * It checks every minute if an auto-sync is due based on the configured interval.
 */
export function initSyncScheduler() {
    const workspace = getWorkspace();
    const syncConfig = getSyncConfig();

    if (schedulerInterval !== null) {
        clearInterval(schedulerInterval);
    }
    if (countdownInterval !== null) {
        clearInterval(countdownInterval);
    }

    // Update the countdown every second
    countdownInterval = window.setInterval(() => {
        if (!syncConfig.config.auto_sync || !syncConfig.config.remote_url) {
            syncState.nextSyncAt = null;
            syncState.timeRemainingMs = 0;
            return;
        }

        const lastSyncedStr = syncConfig.config.last_synced_at;
        const intervalMs = syncConfig.config.auto_sync_interval * 60 * 1000;

        if (!lastSyncedStr) {
            syncState.nextSyncAt = Date.now();
        } else {
            const lastSyncedAt = new Date(lastSyncedStr).getTime();
            syncState.nextSyncAt = lastSyncedAt + intervalMs;
        }

        if (syncState.nextSyncAt) {
            syncState.timeRemainingMs = Math.max(0, syncState.nextSyncAt - Date.now());
        }
    }, 1000);

    // Check every minute
    schedulerInterval = window.setInterval(async () => {
        if (workspace.status !== "ready" || !workspace.path) return;
        if (!syncConfig.config.auto_sync || !syncConfig.config.remote_url) return;
        if (syncState.isSyncing) return;

        // Check if interval has elapsed
        const lastSyncedStr = syncConfig.config.last_synced_at;
        const intervalMs = syncConfig.config.auto_sync_interval * 60 * 1000;

        let shouldSync = false;
        if (!lastSyncedStr) {
            shouldSync = true;
        } else {
            const lastSyncedAt = new Date(lastSyncedStr).getTime();
            if (Date.now() - lastSyncedAt >= intervalMs) {
                shouldSync = true;
            }
        }

        if (shouldSync) {
            syncState.isSyncing = true;
            try {
                const db = await getDb(workspace.path);
                const engine = new SyncEngine(workspace.path);
                const isGitAvailable = await engine.isGitAvailable();

                if (isGitAvailable) {
                    await engine.initialize(syncConfig.config);
                    // Fast-forward pull before push to avoid conflicts when possible
                    await engine.pull(db, syncConfig.config);
                    const result = await engine.push(db, syncConfig.config);

                    if (result.status === "success") {
                        syncConfig.updateLastSynced(result.timestamp);
                        await syncConfig.save(db);
                    } else if (result.status === "error") {
                        notifications.add({
                            kind: "error",
                            title: m.sync_auto_failed(),
                            subtitle: result.message,
                            timeout: 5000,
                        });
                    }
                }
            } catch (error) {
                console.error("Auto-sync error:", error);
            } finally {
                syncState.isSyncing = false;
            }
        }
    }, 60 * 1000); // 1 minute
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

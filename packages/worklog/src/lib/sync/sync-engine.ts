import type Database from '@tauri-apps/plugin-sql';
import { mkdir, exists } from '@tauri-apps/plugin-fs';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { GitClient } from './git-client';
import type { SyncConfig, SyncResult } from './types';
import { extractSnapshot } from '$lib/db/mappers/extract';
import { snapshotToFolderJsonFiles } from '$lib/db/mappers/serialize-json';
import { importFromFolder } from '$lib/db/mappers/import-file';
import * as m from "$lib/paraglide/messages.js";

/**
 * Core sync orchestration layer.
 * Handles push/pull operations between SQLite and a remote git repository.
 */
export class SyncEngine {
    private syncDir: string;
    private git: GitClient;

    constructor(workspacePath: string) {
        this.syncDir = `${workspacePath}/.worklog/sync`;
        this.git = new GitClient(this.syncDir);
    }

    /**
     * Initialize the sync directory and git repository.
     * Called once when user first configures sync.
     */
    async initialize(config: SyncConfig): Promise<void> {
        // Ensure sync directory exists
        const dirExists = await exists(this.syncDir);
        if (!dirExists) {
            await mkdir(this.syncDir, { recursive: true });
        }

        // Ensure boards subdirectory exists
        const boardsDir = `${this.syncDir}/boards`;
        const boardsDirExists = await exists(boardsDir);
        if (!boardsDirExists) {
            await mkdir(boardsDir, { recursive: true });
        }

        // Initialize git if not already a repo
        const isRepo = await this.git.isRepo();
        if (!isRepo) {
            await this.git.init();
        }

        // Configure remote and user
        await this.git.setRemote(config.remote_url, config.access_token);
        await this.git.setUser(config.git_name || 'Worklog', config.git_email || 'worklog@sync');
    }

    /**
     * Push local database state to the remote repository.
     *
     * Flow: extract snapshot → write flat files → git add + commit + push
     */
    async push(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            // 1. Extract snapshot from DB
            const snapshot = await extractSnapshot(db);

            // 2. Serialize to flat JSON files
            const files = snapshotToFolderJsonFiles(snapshot);

            // 3. Ensure directories exist
            const boardsDir = `${this.syncDir}/boards`;
            const boardsDirExists = await exists(boardsDir);
            if (!boardsDirExists) {
                await mkdir(boardsDir, { recursive: true });
            }

            // 4. Write all files to sync directory
            for (const [relativePath, content] of files.entries()) {
                const fullPath = `${this.syncDir}/${relativePath}`;
                await writeTextFile(fullPath, content);
            }

            // 5. Ensure remote is configured
            await this.git.setRemote(config.remote_url, config.access_token);

            // 6. Stage, commit, push
            await this.git.addAll();
            const committed = await this.git.commit(
                `sync: ${new Date().toISOString()}`
            );

            if (committed) {
                await this.git.push(config.branch);
            }

            const timestamp = new Date().toISOString();
            return {
                status: 'success',
                message: committed
                    ? m.sync_changes_pushed()
                    : m.sync_no_changes_push(),
                timestamp,
            };
        } catch (error) {
            return {
                status: 'error',
                message: String(error),
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Pull remote changes and import them into the database.
     *
     * Flow: git pull → read flat files → deserialize → import into DB
     */
    async pull(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            // 1. Ensure remote is configured
            await this.git.setRemote(config.remote_url, config.access_token);

            // 2. Pull from remote
            try {
                await this.git.pull(config.branch);
            } catch (error) {
                const msg = String(error);
                if (msg.includes('CONFLICT') || msg.includes('Merge conflict')) {
                    return {
                        status: 'conflict',
                        message: m.sync_merge_conflict_message(),
                        timestamp: new Date().toISOString(),
                    };
                }
                throw error;
            }

            // 3. Import flat files from sync directory into DB
            const result = await importFromFolder(db, this.syncDir, 'merge');

            const timestamp = new Date().toISOString();
            return {
                status: 'success',
                message: m.sync_pull_success_message({
                    boardsCreated: result.boardsCreated,
                    boardsUpdated: result.boardsUpdated,
                    ticketsCreated: result.ticketsCreated,
                    ticketsUpdated: result.ticketsUpdated,
                }),
                timestamp,
            };
        } catch (error) {
            return {
                status: 'error',
                message: String(error),
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Force push: overwrite remote with local state.
     */
    async forcePush(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            const snapshot = await extractSnapshot(db);
            const files = snapshotToFolderJsonFiles(snapshot);

            const boardsDir = `${this.syncDir}/boards`;
            const boardsDirExists = await exists(boardsDir);
            if (!boardsDirExists) {
                await mkdir(boardsDir, { recursive: true });
            }

            for (const [relativePath, content] of files.entries()) {
                await writeTextFile(`${this.syncDir}/${relativePath}`, content);
            }

            await this.git.setRemote(config.remote_url, config.access_token);
            await this.git.addAll();
            await this.git.commit(`sync (force): ${new Date().toISOString()}`);
            await this.git.forcePush(config.branch);

            return {
                status: 'success',
                message: m.sync_force_push_success(),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'error',
                message: String(error),
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Force pull: overwrite local DB with remote state.
     */
    async forcePull(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            await this.git.setRemote(config.remote_url, config.access_token);
            await this.git.fetch();
            await this.git.hardReset(config.branch);

            const result = await importFromFolder(db, this.syncDir, 'replace');

            return {
                status: 'success',
                message: m.sync_force_pull_success({
                    boards: result.boardsCreated,
                    tickets: result.ticketsCreated,
                }),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'error',
                message: String(error),
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Check if git is available on the user's system.
     */
    async isGitAvailable(): Promise<boolean> {
        return this.git.isGitAvailable();
    }

    /**
     * Check if the sync directory is already initialized as a git repo.
     */
    async isInitialized(): Promise<boolean> {
        const dirExists = await exists(this.syncDir);
        if (!dirExists) return false;
        return this.git.isRepo();
    }
}

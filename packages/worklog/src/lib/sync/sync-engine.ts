import type Database from '@tauri-apps/plugin-sql';
import { mkdir, exists, writeTextFile } from '@tauri-apps/plugin-fs';
import { GitClient, type RemoteInfo } from './git-client';
import type { SyncConfig, SyncResult } from './types';
import { extractSnapshot } from '$lib/db/mappers/extract';
import { snapshotToFolderJsonFiles } from '$lib/db/mappers/serialize-json';
import { importFromFolder } from '$lib/db/mappers/import-file';
import * as m from '$lib/paraglide/messages.js';

export class SyncEngine {
    private syncDir: string;
    private git: GitClient;

    constructor(workspacePath: string) {
        this.syncDir = `${workspacePath}/.worklog/sync`;
        this.git = new GitClient(this.syncDir);
    }

    async push(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            const prepared = await this.prepare(config);
            const remoteStatus = this.remoteStatus(
                prepared.remote,
                config.branch,
                { allowEmpty: true },
            );
            if (remoteStatus) return remoteStatus;

            if (
                prepared.remote.branches.includes(config.branch) &&
                !prepared.hasLocalCommits
            ) {
                return this.remoteHasDataResult(config, prepared.remote);
            }

            if (
                prepared.remote.branches.includes(config.branch) &&
                !(await this.git.isRemoteBranchIntegrated(config.branch))
            ) {
                return this.remoteHasDataResult(config, prepared.remote);
            }

            const committed = await this.writeSnapshot(db, 'sync');

            // A push is required even when there is no new commit. This repairs
            // an older local-only snapshot and proves that the remote accepted it.
            await this.git.push(config.branch);

            return this.result('success', {
                message:
                    prepared.remote.branches.length === 0
                        ? m.sync_initial_push_success({ branch: config.branch })
                        : committed
                          ? m.sync_changes_pushed()
                          : m.sync_no_changes_push(),
                successKind: committed ? 'pushed' : 'up_to_date',
            });
        } catch (error) {
            return this.errorResult(error, config);
        }
    }

    async pull(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            const { remote } = await this.prepare(config);
            const remoteStatus = this.remoteStatus(remote, config.branch);
            if (remoteStatus) return remoteStatus;

            try {
                await this.git.pull(config.branch);
            } catch (error) {
                if (isConflictError(error)) {
                    return this.result('conflict', {
                        message: m.sync_merge_conflict_message(),
                    });
                }
                throw error;
            }

            const result = await importFromFolder(db, this.syncDir, 'merge');
            return this.result('success', {
                message: m.sync_pull_success_message({
                    boardsCreated: result.boardsCreated,
                    boardsUpdated: result.boardsUpdated,
                    ticketsCreated: result.ticketsCreated,
                    ticketsUpdated: result.ticketsUpdated,
                }),
                successKind: 'pulled',
            });
        } catch (error) {
            return this.errorResult(error, config);
        }
    }

    async forcePush(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            const { remote } = await this.prepare(config);
            const remoteStatus = this.remoteStatus(remote, config.branch, {
                allowEmpty: true,
                allowMissingBranch: true,
            });
            if (remoteStatus) return remoteStatus;
            await this.writeSnapshot(db, 'sync (force)');
            await this.git.forcePush(config.branch);

            return this.result('success', {
                message: m.sync_force_push_success(),
                successKind: 'force_pushed',
            });
        } catch (error) {
            return this.errorResult(error, config);
        }
    }

    async forcePull(db: Database, config: SyncConfig): Promise<SyncResult> {
        try {
            const { remote } = await this.prepare(config);
            const remoteStatus = this.remoteStatus(remote, config.branch);
            if (remoteStatus) return remoteStatus;

            await this.git.fetch();
            await this.git.hardReset(config.branch);

            const result = await importFromFolder(db, this.syncDir, 'replace');
            return this.result('success', {
                message: m.sync_force_pull_success({
                    boards: result.boardsCreated,
                    tickets: result.ticketsCreated,
                }),
                successKind: 'force_pulled',
            });
        } catch (error) {
            return this.errorResult(error, config);
        }
    }

    async isGitAvailable(): Promise<boolean> {
        return this.git.isGitAvailable();
    }

    private async prepare(config: SyncConfig): Promise<{
        remote: RemoteInfo;
        hasLocalCommits: boolean;
    }> {
        if (!config.access_token.trim()) {
            throw new Error(m.sync_token_required());
        }
        if (!isGitHubHttpsUrl(config.remote_url)) {
            throw new Error(m.sync_invalid_remote_url());
        }
        if (!config.branch.trim()) {
            throw new Error(m.sync_branch_required());
        }

        await this.git.assertValidBranch(config.branch);
        await this.ensureSyncDirectories();

        if (!(await this.git.isRepo())) {
            await this.git.init(config.branch);
        }

        await this.git.setRemote(config.remote_url, config.access_token);
        await this.git.setUser(
            config.git_name || 'Worklog',
            config.git_email || 'worklog@sync',
        );

        return {
            remote: await this.git.inspectRemote(),
            hasLocalCommits: await this.git.hasCommits(),
        };
    }

    private async ensureSyncDirectories(): Promise<void> {
        if (!(await exists(this.syncDir))) {
            await mkdir(this.syncDir, { recursive: true });
        }

        const boardsDir = `${this.syncDir}/boards`;
        if (!(await exists(boardsDir))) {
            await mkdir(boardsDir, { recursive: true });
        }
    }

    private async writeSnapshot(
        db: Database,
        commitPrefix: string,
    ): Promise<boolean> {
        const files = snapshotToFolderJsonFiles(await extractSnapshot(db));
        for (const [relativePath, content] of files.entries()) {
            await writeTextFile(`${this.syncDir}/${relativePath}`, content);
        }

        await this.git.addAll();
        return this.git.commit(`${commitPrefix}: ${new Date().toISOString()}`);
    }

    private remoteStatus(
        remote: RemoteInfo,
        branch: string,
        options: { allowEmpty?: boolean; allowMissingBranch?: boolean } = {},
    ): SyncResult | null {
        if (remote.branches.length === 0 && !options.allowEmpty) {
            return this.result('remote_empty', {
                message: m.sync_remote_empty_message({ branch }),
                configuredBranch: branch,
            });
        }

        if (
            remote.defaultBranch !== null &&
            remote.defaultBranch !== branch
        ) {
            return this.result('branch_mismatch', {
                message: m.sync_branch_mismatch_message({
                    configured: branch,
                    remote: remote.defaultBranch,
                }),
                configuredBranch: branch,
                remoteDefaultBranch: remote.defaultBranch,
            });
        }

        if (
            remote.branches.length > 0 &&
            !remote.branches.includes(branch) &&
            !options.allowMissingBranch
        ) {
            return this.result('branch_mismatch', {
                message: m.sync_branch_missing_message({ configured: branch }),
                configuredBranch: branch,
                remoteDefaultBranch: remote.defaultBranch,
            });
        }

        return null;
    }

    private errorResult(error: unknown, config: SyncConfig): SyncResult {
        if (isConflictError(error)) {
            return this.result('conflict', {
                message: m.sync_merge_conflict_message(),
            });
        }

        return this.result('error', {
            message: redactSyncError(String(error), config.access_token),
        });
    }

    private remoteHasDataResult(
        config: SyncConfig,
        remote: RemoteInfo,
    ): SyncResult {
        return this.result('remote_has_data', {
            message: m.sync_remote_has_data_message({ branch: config.branch }),
            configuredBranch: config.branch,
            remoteDefaultBranch: remote.defaultBranch,
        });
    }

    private result(
        status: SyncResult['status'],
        values: Omit<SyncResult, 'status' | 'timestamp'>,
    ): SyncResult {
        return { status, timestamp: new Date().toISOString(), ...values };
    }
}

function isGitHubHttpsUrl(value: string): boolean {
    try {
        const url = new URL(value);
        const pathParts = url.pathname.split('/').filter(Boolean);
        return (
            url.protocol === 'https:' &&
            url.hostname === 'github.com' &&
            pathParts.length >= 2
        );
    } catch {
        return false;
    }
}

function isConflictError(error: unknown): boolean {
    const message = String(error).toLowerCase();
    return (
        message.includes('conflict') ||
        message.includes('non-fast-forward') ||
        message.includes('fetch first')
    );
}

function redactSyncError(message: string, token: string): string {
    if (!token) return message;
    return [token, encodeURIComponent(token)].reduce(
        (redacted, value) => redacted.split(value).join('***'),
        message,
    );
}

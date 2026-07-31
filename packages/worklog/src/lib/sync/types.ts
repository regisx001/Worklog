// ── Sync Types ─────────────────────────────────────────────────────────────

export interface SyncConfig {
    /** GitHub repository HTTPS URL (e.g. https://github.com/user/repo.git) */
    remote_url: string;
    /** GitHub Personal Access Token with repo scope */
    access_token: string;
    /** Branch to sync against (default: 'main') */
    branch: string;
    /** Git committer name */
    git_name: string;
    /** Git committer email */
    git_email: string;
    /** Whether to automatically push after every save */
    auto_sync: boolean;
    /** Interval in minutes for auto sync */
    auto_sync_interval: number;
    /** ISO timestamp of last successful sync, or null */
    last_synced_at: string | null;
}

export type SyncStatus =
    | 'idle'
    | 'pushing'
    | 'pulling'
    | 'error'
    | 'conflict'
    | 'not_configured';

export type SyncOperation = 'push' | 'pull' | 'force_push' | 'force_pull' | 'auto';

export type SyncResultStatus =
    | 'success'
    | 'conflict'
    | 'error'
    | 'busy'
    | 'branch_mismatch'
    | 'remote_has_data'
    | 'remote_empty';

export type SyncSuccessKind =
    | 'pushed'
    | 'up_to_date'
    | 'pulled'
    | 'force_pushed'
    | 'force_pulled';

export interface SyncResult {
    status: SyncResultStatus;
    message: string;
    timestamp: string;
    successKind?: SyncSuccessKind;
    configuredBranch?: string;
    remoteDefaultBranch?: string | null;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    remote_url: '',
    access_token: '',
    branch: 'main',
    git_name: '',
    git_email: '',
    auto_sync: false,
    auto_sync_interval: 15,
    last_synced_at: null,
};

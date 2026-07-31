import type { SyncResult } from './types';

export async function runAutomaticSync(
    pull: () => Promise<SyncResult>,
    push: () => Promise<SyncResult>,
): Promise<SyncResult> {
    const pulled = await pull();
    return pulled.status === 'success' ? push() : pulled;
}

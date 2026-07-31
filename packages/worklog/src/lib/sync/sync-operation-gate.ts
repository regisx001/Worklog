export class SyncOperationGate {
    private active = false;

    async run<T>(task: () => Promise<T>, onBusy: () => T): Promise<T> {
        if (this.active) return onBusy();

        this.active = true;
        try {
            return await task();
        } finally {
            this.active = false;
        }
    }
}

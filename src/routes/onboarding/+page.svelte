<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button/index.js";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    const workspace = useWorkspace();
    let pageError = $state<string | null>(null);

    function setFailure(context: string, error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        pageError = `${context}: ${detail}`;
        console.error(context, error);
    }

    async function openWorkspacePicker() {
        try {
            await workspace.pick();

            if (workspace.status === "ready") {
                await goto("/", { replaceState: true });
            }
        } catch (error) {
            setFailure("Failed to open workspace", error);
        }
    }

    $effect(() => {
        if (workspace.status === "ready") {
            void goto("/", { replaceState: true });
        }
    });
</script>

<div class="flex h-full items-center justify-center p-8">
    <div
        class="w-full max-w-md space-y-3 rounded-xl border border-border/80 bg-surface-panel/80 p-5 text-center"
    >
        <h1 class="font-display text-lg font-semibold">Open a Workspace</h1>
        <p class="text-sm text-muted-foreground">
            Pick a local folder to start managing boards and tickets.
        </p>
        <Button onclick={() => void openWorkspacePicker()}
            >Open Workspace</Button
        >

        {#if workspace.status === "loading" || workspace.status === "idle"}
            <p class="text-xs text-muted-foreground">
                Checking existing workspace...
            </p>
        {/if}

        {#if workspace.error}
            <p class="text-xs text-red-300">{workspace.error}</p>
        {/if}

        {#if pageError}
            <p class="text-xs text-red-300">{pageError}</p>
        {/if}
    </div>
</div>

<script lang="ts">
    import { Button } from "carbon-components-svelte";
    import { goto } from "$app/navigation";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    const workspace = useWorkspace();

    const openWorkspaceLabel = $derived(
        workspace.status === "error"
            ? "Retry Opening Workspace Folder"
            : "Open Workspace Folder",
    );

    const showWorkspaceSelector = $derived(
        workspace.status === "no_workspace" || workspace.status === "error",
    );

    const handleOpenWorkspace = async () => {
        await workspace.pick();
    };

    $effect(() => {
        if (workspace.status === "ready") {
            // void goto("/workspace", { replaceState: true });
            void goto("/kanban", { replaceState: true });
        }
    });
</script>

<svelte:head>
    <title>Worklog | Workspace</title>
    <meta
        name="description"
        content="Select a local workspace and continue with your Worklog boards."
    />
</svelte:head>

{#if showWorkspaceSelector}
    <main class="workspace-selector-state">
        <article
            aria-labelledby="workspace-selector-title"
            class="workspace-selector-card"
        >
            <h1 id="workspace-selector-title">Select Workspace</h1>
            <p>
                Worklog is local-first. Choose a folder to store
                <code>.worklog/worklog.db</code>.
            </p>

            {#if workspace.error}
                <p class="workspace-selector-error" role="alert">
                    {workspace.error}
                </p>
            {/if}

            <Button onclick={handleOpenWorkspace} kind="ghost">
                {openWorkspaceLabel}
            </Button>
        </article>
    </main>
{:else}
    <main class="app-state">
        <article aria-busy="true">Opening workspace...</article>
    </main>
{/if}

<style>
    .app-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-06, 1.5rem);
    }

    .app-state article {
        width: min(26rem, 100%);
    }

    .workspace-selector-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-06, 1.5rem);
    }

    .workspace-selector-card {
        width: min(30rem, 100%);
        display: grid;
        gap: var(--cds-spacing-05, 1rem);
        padding: var(--cds-spacing-06, 1.5rem);
        border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
        border-radius: 0.5rem;
        background: color-mix(in srgb, currentColor 4%, transparent);
    }

    .workspace-selector-card h1,
    .workspace-selector-card p {
        margin: 0;
    }

    .workspace-selector-error {
        color: var(--color-danger, #fa4d56);
        font-size: 0.875rem;
        line-height: 1.4;
        word-break: break-word;
    }
</style>

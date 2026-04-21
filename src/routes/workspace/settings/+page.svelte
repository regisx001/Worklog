<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button, TextArea, TextInput } from "carbon-components-svelte";

    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    const workspace = useWorkspace();

    const workspaceName = $derived(workspace.meta?.name ?? "Workspace");
    const workspacePath = $derived(workspace.path ?? "Not available");
    const workspaceStatus = $derived(workspace.status);

    function goToBoards() {
        void goto("/workspace");
    }

    function refreshWorkspaceState() {
        void workspace.init();
    }
</script>

<main class="workspace-settings">
    <header class="workspace-settings-header">
        <h1>Settings</h1>
        <p>Workspace-level preferences and diagnostics.</p>
    </header>

    <section
        class="workspace-settings-section"
        aria-labelledby="workspace-info-title"
    >
        <h2 id="workspace-info-title">Workspace</h2>

        <TextInput
            id="workspace-name"
            labelText="Workspace name"
            value={workspaceName}
            readonly
        />

        <TextInput
            id="workspace-status"
            labelText="Workspace status"
            value={workspaceStatus}
            readonly
        />

        <TextArea
            id="workspace-path"
            labelText="Workspace path"
            value={workspacePath}
            rows={3}
            readonly
        />
    </section>

    <section class="workspace-settings-actions" aria-label="Settings actions">
        <Button kind="secondary" onclick={goToBoards}>Back to workspace</Button>
        <Button kind="ghost" onclick={refreshWorkspaceState}>
            Refresh workspace state
        </Button>
    </section>
</main>

<style>
    .workspace-settings {
        min-height: 100%;
        padding: var(--cds-spacing-05, 1rem);
        display: grid;
        gap: var(--cds-spacing-05, 1rem);
        align-content: start;
        max-width: 52rem;
    }

    .workspace-settings-header {
        display: grid;
        gap: var(--cds-spacing-02, 0.25rem);
    }

    .workspace-settings-header h1,
    .workspace-settings-header p {
        margin: 0;
    }

    .workspace-settings-header p {
        font-size: 0.875rem;
        opacity: 0.8;
    }

    .workspace-settings-section {
        display: grid;
        gap: var(--cds-spacing-04, 0.75rem);
        padding: var(--cds-spacing-05, 1rem);
        border-radius: 0.5rem;
        border: 1px solid
            color-mix(
                in srgb,
                var(--color-border-primary, #525252) 45%,
                transparent
            );
        background: color-mix(
            in srgb,
            var(--color-surface-2, #262626) 45%,
            transparent
        );
    }

    .workspace-settings-section h2 {
        margin: 0;
        font-size: 1rem;
    }

    .workspace-settings-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-settings-actions :global(.bx--btn) {
        margin: 0;
    }
</style>

<script lang="ts">
    import { goto } from "$app/navigation";
    import { Content } from "carbon-components-svelte";

    import WorkspaceSidebar from "$lib/components/app/layout/workspace/workspace-sidebar.svelte";
    import { useBoards } from "$lib/hooks/boards.svelte";
    import { setWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import { page } from "$app/state";

    let { children } = $props();
    const workspace = useWorkspace();
    const boardsApi = useBoards(() => workspace.path);

    setWorkspaceShellContext({ workspace, boardsApi });

    let lastLoadedWorkspacePath = $state<string | null>(null);
    let boardLoadError = $state<string | null>(null);

    function openSettings() {
        void goto("/workspace/settings");
    }

    function openBoard(boardId: string) {
        void goto(`/workspace/${boardId}`);
    }

    $effect(() => {
        if (
            workspace.status === "no_workspace" ||
            workspace.status === "error"
        ) {
            void goto("/", { replaceState: true });
        }
    });

    $effect(() => {
        const workspacePath = workspace.path;

        if (workspace.status !== "ready" || !workspacePath) {
            lastLoadedWorkspacePath = null;
            return;
        }

        if (workspacePath === lastLoadedWorkspacePath) {
            return;
        }

        lastLoadedWorkspacePath = workspacePath;
        boardLoadError = null;

        void boardsApi.load().catch((error) => {
            boardLoadError = String(error);
            lastLoadedWorkspacePath = null;
        });
    });

    const isSettingsRoute = $derived(page.route.id === "/workspace/settings");
</script>

<!-- <h1>Hello World</h1>
<h1>Hello World</h1>
<h1>Hello World</h1>
<h1>{JSON.stringify(}</h1> -->

{#if workspace.status === "ready"}
    <WorkspaceSidebar
        isSetting={isSettingsRoute}
        onOpenSettings={openSettings}
        onOpenBoard={openBoard}
    />
{/if}

<Content class="layout-content">
    {#if workspace.status === "ready"}
        {#if boardLoadError}
            <aside class="workspace-load-error" role="alert">
                <strong>Unable to load boards.</strong>
                <span>{boardLoadError}</span>
            </aside>
        {/if}

        {@render children()}
    {:else}
        <main class="workspace-state">
            <article aria-busy="true">Opening workspace...</article>
        </main>
    {/if}
</Content>

<style>
    .workspace-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }

    .workspace-load-error {
        margin: var(--cds-spacing-04, 0.75rem);
        padding: var(--cds-spacing-04, 0.75rem);
        display: grid;
        gap: var(--cds-spacing-02, 0.25rem);
        border: 1px solid
            color-mix(in srgb, var(--color-danger, #fa4d56) 40%, transparent);
        border-radius: 0.5rem;
        background: color-mix(
            in srgb,
            var(--color-danger, #fa4d56) 12%,
            transparent
        );
        font-size: 0.875rem;
    }
</style>

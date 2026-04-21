<script lang="ts">
    import { goto } from "$app/navigation";
    import { Content } from "carbon-components-svelte";

    import WorkspaceSidebar from "$lib/components/app/layout/workspace/workspace-sidebar.svelte";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    let { children } = $props();
    const workspace = useWorkspace();

    $effect(() => {
        if (
            workspace.status === "no_workspace" ||
            workspace.status === "error"
        ) {
            void goto("/", { replaceState: true });
        }
    });
</script>

{#if workspace.status === "ready"}
    <WorkspaceSidebar />
{/if}

<Content class="layout-content">
    {#if workspace.status === "ready"}
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
</style>

<script lang="ts">
    import { Content } from "carbon-components-svelte";

    import WorkspaceSidebar from "$lib/components/app/layout/workspace/workspace-sidebar.svelte";
    let { children } = $props();
</script>

<WorkspaceSidebar />

<Content class="layout-content">
    {@render children()}
</Content>

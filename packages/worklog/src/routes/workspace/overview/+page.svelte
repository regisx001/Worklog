<script lang="ts">
    import WorkspaceOverview from "$lib/components/app/overview/workspace-overview.svelte";
    import * as m from "$lib/paraglide/messages.js";
</script>

<svelte:head>
    <title>{m.overview_title()}</title>
</svelte:head>

<WorkspaceOverview />

<script lang="ts">
	import "./layout.css";
	import AppToolbar from "$lib/components/app/Toolbar/AppToolbar.svelte";
	import { toolbarState } from "$lib/hooks/toolbar.svelte.js";

	const { children } = $props();

	$effect(() => {
		document.documentElement.classList.add("dark");
		return () => document.documentElement.classList.remove("dark");
	});
</script>

<div
	class="dark flex h-dvh flex-col overflow-hidden bg-background text-foreground"
>
	<AppToolbar
		projectName={toolbarState.projectName}
		pendingChanges={toolbarState.pendingChanges}
		syncState={toolbarState.syncState}
		onOpenPalette={toolbarState.onOpenPalette}
		onCreateTicket={toolbarState.onCreateTicket}
		onManualSync={toolbarState.onManualSync}
	/>

	<div class="min-h-0 flex-1">
		{@render children()}
	</div>
</div>

<script lang="ts">
	import "./layout.css";
	import AppToolbar from "$lib/components/app/Toolbar/AppToolbar.svelte";
	import { toolbarState } from "$lib/hooks/toolbar.js";
	import { fromStore } from "svelte/store";

	const { children } = $props();
	const toolbar = fromStore(toolbarState);

	$effect(() => {
		document.documentElement.classList.add("dark");
		return () => document.documentElement.classList.remove("dark");
	});
</script>

<div
	class="dark flex h-dvh flex-col overflow-hidden bg-background text-foreground"
>
	<AppToolbar
		projectName={toolbar.current.projectName}
		pendingChanges={toolbar.current.pendingChanges}
		syncState={toolbar.current.syncState}
		onOpenPalette={toolbar.current.onOpenPalette}
		onCreateTicket={toolbar.current.onCreateTicket}
		onManualSync={toolbar.current.onManualSync}
	/>

	<div class="min-h-0 flex-1">
		{@render children()}
	</div>
</div>

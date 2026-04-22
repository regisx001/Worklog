<script lang="ts">
	import { goto } from "$app/navigation";
	// import "carbon-components-svelte/css/g100.css";

	import "carbon-components-svelte/css/all.css";
	import { Loading } from "carbon-components-svelte";
	import "./layout.css";
	// @ts-ignore
	import AppToolbar from "$lib/components/app/layout/toolbar/app-toolbar.svelte";
	import { useWorkspace } from "$lib/hooks/workspace.svelte";
	let { children } = $props();
	const workspace = useWorkspace();
	let hasInitializedWorkspace = $state(false);

	function openSettings() {
		void goto("/workspace/settings");
	}

	const handleContextmenu = (event: MouseEvent) => {
		event.preventDefault();
	};
	$effect(() => {
		document.addEventListener("contextmenu", handleContextmenu);

		return () => {
			document.removeEventListener("contextmenu", handleContextmenu);
		};
	});

	$effect(() => {
		if (hasInitializedWorkspace) {
			return;
		}

		hasInitializedWorkspace = true;
		void workspace.init();
	});
</script>

<div class="layout-shell">
	<AppToolbar
		showSettings={workspace.status === "ready"}
		onOpenSettings={openSettings}
	/>
	{@render children()}

	{#if workspace.status === "idle" || workspace.status === "loading"}
		<Loading />
	{/if}
</div>

<style>
	:global(html),
	:global(body) {
		height: 100%;
	}

	:global(body) {
		overflow: hidden;
	}

	.layout-shell {
		height: 100vh;
	}

	:global(.layout-content.bx--content) {
		box-sizing: border-box;
		min-height: 0;
		height: calc(100vh - var(--cds-spacing-09, 3rem));
		overflow-x: hidden;
		overflow-y: auto;
	}
</style>

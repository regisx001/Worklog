<script lang="ts">
	import "carbon-components-svelte/css/g100.css";
	import "./layout.css";
	// @ts-ignore
	import AppToolbar from "$lib/components/app/layout/toolbar/app-toolbar.svelte";
	let { children } = $props();

	const handleContextmenu = (event: MouseEvent) => {
		event.preventDefault();
	};
	$effect(() => {
		document.addEventListener("contextmenu", handleContextmenu);

		return () => {
			document.removeEventListener("contextmenu", handleContextmenu);
		};
	});
</script>

<div>
	<AppToolbar />
	<main>
		{@render children()}
	</main>
</div>

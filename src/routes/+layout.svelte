<script lang="ts">
	import "./layout.css";
	import AppToolbar from "$lib/components/app/layout/toolbar/AppToolbar.svelte";
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

<div class="app-shell">
	<AppToolbar />
	<main class="app-shell-content">
		{@render children()}
	</main>
</div>

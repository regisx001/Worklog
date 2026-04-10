<script lang="ts">
	import "./layout.css";
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

{@render children()}

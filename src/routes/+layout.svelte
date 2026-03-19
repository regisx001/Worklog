<script lang="ts">
	import "./layout.css";

	const { children } = $props();

	$effect(() => {
		document.documentElement.classList.add("dark");
		return () => document.documentElement.classList.remove("dark");
	});
</script>

{@render children()}

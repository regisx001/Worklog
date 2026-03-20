<script lang="ts">
	import "./layout.css";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { useWorkspace } from "$lib/hooks/workspace.svelte";
	import AppToolbar from "$lib/components/app/Toolbar/AppToolbar.svelte";
	import { toolbarState } from "$lib/hooks/toolbar.svelte.js";
	const workspace = useWorkspace();
	const { children } = $props();
	const currentPath = $derived.by(() => $page.url.pathname);

	const bypassBootGate = $derived.by(
		() =>
			currentPath.startsWith("/onboarding") ||
			currentPath.startsWith("/debug"),
	);

	function setBootFailure(context: string, error: unknown) {
		const detail = error instanceof Error ? error.message : String(error);
		console.error(`${context}: ${detail}`);
	}

	$effect(() => {
		void workspace.init().catch((error) => {
			setBootFailure("workspace.init failed", error);
		});
	});

	$effect(() => {
		if (
			workspace.status === "ready" &&
			currentPath.startsWith("/onboarding")
		) {
			void goto("/", { replaceState: true });
			return;
		}

		if (
			(workspace.status === "no_workspace" ||
				workspace.status === "error") &&
			!bypassBootGate
		) {
			void goto("/onboarding", { replaceState: true });
		}
	});

	$effect(() => {
		document.documentElement.classList.add("dark");
		const handleContextmenu = (event: MouseEvent) => {
			event.preventDefault();
		};

		document.addEventListener("contextmenu", handleContextmenu);

		// Cleanup the event listener when the component is destroyed
		return () => {
			document.documentElement.classList.remove("dark");
			document.removeEventListener("contextmenu", handleContextmenu);
		};
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

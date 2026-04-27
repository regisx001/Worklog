<script lang="ts">
	import { goto } from "$app/navigation";

	import "carbon-components-svelte/css/all.css";
	import { Loading } from "carbon-components-svelte";
	import "./layout.css";
	// @ts-ignore
	import AppToolbar from "$lib/components/app/layout/toolbar/app-toolbar.svelte";
	import CommandPalette from "$lib/components/app/layout/command-palette/command-palette.svelte";
	import { useWorkspace } from "$lib/hooks/workspace.svelte";
	import { useCommandPalette } from "$lib/hooks/command-palette.svelte";
	import {
		buildCommandActions,
		buildShortcuts,
		handleGlobalShortcut,
		type ShortcutDef,
	} from "$lib/hooks/keyboard-shortcuts";

	let { children } = $props();
	const workspace = useWorkspace();
	const palette = useCommandPalette();
	let hasInitializedWorkspace = $state(false);

	// ── App-level callbacks ────────────────────────────────────────────────
	function openSettings() {
		void goto("/workspace/settings");
	}

	function createBoard() {
		// Dispatch a custom event that the workspace sidebar listens for
		window.dispatchEvent(new CustomEvent("worklog:create-board"));
	}

	function createTicket() {
		// Dispatch a custom event that the kanban board listens for
		window.dispatchEvent(new CustomEvent("worklog:create-ticket"));
	}

	function goToWorkspace() {
		void goto("/workspace");
	}

	function toggleTheme() {
		// Dispatch a custom event that the toolbar listens for
		window.dispatchEvent(new CustomEvent("worklog:toggle-theme"));
	}

	function refreshApp() {
		window.location.reload();
	}

	function closeWorkspace() {
		void workspace.close();
		void goto("/");
	}

	function openWorkspaceFolder() {
		void workspace.pick();
	}

	// ── Command palette actions & shortcuts ────────────────────────────────
	const appCallbacks = {
		openSettings,
		createBoard,
		createTicket,
		goToWorkspace,
		toggleTheme,
		refreshApp,
		closeWorkspace,
		openWorkspace: openWorkspaceFolder,
	};

	const commandActions = buildCommandActions(appCallbacks);
	const shortcuts: ShortcutDef[] = buildShortcuts({
		...appCallbacks,
		openCommandPalette: () => palette.toggle(),
	});

	// Register command actions with the palette
	$effect(() => {
		palette.registerActions(commandActions);
	});

	// ── Global keyboard handler ────────────────────────────────────────────
	function onKeydown(e: KeyboardEvent) {
		// Let the command palette handle its own internal keys when open
		if (palette.isOpen) return;

		handleGlobalShortcut(e, shortcuts);
	}

	// ── Context menu prevention ────────────────────────────────────────────
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

<svelte:window onkeydown={onKeydown} />

<div class="layout-shell">
	<AppToolbar
		showSettings={workspace.status === "ready"}
		onOpenSettings={openSettings}
		onOpenPalette={() => palette.toggle()}
	/>
	{@render children()}

	{#if workspace.status === "idle" || workspace.status === "loading"}
		<Loading />
	{/if}
</div>

<!-- Command Palette (always rendered, visibility managed internally) -->
<CommandPalette />

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

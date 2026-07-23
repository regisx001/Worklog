<script lang="ts">
    import { goto } from "$app/navigation";
    import { Content } from "carbon-components-svelte";
    import { Dashboard } from "carbon-icons-svelte";

    import WorkspaceSidebar from "$lib/components/app/layout/workspace/workspace-sidebar.svelte";
    import { getBoards } from "$lib/hooks/boards.svelte";
    import { useTicketTypes } from "$lib/hooks/ticket-types.svelte";
    import {
        getWorkspaceShellContext,
        setWorkspaceShellContext,
    } from "$lib/hooks/workspace-shell-context";
    import { getWorkspace } from "$lib/hooks/workspace.svelte";
    import { getCommandPalette } from "$lib/hooks/command-palette.svelte";
    import { getReactiveLocale } from "$lib/hooks/locale.svelte";
    import { page } from "$app/state";
    import type { CommandAction } from "$lib/components/app/types";
    import {
        initSyncScheduler,
        destroySyncScheduler,
    } from "$lib/sync/sync-scheduler.svelte";
    import { onDestroy } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    let { children } = $props();
    const workspace = getWorkspace();
    const boardsApi = getBoards(() => workspace.path);
    const ticketTypesApi = useTicketTypes(() => workspace.path);
    const palette = getCommandPalette();

    setWorkspaceShellContext({ workspace, boardsApi, ticketTypesApi });

    let lastLoadedWorkspacePath = $state<string | null>(null);
    let boardLoadError = $state<string | null>(null);

    function openSettings() {
        void goto("/workspace/settings");
    }

    function openBoard(boardId: string) {
        void goto(`/workspace/${boardId}`);
    }

    $effect(() => {
        if (
            workspace.status === "no_workspace" ||
            workspace.status === "error"
        ) {
            void goto("/", { replaceState: true });
        }
    });

    $effect(() => {
        const workspacePath = workspace.path;

        if (workspace.status !== "ready" || !workspacePath) {
            lastLoadedWorkspacePath = null;
            return;
        }

        if (workspacePath === lastLoadedWorkspacePath) {
            return;
        }

        lastLoadedWorkspacePath = workspacePath;
        boardLoadError = null;

        void Promise.all([boardsApi.load(), ticketTypesApi.load()]).catch(
            (error) => {
                boardLoadError = String(error);
                lastLoadedWorkspacePath = null;
            },
        );

        // Load sync config and start auto-sync interval
        import("$lib/db").then(({ getDb }) => {
            getDb(workspacePath).then((db) => {
                import("$lib/sync/sync-config.svelte").then(
                    ({ getSyncConfig }) => {
                        getSyncConfig()
                            .load(db)
                            .then(() => {
                                initSyncScheduler();
                            });
                    },
                );
            });
        });
    });

    // ── Dynamic board-switching commands ────────────────────────────────────
    $effect(() => {
        // Read the reactive dependency
        const boards = boardsApi.boards;
        getReactiveLocale();

        // Build new board actions (or empty list if no boards)
        const boardActions: CommandAction[] = boards.map((board) => ({
            id: `switch-board-${board.id}`,
            label: m.command_switch_to_board({ name: board.name }),
            subtitle: board.description || m.command_open_this_board(),
            shortcut: "",
            category: "Boards",
            icon: Dashboard,
            run: () => {
                boardsApi.setActive(board);
                void goto(`/workspace/${board.id}`);
            },
        }));

        // Use queueMicrotask to defer state writes so they don't
        // trigger re-entry into this effect synchronously
        queueMicrotask(() => {
            palette.removeActionsByPrefix("switch-board-");
            if (boardActions.length > 0) {
                palette.appendActions(boardActions);
            }
        });
    });

    const isSettingsRoute = $derived(page.route.id === "/workspace/settings");

    // Reactive locale anchor — re-renders this layout and the sidebar on language switch
    const _localeTag = $derived(getReactiveLocale());

    onDestroy(() => {
        destroySyncScheduler();
    });
</script>

{#if workspace.status === "ready"}
    <WorkspaceSidebar
        isSetting={isSettingsRoute}
        onOpenSettings={openSettings}
        onOpenBoard={openBoard}
    />
{/if}

<!-- Reactive locale anchor — re-renders sidebar et al on language switch -->
<span style="display:none" aria-hidden="true">{_localeTag}</span>

<Content class="layout-content">
    {#if workspace.status === "ready"}
        {#if boardLoadError}
            <aside class="workspace-load-error" role="alert">
                <strong>{m.workspace_unable_to_load_boards()}</strong>
                <span>{boardLoadError}</span>
            </aside>
        {/if}

        {@render children()}
    {:else}
        <main class="workspace-state">
            <article aria-busy="true">{m.workspace_opening()}</article>
        </main>
    {/if}
</Content>

<style>
    .workspace-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }

    .workspace-load-error {
        margin: var(--cds-spacing-04, 0.75rem);
        padding: var(--cds-spacing-04, 0.75rem);
        display: grid;
        gap: var(--cds-spacing-02, 0.25rem);
        border: 1px solid
            color-mix(in srgb, var(--color-danger, #fa4d56) 40%, transparent);
        border-radius: 0.5rem;
        background: color-mix(
            in srgb,
            var(--color-danger, #fa4d56) 12%,
            transparent
        );
        font-size: 0.875rem;
    }

    /* Ensure content area fills available height for full-height Kanban columns */
    :global(.layout-content.bx--content) {
        display: flex;
        flex-direction: column;
    }
</style>

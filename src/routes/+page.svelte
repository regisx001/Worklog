<script lang="ts">
    import { goto } from "$app/navigation";

    let didRedirect = false;

    $effect(() => {
        if (didRedirect) {
            return;
        }

        didRedirect = true;
        void goto("/workspace", { replaceState: true });
    });
</script>

<svelte:head>
    <title>Worklog | Kanban</title>
    <meta
        name="description"
        content="Local-first kanban board with board sidebar and drag-and-drop workflow."
    />
</svelte:head>

<main class="app-state">
    <article aria-busy="true">Opening workspace...</article>
</main>

<style>
    .app-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--space-3);
    }

    .app-state article {
        width: min(calc(var(--space-3) * 22), 100%);
    }
</style>

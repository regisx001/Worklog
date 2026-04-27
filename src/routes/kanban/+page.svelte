<script lang="ts">
    import { goto } from "$app/navigation";

    $effect(() => {
        void goto("/workspace", { replaceState: true });
    });
</script>

<main class="kanban-redirect">
    <article aria-busy="true">Redirecting to workspace...</article>
</main>

<style>
    .kanban-redirect {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }
</style>

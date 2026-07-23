<script lang="ts">
    import { goto } from "$app/navigation";
    import * as m from "$lib/paraglide/messages.js";

    $effect(() => {
        void goto("/workspace", { replaceState: true });
    });
</script>

<main class="kanban-redirect">
    <article aria-busy="true">{m.workspace_redirecting()}</article>
</main>

<style>
    .kanban-redirect {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }
</style>

<script lang="ts">
    interface Props {
        title: string;
        description: string;
    }

    let { title, description }: Props = $props();
</script>

<header class="kanban-header">
    <h1>{title}</h1>
    <p>{description}</p>
</header>

<style>
    .kanban-header {
        border: 1px solid var(--color-border-soft);
        border-radius: 0.55rem;
        padding: 0.85rem 0.95rem;
    }

    .kanban-header h1 {
        margin: 0;
        font-size: 1rem;
        line-height: 1.2;
    }

    .kanban-header p {
        margin: 0.3rem 0 0;
        color: var(--color-text-muted);
        font-size: 0.78rem;
    }

    @media (max-width: 640px) {
        .kanban-header {
            padding: 0.75rem 0.8rem;
        }

        .kanban-header h1 {
            font-size: 0.92rem;
        }

        .kanban-header p {
            font-size: 0.71rem;
        }
    }
</style>

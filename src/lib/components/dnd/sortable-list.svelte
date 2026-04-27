<!-- src/lib/SortableList.svelte -->
<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { Tile } from "carbon-components-svelte";
    import { Draggable } from "carbon-icons-svelte"; // drag handle icon

    const flipDurationMs = 200;

    let items = $state([
        { id: 1, title: "Task Alpha", status: "In Progress" },
        { id: 2, title: "Task Beta", status: "Pending" },
        { id: 3, title: "Task Gamma", status: "Done" },
    ]);

    function handleConsider(e: CustomEvent) {
        items = e.detail.items;
    }

    function handleFinalize(e: CustomEvent) {
        items = e.detail.items;
    }
</script>

<section
    use:dndzone={{ items, flipDurationMs, type: "task-list" }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
    class="dnd-container"
>
    {#each items as item (item.id)}
        <div animate:flip={{ duration: flipDurationMs }} class="dnd-item">
            <Tile>
                <div class="tile-row">
                    <!-- Carbon drag handle icon -->
                    <span class="drag-handle" aria-hidden="true">
                        <Draggable size={20} />
                    </span>
                    <div>
                        <p class="title">{item.title}</p>
                        <p class="status">{item.status}</p>
                    </div>
                </div>
            </Tile>
        </div>
    {/each}
</section>

<style>
    .dnd-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .dnd-item {
        cursor: grab;
    }
    .dnd-item:active {
        cursor: grabbing;
    }
    .tile-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .drag-handle {
        color: var(--cds-text-secondary);
        cursor: grab;
    }
    .title {
        font-weight: 600;
    }
    .status {
        font-size: 0.75rem;
        color: var(--cds-text-secondary);
    }
</style>

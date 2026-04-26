<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { Tile, Tag } from "carbon-components-svelte";

    const flipDurationMs = 200;

    type Item = { id: number; title: string };

    let todo = $state<Item[]>([
        { id: 1, title: "Design UI" },
        { id: 2, title: "Write tests" },
    ]);
    let doing = $state<Item[]>([{ id: 3, title: "Build API" }]);
    let done = $state<Item[]>([{ id: 4, title: "Setup Tauri" }]);

    const columns = [
        {
            label: "To Do",
            type: "todo",
            color: "red",
            store: () => todo,
            set: (v: Item[]) => (todo = v),
        },
        {
            label: "In Progress",
            type: "doing",
            color: "blue",
            store: () => doing,
            set: (v: Item[]) => (doing = v),
        },
        {
            label: "Done",
            type: "done",
            color: "green",
            store: () => done,
            set: (v: Item[]) => (done = v),
        },
    ];

    function makeHandlers(col: (typeof columns)[0]) {
        return {
            consider: (e: CustomEvent) => col.set(e.detail.items),
            finalize: (e: CustomEvent) => col.set(e.detail.items),
        };
    }
</script>

<h1>kanban BOARD</h1>
<h1>kanban BOARD</h1>

<div class="board">
    {#each columns as col}
        {@const handlers = makeHandlers(col)}
        <div class="column">
            <h3>{col.label}</h3>
            <div
                use:dndzone={{
                    items: col.store(),
                    flipDurationMs,
                    type: "kanban-card",
                }}
                onconsider={handlers.consider}
                onfinalize={handlers.finalize}
                class="drop-zone"
            >
                {#each col.store() as item (item.id)}
                    <div animate:flip={{ duration: flipDurationMs }}>
                        <Tile>
                            <p>{item.title}</p>
                            <Tag type={col.color}>{col.label}</Tag>
                        </Tile>
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style>
    .board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }
    .column {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .drop-zone {
        min-height: 100px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
</style>

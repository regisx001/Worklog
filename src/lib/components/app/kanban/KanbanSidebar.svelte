<script lang="ts">
    import type { BoardSidebarItem } from "./kanban.types.js";

    interface Props {
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onSelectBoard: (boardId: string) => void;
    }

    let { boards, activeBoardId, onSelectBoard }: Props = $props();
</script>

<aside class="kanban-sidebar" aria-label="Boards sidebar">
    <header class="kanban-sidebar-header">
        <h2>Boards</h2>
    </header>

    <nav aria-label="Boards list">
        <ul class="kanban-board-list">
            {#each boards as board (board.id)}
                <li>
                    <button
                        type="button"
                        class="kanban-board-item"
                        data-active={board.id === activeBoardId}
                        onclick={() => onSelectBoard(board.id)}
                        aria-current={board.id === activeBoardId
                            ? "true"
                            : undefined}
                    >
                        <span>{board.name}</span>
                        <small
                            >{board.issueCount
                                .toString()
                                .padStart(2, "0")}</small
                        >
                    </button>
                </li>
            {/each}
        </ul>
    </nav>
</aside>

<style>
    .kanban-sidebar {
        border: 1px solid rgba(143, 163, 191, 0.28);
        border-radius: 0.6rem;
        background: linear-gradient(
            180deg,
            rgba(14, 21, 32, 0.86) 0%,
            rgba(11, 16, 25, 0.8) 100%
        );
        padding: 0.62rem;
        height: 100%;
        min-height: 0;
        overflow: auto;
    }

    .kanban-sidebar-header {
        margin-bottom: 0.46rem;
        padding: 0.1rem 0.15rem 0.45rem;
        border-bottom: 1px solid rgba(151, 174, 206, 0.2);
    }

    .kanban-sidebar-header h2 {
        margin: 0;
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(230, 240, 251, 0.9);
    }

    .kanban-board-list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.34rem;
    }

    .kanban-board-item {
        width: 100%;
        margin: 0;
        border-radius: 0.45rem;
        border: 1px solid rgba(136, 159, 190, 0.22);
        background: rgba(16, 24, 36, 0.6);
        color: rgba(227, 238, 251, 0.9);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.36rem 0.45rem;
        font-size: 0.74rem;
        text-align: left;
    }

    .kanban-board-item small {
        color: var(--color-text-muted);
        font-size: 0.64rem;
    }

    .kanban-board-item[data-active="true"] {
        border-color: rgba(168, 197, 235, 0.52);
        background: rgba(45, 72, 108, 0.42);
    }

    @media (max-width: 920px) {
        .kanban-sidebar {
            height: auto;
            min-height: 0;
            overflow: visible;
        }
    }
</style>

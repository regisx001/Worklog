<script lang="ts">
    import type { DragDropState } from "@thisux/sveltednd";
    import "$lib/styles/dnd.css";
    import KanbanColumn from "./KanbanColumn.svelte";
    import KanbanHeader from "./KanbanHeader.svelte";
    import KanbanSidebar from "./KanbanSidebar.svelte";
    import type {
        BoardSidebarItem,
        KanbanColumnConfig,
        Task,
    } from "./kanban.types.js";

    interface Props {
        title: string;
        description: string;
        boards: BoardSidebarItem[];
        activeBoardId: string;
        onOpenBoard: (boardId: string) => void;
        onUpdateBoard: (
            boardId: string,
            updates: { name: string; description: string },
        ) => void;
        onDeleteBoard: (boardId: string) => void;
        columns: KanbanColumnConfig[];
        tasks: Task[];
        onDrop: (state: DragDropState<Task>) => void;
    }

    const SIDEBAR_WIDTH_KEY = "worklog.kanban.sidebar.width";
    const SIDEBAR_MIN_WIDTH = 220;
    const SIDEBAR_MAX_WIDTH = 420;

    let {
        title,
        description,
        boards,
        activeBoardId,
        onOpenBoard,
        onUpdateBoard,
        onDeleteBoard,
        columns,
        tasks,
        onDrop,
    }: Props = $props();

    let sidebarWidth = $state(264);
    let isResizing = $state(false);
    let layoutElement: HTMLElement | null = null;
    let hasRestoredSidebarWidth = false;

    const clampedSidebarWidth = $derived(
        Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, sidebarWidth)),
    );

    function clampSidebarWidth(width: number): number {
        return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
    }

    function setSidebarWidthFromClientX(clientX: number) {
        if (!layoutElement) {
            return;
        }

        const layoutRect = layoutElement.getBoundingClientRect();
        sidebarWidth = clampSidebarWidth(clientX - layoutRect.left);
    }

    function startResize(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }

        if (window.innerWidth <= 900) {
            return;
        }

        event.preventDefault();
        isResizing = true;
        setSidebarWidthFromClientX(event.clientX);
    }

    function handleWindowMouseMove(event: MouseEvent) {
        if (!isResizing) {
            return;
        }

        setSidebarWidthFromClientX(event.clientX);
    }

    function persistSidebarWidth() {
        try {
            localStorage.setItem(
                SIDEBAR_WIDTH_KEY,
                String(clampedSidebarWidth),
            );
        } catch (error) {
            console.error("Unable to persist sidebar width", error);
        }
    }

    function stopResize() {
        if (!isResizing) {
            return;
        }

        isResizing = false;
        persistSidebarWidth();
    }

    function handleResizerKeydown(event: KeyboardEvent) {
        if (window.innerWidth <= 900) {
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            sidebarWidth = clampSidebarWidth(clampedSidebarWidth - 12);
            persistSidebarWidth();
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            sidebarWidth = clampSidebarWidth(clampedSidebarWidth + 12);
            persistSidebarWidth();
        }
    }

    $effect(() => {
        if (hasRestoredSidebarWidth) {
            return;
        }

        hasRestoredSidebarWidth = true;

        try {
            const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
            if (!savedWidth) {
                return;
            }

            const parsed = Number(savedWidth);
            if (Number.isFinite(parsed)) {
                sidebarWidth = clampSidebarWidth(parsed);
            }
        } catch (error) {
            console.error("Unable to restore sidebar width", error);
        }
    });

    const tasksByStatus = $derived(
        columns.map((column) => ({
            ...column,
            items: tasks.filter((task) => task.status === column.status),
        })),
    );
</script>

<svelte:window onmousemove={handleWindowMouseMove} onmouseup={stopResize} />

<main class="container-fluid kanban-page">
    <div
        class="kanban-layout"
        bind:this={layoutElement}
        style={`--kanban-sidebar-width: ${clampedSidebarWidth}px;`}
    >
        <KanbanSidebar
            {boards}
            {activeBoardId}
            {onOpenBoard}
            {onUpdateBoard}
            {onDeleteBoard}
        />

        <button
            type="button"
            class="kanban-resizer"
            aria-label="Resize boards sidebar"
            data-resizing={isResizing}
            onmousedown={startResize}
            onkeydown={handleResizerKeydown}
        ></button>

        <section class="kanban-workspace">
            <KanbanHeader {title} {description} />

            <section class="kanban-scroll" aria-label="Kanban columns">
                <div class="kanban-grid">
                    {#each tasksByStatus as column (column.status)}
                        <KanbanColumn
                            status={column.status}
                            label={column.label}
                            hint={column.hint}
                            items={column.items}
                            {onDrop}
                        />
                    {/each}
                </div>
            </section>
        </section>
    </div>
</main>

<style>
    .kanban-page {
        padding-inline: 0;
        height: 100%;
        min-height: 0;
    }

    .kanban-layout {
        display: grid;
        grid-template-columns: var(--kanban-sidebar-width, 16.5rem) 0.35rem minmax(
                0,
                1fr
            );
        grid-template-rows: minmax(0, 1fr);
        column-gap: 0.5rem;
        align-items: stretch;
        height: 100%;
        min-height: 0;
    }

    .kanban-resizer {
        appearance: none;
        border: 1px solid var(--color-border-soft);
        width: 100%;
        min-height: 0;
        border-radius: 999px;
        background: rgba(115, 132, 159, 0.18);
        cursor: col-resize;
        margin: 0;
        padding: 0;
    }

    .kanban-resizer:hover,
    .kanban-resizer[data-resizing="true"],
    .kanban-resizer:focus-visible {
        border-color: rgba(162, 186, 221, 0.52);
        background: rgba(143, 165, 198, 0.34);
        outline: none;
    }

    .kanban-workspace {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 0.75rem;
        min-width: 0;
        min-height: 0;
    }

    .kanban-scroll {
        padding-bottom: 0.25rem;
        min-height: 0;
        overflow: auto;
    }

    .kanban-grid {
        padding: 10px;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(17rem, 1fr);
        gap: 0.7rem;
        align-items: start;
    }

    @media (max-width: 900px) {
        .kanban-layout {
            grid-template-columns: 1fr;
            column-gap: 0;
        }

        .kanban-resizer {
            display: none;
        }

        .kanban-grid {
            grid-auto-columns: minmax(15rem, 1fr);
        }
    }

    @media (max-width: 640px) {
        .kanban-page {
            height: auto;
        }
    }
</style>

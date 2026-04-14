<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        open: boolean;
        title: string;
        onClose: () => void;
        children?: Snippet;
        footer?: Snippet;
    }

    let { open, title, onClose, children, footer }: Props = $props();

    function handleCancel(event: Event) {
        event.preventDefault();
        onClose();
    }

    function handleDialogClick(event: MouseEvent) {
        if (event.target !== event.currentTarget) {
            return;
        }

        onClose();
    }

    function handleEscape(event: KeyboardEvent) {
        if (!open || event.key !== "Escape") {
            return;
        }

        event.preventDefault();
        onClose();
    }

    $effect(() => {
        if (!open) {
            return;
        }

        const root = document.documentElement;
        root.classList.add("modal-is-open");

        return () => {
            root.classList.remove("modal-is-open");
        };
    });
</script>

<svelte:window onkeydown={handleEscape} />

{#if open}
    <dialog open oncancel={handleCancel} onclick={handleDialogClick}>
        <article>
            <header>
                <button
                    type="button"
                    class="modal-close"
                    aria-label="Close"
                    onclick={onClose}
                >
                    ×
                </button>
                <p><strong>{title}</strong></p>
            </header>

            {#if children}
                {@render children()}
            {/if}

            {#if footer}
                <footer>
                    {@render footer()}
                </footer>
            {/if}
        </article>
    </dialog>
{/if}

<style>
    dialog > article {
        max-width: 34rem;
    }

    .modal-close {
        float: right;
        margin: 0;
        min-width: 1.8rem;
        padding: 0 0.35rem;
        line-height: 1.2;
    }
</style>

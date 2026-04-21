<script lang="ts">
    interface Props {
        onCancel: () => void;
        onCreate: (title: string) => Promise<void> | void;
    }

    let { onCancel, onCreate }: Props = $props();

    let title = $state("");
    let isCreating = $state(false);
    let inputElement: HTMLInputElement | null = null;
    let didFocusInput = false;

    const isDisabled = $derived(isCreating || title.trim().length === 0);

    async function handleCreate() {
        const normalizedTitle = title.trim();
        if (!normalizedTitle || isCreating) {
            return;
        }

        isCreating = true;

        try {
            await onCreate(normalizedTitle);
            title = "";
        } finally {
            isCreating = false;
        }
    }

    async function handleInputKeydown(event: KeyboardEvent) {
        if (event.key === "Enter") {
            event.preventDefault();
            await handleCreate();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
        }
    }

    $effect(() => {
        if (!inputElement || didFocusInput) {
            return;
        }

        inputElement.focus();
        didFocusInput = true;
    });
</script>

<article class="inline-ticket-create">
    <input
        type="text"
        placeholder="Ticket title..."
        bind:value={title}
        bind:this={inputElement}
        onkeydown={handleInputKeydown}
    />

    <div class="inline-ticket-actions">
        <button type="button" class="secondary outline" onclick={onCancel}>
            Cancel
        </button>
        <button type="button" onclick={handleCreate} disabled={isDisabled}>
            Create
        </button>
    </div>
</article>

<style>
    .inline-ticket-create {
        margin: 0;
        padding: calc(var(--pico-spacing) * 0.65);
    }

    .inline-ticket-create input {
        margin: 0 0 calc(var(--pico-spacing) * 0.4);
        font-size: var(--pico-font-size-small);
    }

    .inline-ticket-actions {
        display: flex;
        justify-content: flex-end;
        gap: calc(var(--pico-spacing) * 0.4);
    }

    .inline-ticket-actions button {
        margin: 0;
        font-size: var(--pico-font-size-small);
        padding: calc(var(--pico-spacing) * 0.35)
            calc(var(--pico-spacing) * 0.75);
    }
</style>

<script lang="ts">
    import { Tag, TextInput, Button } from "carbon-components-svelte";
    import { Add } from "carbon-icons-svelte";
    import * as m from "$lib/paraglide/messages.js";

    let {
        selectedTags = $bindable([]),
        availableTags = [],
        label,
    }: {
        selectedTags: string[];
        availableTags: string[];
        label?: string;
    } = $props();

    let inputValue = $state("");
    let isFocused = $state(false);

    const filteredSuggestions = $derived(
        availableTags
            .filter((tag) => !selectedTags.includes(tag))
            .filter((tag) =>
                tag.toLowerCase().includes(inputValue.toLowerCase()),
            ),
    );

    function addTag(tag: string) {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag && !selectedTags.includes(cleanTag)) {
            selectedTags = [...selectedTags, cleanTag];
        }
        inputValue = "";
    }

    function removeTag(tag: string) {
        selectedTags = selectedTags.filter((t) => t !== tag);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            e.stopPropagation();
            addTag(inputValue);
        } else if (
            e.key === "Backspace" &&
            inputValue === "" &&
            selectedTags.length > 0
        ) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }
    }
</script>

<div class="tag-manager">
    <label class="tag-label" for="tag-input">{label ?? m.modal_tags()}</label>

    <div class="tag-input-container" class:focused={isFocused}>
        <div class="selected-tags">
            {#each selectedTags as tag}
                <Tag type="cool-gray" filter on:close={() => removeTag(tag)}>
                    {tag}
                </Tag>
            {/each}
            <input
                id="tag-input"
                type="text"
                placeholder={selectedTags.length === 0 ? m.tags_add_placeholder() : ""}
                bind:value={inputValue}
                onkeydown={handleKeydown}
                onfocus={() => (isFocused = true)}
                onblur={() => setTimeout(() => (isFocused = false), 200)}
            />
        </div>

        {#if isFocused && (filteredSuggestions.length > 0 || (inputValue.trim() && !selectedTags.includes(inputValue
                            .trim()
                            .toLowerCase())))}
            <div class="suggestions-dropdown">
                {#each filteredSuggestions as suggestion}
                    <button
                        type="button"
                        class="suggestion-item"
                        onclick={() => addTag(suggestion)}
                    >
                        {suggestion}
                    </button>
                {/each}
                {#if inputValue.trim() && !availableTags.some((t) => t.toLowerCase() === inputValue
                                .trim()
                                .toLowerCase()) && !selectedTags.includes(inputValue
                            .trim()
                            .toLowerCase())}
                    <button
                        type="button"
                        class="suggestion-item create-item"
                        onclick={() => addTag(inputValue)}
                    >
                        <Add size={16} />
                        <span>{m.tags_create({ tag: inputValue })}</span>
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .tag-manager {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
    }

    .tag-label {
        font-size: 0.75rem;
        color: var(--cds-text-secondary, #525252);
    }

    .tag-input-container {
        position: relative;
        background-color: var(--cds-field-01, #f4f4f4);
        border: 1px solid var(--cds-ui-04, #8d8d8d);
        border-radius: 2px;
        min-height: 2rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        padding: 0.125rem 0.5rem;
        transition: all 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
    }

    .tag-input-container:hover {
        border-color: var(--cds-ui-05, #161616);
    }

    .tag-input-container.focused {
        outline: 2px solid var(--cds-interactive-01, #0f62fe);
        outline-offset: -1px;
        border-color: transparent;
    }

    .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        align-items: center;
        width: 100%;
    }

    .selected-tags input {
        border: none;
        background: transparent;
        outline: none;
        flex: 1;
        min-width: 60px;
        height: 1.625rem;
        font-size: 0.8125rem;
        color: var(--cds-text-primary, #161616);
    }

    .suggestions-dropdown {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background: var(--cds-ui-01, #ffffff);
        border: 1px solid var(--cds-ui-03, #e0e0e0);
        box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 2px;
    }

    .suggestion-item {
        width: 100%;
        text-align: left;
        padding: 0.625rem 1rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--cds-text-primary, #161616);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .suggestion-item:hover {
        background-color: var(--cds-ui-02, #f4f4f4);
    }

    .create-item {
        border-top: 1px solid var(--cds-ui-03, #e0e0e0);
        color: var(--cds-interactive-01, #0f62fe);
        font-weight: 600;
    }

    :global(.tag-input-container .bx--tag) {
        margin: 0;
        height: 1.25rem;
        font-size: 0.6875rem;
        padding-inline: 0.375rem;
    }
</style>

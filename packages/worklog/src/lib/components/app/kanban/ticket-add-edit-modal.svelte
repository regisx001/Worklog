<script lang="ts">
    import {
        Modal,
        TextInput,
        TextArea,
        Dropdown,
        DatePicker,
        DatePickerInput,
        ContentSwitcher,
        Switch,
    } from "carbon-components-svelte";
    import TagManager from "../common/tag-manager.svelte";
    import MarkdownViewer from "../common/markdown-viewer.svelte";
    import { untrack } from "svelte";
    import {
        TextBold,
        TextItalic,
        Heading as HeadingIcon,
        List,
        ListNumbered,
        Code,
        Terminal,
        Link as LinkIcon,
        Help,
    } from "carbon-icons-svelte";

    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        type TicketType,
        TICKET_TYPE_CONFIG,
        TICKET_TYPE_OPTIONS,
    } from "$lib/components/app/types";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import * as m from "$lib/paraglide/messages.js";

    let {
        open = $bindable(false),
        ticket = null,
        defaultStatus = "todo" as TicketStatus,
        onSubmit,
    }: {
        open: boolean;
        ticket?: Ticket | null;
        defaultStatus?: TicketStatus;
        onSubmit: (data: {
            id?: string;
            title: string;
            description: string;
            priority: TicketPriority;
            ticketType: string;
            startDate: string;
            dueDate: string;
            tags: string[];
            status: TicketStatus;
        }) => Promise<void>;
    } = $props();

    const { ticketTypesApi } = getWorkspaceShellContext();

    const isEditing = $derived(!!ticket);

    let submitting = $state(false);
    let error = $state<string | null>(null);
    let descriptionMode = $state(0); // 0 = Write, 1 = Preview
    let showCheatsheet = $state(false);
    let textareaRef = $state<HTMLTextAreaElement | null>(null);

    // Auto-reset cheatsheet when closing or switching mode
    $effect(() => {
        if (!open || descriptionMode !== 0) {
            showCheatsheet = false;
        }
    });

    function applyFormatting(
        formatType:
            | "bold"
            | "italic"
            | "heading"
            | "bullet"
            | "number"
            | "code"
            | "codeblock"
            | "link",
    ) {
        if (!textareaRef) return;

        const start = textareaRef.selectionStart;
        const end = textareaRef.selectionEnd;
        const text = form.description;
        const selected = text.slice(start, end);

        let replacement = "";
        let newCursorPos = start;
        const boldText = m.markdown_placeholder_bold_text();
        const italicText = m.markdown_placeholder_italic_text();
        const headingText = m.markdown_toolbar_heading();
        const itemText = m.markdown_placeholder_item();
        const codeText = m.markdown_placeholder_code();
        const linkText = m.markdown_placeholder_link_text();

        switch (formatType) {
            case "bold":
                replacement = `**${selected || boldText}**`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + 2;
                break;
            case "italic":
                replacement = `*${selected || italicText}*`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + 1;
                break;
            case "heading":
                // Insert a new line if we are not at start of line
                const needsNewLine = start > 0 && text[start - 1] !== "\n";
                replacement = `${needsNewLine ? "\n" : ""}### ${selected || headingText}`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + replacement.length;
                break;
            case "bullet":
                const needsNLBullet = start > 0 && text[start - 1] !== "\n";
                replacement = `${needsNLBullet ? "\n" : ""}- ${selected || itemText}`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + replacement.length;
                break;
            case "number":
                const needsNLNum = start > 0 && text[start - 1] !== "\n";
                replacement = `${needsNLNum ? "\n" : ""}1. ${selected || itemText}`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + replacement.length;
                break;
            case "code":
                replacement = `\`${selected || codeText}\``;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + 1;
                break;
            case "codeblock":
                const needsNLCode = start > 0 && text[start - 1] !== "\n";
                replacement = `${needsNLCode ? "\n" : ""}\`\`\`\n${selected || codeText}\n\`\`\`\n`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + (needsNLCode ? 5 : 4);
                break;
            case "link":
                replacement = `[${selected || linkText}](https://example.com)`;
                newCursorPos = selected
                    ? start + replacement.length
                    : start + 1;
                break;
        }

        form.description = text.slice(0, start) + replacement + text.slice(end);

        // Wait for DOM update, then restore focus and selection
        setTimeout(() => {
            if (!textareaRef) return;
            textareaRef.focus();
            if (selected) {
                // Keep cursor at end of replacement
                textareaRef.setSelectionRange(
                    start + replacement.length,
                    start + replacement.length,
                );
            } else {
                // Focus the placeholder text
                if (formatType === "bold") {
                    textareaRef.setSelectionRange(start + 2, start + 2 + boldText.length);
                } else if (formatType === "italic") {
                    textareaRef.setSelectionRange(start + 1, start + 1 + italicText.length);
                } else if (formatType === "heading") {
                    const offset = replacement.indexOf("###") + 4;
                    textareaRef.setSelectionRange(
                        start + offset,
                        start + offset + headingText.length,
                    );
                } else if (formatType === "bullet") {
                    const offset = replacement.indexOf("- ") + 2;
                    textareaRef.setSelectionRange(
                        start + offset,
                        start + offset + itemText.length,
                    );
                } else if (formatType === "number") {
                    const offset = replacement.indexOf("1. ") + 3;
                    textareaRef.setSelectionRange(
                        start + offset,
                        start + offset + itemText.length,
                    );
                } else if (formatType === "code") {
                    textareaRef.setSelectionRange(start + 1, start + 1 + codeText.length);
                } else if (formatType === "codeblock") {
                    const offset = replacement.indexOf("```\n") + 4;
                    textareaRef.setSelectionRange(
                        start + offset,
                        start + offset + codeText.length,
                    );
                } else if (formatType === "link") {
                    textareaRef.setSelectionRange(start + 1, start + 1 + linkText.length);
                }
            }
        }, 0);
    }

    function handleTextAreaKeyDown(e: KeyboardEvent) {
        const ref = textareaRef;
        if (!ref) return;

        // Prevent closing modal on Enter
        if (e.key === "Enter") {
            e.stopPropagation();
        }

        // Shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === "b") {
                e.preventDefault();
                applyFormatting("bold");
            } else if (e.key.toLowerCase() === "i") {
                e.preventDefault();
                applyFormatting("italic");
            } else if (e.key.toLowerCase() === "k") {
                e.preventDefault();
                applyFormatting("link");
            }
        }

        // Tab Indentation
        if (e.key === "Tab") {
            e.preventDefault();
            const start = ref.selectionStart;
            const end = ref.selectionEnd;
            const text = form.description;

            if (e.shiftKey) {
                // Outdent
                const beforeText = text.substring(0, start);
                const lineStartIdx = beforeText.lastIndexOf("\n") + 1;
                const lineText = text.substring(lineStartIdx, start);

                if (lineText.startsWith("\t")) {
                    form.description =
                        text.slice(0, lineStartIdx) +
                        lineText.slice(1) +
                        text.slice(start);
                    setTimeout(() => {
                        ref.setSelectionRange(
                            Math.max(lineStartIdx, start - 1),
                            Math.max(lineStartIdx, start - 1),
                        );
                    }, 0);
                } else if (lineText.startsWith("    ")) {
                    form.description =
                        text.slice(0, lineStartIdx) +
                        lineText.slice(4) +
                        text.slice(start);
                    setTimeout(() => {
                        ref.setSelectionRange(
                            Math.max(lineStartIdx, start - 4),
                            Math.max(lineStartIdx, start - 4),
                        );
                    }, 0);
                } else if (lineText.startsWith("  ")) {
                    form.description =
                        text.slice(0, lineStartIdx) +
                        lineText.slice(2) +
                        text.slice(start);
                    setTimeout(() => {
                        ref.setSelectionRange(
                            Math.max(lineStartIdx, start - 2),
                            Math.max(lineStartIdx, start - 2),
                        );
                    }, 0);
                }
            } else {
                // Indent
                form.description =
                    text.slice(0, start) + "    " + text.slice(end);
                setTimeout(() => {
                    ref.setSelectionRange(start + 4, start + 4);
                }, 0);
            }
        }
    }

    let form = $state<{
        id?: string;
        title: string;
        description: string;
        priority: TicketPriority;
        ticketType: string;
        startDate: string;
        dueDate: string;
        tags: string[];
    }>({
        title: "",
        description: "",
        priority: "p2",
        ticketType: "feature",
        startDate: "",
        dueDate: "",
        tags: [],
    });

    let initialForm = $state("");
    let showExitConfirm = $state(false);

    function getFormSnapshot() {
        return JSON.stringify(form);
    }

    function checkDirty() {
        return initialForm !== getFormSnapshot();
    }

    const TAG_OPTIONS = [
        "frontend",
        "backend",
        "design",
        "docs",
        "devops",
        "auth",
        "api",
        "native",
        "tauri",
        "svelte",
        "setup",
        "blocked",
    ];

    // Reset form when modal opens
    $effect(() => {
        if (open) {
            untrack(() => {
                error = null;
                if (ticket) {
                    form = {
                        id: ticket.id,
                        title: ticket.title,
                        description: ticket.description,
                        priority: ticket.priority,
                        ticketType: ticket.ticket_type,
                        startDate: ticket.start_date ?? "",
                        dueDate: ticket.due_date ?? "",
                        tags: ticket.labels ?? [],
                    };
                } else {
                    const defaultType =
                        ticketTypesApi.types.find((t) => t.is_default) ||
                        ticketTypesApi.types[0];
                    form = {
                        title: "",
                        description: "",
                        priority: "p2",
                        ticketType: defaultType?.id || "feature",
                        startDate: "",
                        dueDate: "",
                        tags: [],
                    };
                }
                // Capture the state AFTER the form has been populated
                initialForm = getFormSnapshot();
            });
        }
    });

    async function handleSubmit() {
        if (!form.title.trim()) return;
        try {
            submitting = true;
            error = null;
            await onSubmit({
                id: form.id,
                title: form.title,
                description: form.description || "",
                priority: form.priority,
                ticketType: form.ticketType,
                startDate: form.startDate,
                dueDate: form.dueDate,
                tags: form.tags,
                status: defaultStatus,
            });
            initialForm = getFormSnapshot(); // Update initial state after save
            open = false;
        } catch (e) {
            error = String(e);
        } finally {
            submitting = false;
        }
    }

    function handleRequestClose() {
        if (checkDirty()) {
            showExitConfirm = true;
        } else {
            open = false;
        }
    }

    function confirmExit() {
        showExitConfirm = false;
        open = false;
    }
</script>

<Modal
    bind:open
    modalHeading={isEditing ? m.modal_edit_ticket() : m.modal_new_ticket()}
    primaryButtonText={isEditing
        ? m.modal_save_changes()
        : m.modal_create_ticket()}
    secondaryButtonText={m.modal_cancel()}
    on:click:button--primary={handleSubmit}
    on:click:button--secondary={handleRequestClose}
    on:open
    on:close={(e) => {
        // Only show confirmation if we're actually closing and it's dirty
        // We use checkDirty() here to avoid constant reactive updates
        if (open && checkDirty()) {
            e.preventDefault();
            showExitConfirm = true;
        }
    }}
    primaryButtonDisabled={!form.title.trim() || submitting}
    preventCloseOnClickOutside
    size="lg"
>
    <div class="modal-form">
        {#if error}
            <p class="modal-error">{error}</p>
        {/if}

        <div class="form-main">
            <TextInput
                labelText={m.modal_title_label()}
                placeholder={m.modal_title_placeholder()}
                bind:value={form.title}
                on:keydown={(e) => {
                    if (e.key === "Enter") e.stopPropagation();
                }}
            />
            <div class="description-section">
                <div class="description-header">
                    <span class="cds--label">{m.modal_description_label()}</span
                    >
                    <ContentSwitcher
                        bind:selectedIndex={descriptionMode}
                        size="sm"
                    >
                        <Switch text={m.modal_write()} />
                        <Switch text={m.modal_preview()} />
                    </ContentSwitcher>
                </div>

                <div class="description-content">
                    {#if descriptionMode === 0}
                        <div class="markdown-toolbar">
                            <div class="toolbar-buttons-left">
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("bold")}
                                    title={m.markdown_toolbar_bold()}
                                >
                                    <TextBold size={16} />
                                </button>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("italic")}
                                    title={m.markdown_toolbar_italic()}
                                >
                                    <TextItalic size={16} />
                                </button>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("heading")}
                                    title={m.markdown_toolbar_heading()}
                                >
                                    <HeadingIcon size={16} />
                                </button>
                                <span class="toolbar-divider"></span>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("bullet")}
                                    title={m.markdown_toolbar_unordered_list()}
                                >
                                    <List size={16} />
                                </button>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("number")}
                                    title={m.markdown_toolbar_ordered_list()}
                                >
                                    <ListNumbered size={16} />
                                </button>
                                <span class="toolbar-divider"></span>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("code")}
                                    title={m.markdown_toolbar_inline_code()}
                                >
                                    <Code size={16} />
                                </button>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("codeblock")}
                                    title={m.markdown_toolbar_code_block()}
                                >
                                    <Terminal size={16} />
                                </button>
                                <button
                                    type="button"
                                    class="toolbar-btn"
                                    onclick={() => applyFormatting("link")}
                                    title={m.markdown_toolbar_insert_link()}
                                >
                                    <LinkIcon size={16} />
                                </button>
                            </div>
                            <div class="toolbar-buttons-right">
                                <button
                                    type="button"
                                    class="toolbar-btn toolbar-btn--help"
                                    class:toolbar-btn--active={showCheatsheet}
                                    onclick={() =>
                                        (showCheatsheet = !showCheatsheet)}
                                    title={m.markdown_toolbar_help()}
                                >
                                    <Help size={16} />
                                </button>
                            </div>
                        </div>

                        {#if showCheatsheet}
                            <div class="markdown-cheatsheet">
                                <div class="cheatsheet-title">
                                    {m.markdown_cheatsheet_title()}
                                </div>
                                <div class="cheatsheet-grid">
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_bold()}</code> &rarr;
                                        <strong>{m.markdown_cheatsheet_bold()}</strong>
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_italic()}</code> &rarr;
                                        <em>{m.markdown_cheatsheet_italic()}</em>
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_heading()}</code> &rarr;
                                        <span style="font-weight: 600;"
                                            >{m.markdown_cheatsheet_h3_header()}</span
                                        >
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_bullet()}</code> &rarr; {m.markdown_cheatsheet_bullet_list()}
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_number()}</code> &rarr; {m.markdown_cheatsheet_number_list()}
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_inline_code()}</code> &rarr;
                                        <code>{m.markdown_cheatsheet_inline_code()}</code>
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_link()}</code> &rarr;
                                        <span
                                            style="color: var(--cds-link-01, #0f62fe); text-decoration: underline;"
                                            >{m.markdown_cheatsheet_link()}</span
                                        >
                                    </div>
                                    <div class="cheatsheet-item">
                                        <code>{m.markdown_example_code_block()}</code> &rarr; {m.markdown_toolbar_code_block()}
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <TextArea
                            bind:ref={textareaRef}
                            placeholder={m.modal_description_placeholder()}
                            rows={16}
                            bind:value={form.description}
                            on:keydown={handleTextAreaKeyDown}
                        />
                    {:else}
                        <div class="description-preview">
                            <MarkdownViewer content={form.description} />
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="attributes-strip">
            <div class="attr-field">
                <Dropdown
                    labelText={m.modal_priority()}
                    size="sm"
                    bind:selectedId={form.priority}
                    items={[
                        { id: "p3", text: m.modal_priority_low() },
                        { id: "p2", text: m.modal_priority_medium() },
                        { id: "p1", text: m.modal_priority_high() },
                    ]}
                />
            </div>
            <div class="attr-field attr-field--grow">
                <Dropdown
                    labelText={m.modal_type()}
                    size="sm"
                    bind:selectedId={form.ticketType}
                    items={ticketTypesApi.types.map((t) => ({
                        id: t.id,
                        text: t.name,
                    }))}
                />
            </div>
            <div class="attr-field">
                {#key open}
                    <DatePicker
                        bind:value={form.startDate}
                        datePickerType="single"
                        dateFormat="Y-m-d"
                    >
                        <DatePickerInput
                            labelText={m.modal_start_date()}
                            placeholder="yyyy-mm-dd"
                            size="sm"
                        />
                    </DatePicker>
                {/key}
            </div>
            <div class="attr-field">
                {#key open}
                    <DatePicker
                        bind:value={form.dueDate}
                        datePickerType="single"
                        dateFormat="Y-m-d"
                    >
                        <DatePickerInput
                            labelText={m.modal_due_date()}
                            placeholder="yyyy-mm-dd"
                            size="sm"
                        />
                    </DatePicker>
                {/key}
            </div>
            <div class="attr-field attr-field--tags">
                <TagManager
                    label={m.modal_tags()}
                    availableTags={TAG_OPTIONS}
                    bind:selectedTags={form.tags}
                />
            </div>
        </div>
    </div>
</Modal>

<Modal
    danger
    bind:open={showExitConfirm}
    modalHeading={m.modal_unsaved_heading()}
    primaryButtonText={m.modal_discard_changes()}
    secondaryButtonText={m.modal_continue_editing()}
    on:click:button--primary={confirmExit}
    on:click:button--secondary={() => (showExitConfirm = false)}
>
    <p>{m.modal_unsaved_msg()}</p>
</Modal>

<style>
    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding-block: 0.5rem;
    }

    .form-main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    /* ── Compact Attributes Strip ──────────────────────────────────────────── */
    .attributes-strip {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding-top: 0.75rem;
        border-top: 1px solid var(--cds-ui-03);
    }

    .attr-field {
        display: flex;
        flex-direction: column;
        min-width: 7rem;
        flex-shrink: 0;
    }

    .attr-field--grow {
        min-width: 9rem;
        flex: 1;
    }

    .attr-field--tags {
        flex: 2;
        min-width: 12rem;
    }

    /* Force sm Dropdown to not grow full width */
    .attr-field :global(.bx--dropdown) {
        width: 100%;
    }

    /* Align DatePicker to strip — prevent it from overflowing */
    .attr-field :global(.bx--date-picker) {
        width: 100%;
    }

    .attr-field :global(.bx--date-picker-input__wrapper) {
        width: 100%;
    }

    .attr-field :global(.bx--date-picker--single .bx--date-picker__input) {
        width: 100%;
    }

    .modal-error {
        color: var(--cds-support-01);
        font-size: 0.8125rem;
        margin: 0;
        padding: 0.75rem;
        background: color-mix(in srgb, var(--cds-support-01) 10%, transparent);
        border-radius: 4px;
    }

    .description-section {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        /* Single source of truth for editor height */
        --editor-h: 20rem;
    }

    .description-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    /* Make the Write/Preview switcher compact and not full-width */
    .description-header :global(.bx--content-switcher) {
        width: auto !important;
        min-width: 0 !important;
    }

    .description-header :global(.bx--content-switcher-btn) {
        padding-inline: 0.625rem !important;
        min-width: 3.5rem !important;
        font-size: 0.6875rem !important;
    }

    .description-content {
        min-height: 7.5rem;
    }

    .description-preview {
        padding: 0.5rem 0.625rem;
        background: var(--cds-ui-background);
        border: 1px solid var(--cds-ui-04);
        border-radius: 4px;
        min-height: var(--editor-h);
        height: var(--editor-h);
        overflow-y: auto;
    }

    /* ── Markdown Editor Styles ────────────────────────────────────────────── */
    .markdown-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--cds-ui-02, #f4f4f4);
        border: 1px solid var(--cds-ui-03, #e0e0e0);
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        padding: 0.35rem 0.5rem;
        gap: 0.5rem;
    }

    .toolbar-buttons-left {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.2rem;
    }

    .toolbar-buttons-right {
        display: flex;
        align-items: center;
    }

    .toolbar-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 3px;
        color: var(--cds-text-secondary, #525252);
        cursor: pointer;
        transition:
            background 0.15s ease,
            color 0.15s ease;
    }

    .toolbar-btn:hover {
        background: var(--cds-hover-ui, #e5e5e5);
        color: var(--cds-text-primary, #161616);
    }

    .toolbar-btn--active {
        background: var(--cds-selected-ui, #cacaca) !important;
        color: var(--cds-text-primary, #161616) !important;
    }

    .toolbar-divider {
        width: 1px;
        height: 1rem;
        background: var(--cds-ui-03, #e0e0e0);
        margin-inline: 0.25rem;
    }

    .markdown-cheatsheet {
        background: var(--cds-ui-01, #ffffff);
        border: 1px solid var(--cds-ui-03, #e0e0e0);
        border-bottom: none;
        padding: 0.75rem;
        font-size: 0.75rem;
        animation: slideDown 0.2s ease-out;
    }

    .cheatsheet-title {
        font-weight: 600;
        color: var(--cds-text-primary, #161616);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.6875rem;
    }

    .cheatsheet-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 0.5rem 0.75rem;
    }

    .cheatsheet-item {
        color: var(--cds-text-secondary, #525252);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cheatsheet-item code {
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        font-size: 0.7rem;
        background: var(--cds-ui-02, #f4f4f4);
        padding: 0.1rem 0.25rem;
        border-radius: 2px;
        color: var(--cds-text-primary, #161616);
    }

    :global(.description-content .bx--text-area__wrapper) {
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
    }

    :global(.description-content .bx--text-area) {
        border-top: none !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
        min-height: var(--editor-h) !important;
        height: var(--editor-h) !important;
        resize: vertical;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

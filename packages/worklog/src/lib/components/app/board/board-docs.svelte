<script lang="ts">
    import {
        Document,
        DocumentAdd,
        Edit,
        Folder,
        FolderAdd,
        ChevronRight,
        ChevronDown,
        TrashCan,
        Notebook,
    } from "carbon-icons-svelte";
    import { Button } from "carbon-components-svelte";
    import {
        listDocFiles,
        readDocFile,
        writeDocFile,
        createDocFile,
        deleteDocFile,
        renameDocFile,
        createDocFolder,
        docsDirectoryExists,
        docsDir,
        type DocFileEntry,
    } from "$lib/hooks/board-docs.svelte";
    import * as m from "$lib/paraglide/messages.js";

    interface Props {
        workspacePath: string;
        boardId: string;
    }

    let { workspacePath, boardId }: Props = $props();

    // ── State ──────────────────────────────────────────────────────────────
    let files = $state<DocFileEntry[]>([]);
    let selectedPath = $state<string | null>(null);
    let fileContent = $state<string | null>(null);
    let loading = $state(true);
    let hasDocsDir = $state(false);
    let expandedFolders = $state<Set<string>>(new Set());
    let error = $state<string | null>(null);

    // ── Editor state ───────────────────────────────────────────────────────
    let editing = $state(false);
    let draftContent = $state("");
    let pendingSave = $state(false);
    let editDraftEl = $state<HTMLTextAreaElement | null>(null);
    let saving = $state(false);
    let savedIndicator = $state(false);

    // Show "Saved!" feedback briefly after save
    function flashSaved() {
        savedIndicator = true;
        setTimeout(() => {
            savedIndicator = false;
        }, 1500);
    }

    // ── Formatting toolbar & slash commands ─────────────────────────────────
    const FORMAT_ACTIONS = $derived([
        {
            id: "bold",
            label: "B",
            title: m.markdown_toolbar_bold(),
            action: () => insertWrap("**", "**"),
        },
        {
            id: "h1",
            label: "H1",
            title: m.markdown_toolbar_heading_1(),
            action: () => insertLine("# "),
        },
        {
            id: "h2",
            label: "H2",
            title: m.markdown_toolbar_heading_2(),
            action: () => insertLine("## "),
        },
        {
            id: "h3",
            label: "H3",
            title: m.markdown_toolbar_heading_3(),
            action: () => insertLine("### "),
        },
        {
            id: "bullet",
            label: "\u2022",
            title: m.markdown_toolbar_bullet_list(),
            action: () => insertLine("- "),
        },
        {
            id: "numbered",
            label: "1.",
            title: m.markdown_toolbar_numbered_list(),
            action: () => insertLine("1. "),
        },
        {
            id: "codeblock",
            label: "<>",
            title: m.markdown_toolbar_code_block(),
            action: () => insertCodeBlock(),
        },
    ] as const);

    interface SlashCmd {
        id: string;
        label: string;
        match: string;
        action: () => void;
    }

    const SLASH_COMMANDS: SlashCmd[] = $derived([
        {
            id: "bold",
            label: m.markdown_toolbar_bold_label(),
            match: "bold b",
            action: () => insertWrap("**", "**"),
        },
        {
            id: "h1",
            label: m.markdown_toolbar_heading_1(),
            match: "h1 heading 1",
            action: () => insertLine("# "),
        },
        {
            id: "h2",
            label: m.markdown_toolbar_heading_2(),
            match: "h2 heading 2",
            action: () => insertLine("## "),
        },
        {
            id: "h3",
            label: m.markdown_toolbar_heading_3(),
            match: "h3 heading 3",
            action: () => insertLine("### "),
        },
        {
            id: "bullet",
            label: m.markdown_toolbar_bullet_list(),
            match: "bullet ul -",
            action: () => insertLine("- "),
        },
        {
            id: "numbered",
            label: m.markdown_toolbar_numbered_list(),
            match: "numbered ol 1.",
            action: () => insertLine("1. "),
        },
        {
            id: "codeblock",
            label: m.markdown_toolbar_code_block(),
            match: "code block ```",
            action: () => insertCodeBlock(),
        },
    ]);

    // Slash menu state
    let slashOpen = $state(false);
    let slashSearch = $state("");
    let slashIndex = $state(0);
    let slashMenuEl = $state<HTMLElement | null>(null);

    const slashFiltered = $derived(
        slashOpen && slashSearch
            ? SLASH_COMMANDS.filter((c) =>
                  c.match.toLowerCase().includes(slashSearch.toLowerCase()),
              )
            : SLASH_COMMANDS,
    );

    function openSlashMenu(cursor: number) {
        // Extract search term: text between '/' and cursor
        const before = draftContent.slice(0, cursor);
        const slashIdx = before.lastIndexOf("/");
        if (slashIdx === -1) {
            slashOpen = false;
            return;
        }
        const term = before.slice(slashIdx + 1);

        slashSearch = term;
        slashOpen = true;
        slashIndex = 0;
    }

    function closeSlashMenu() {
        slashOpen = false;
        slashSearch = "";
        slashIndex = 0;
    }

    function applySlashCommand(cmd: SlashCmd) {
        const ta = editDraftEl;
        if (!ta) return;
        const cursor = ta.selectionStart;
        const before = draftContent.slice(0, cursor);
        const slashIdx = before.lastIndexOf("/");
        const afterSlash = before.slice(slashIdx);
        const endOfWord = afterSlash.match(/^\/\w*/)?.[0]?.length ?? 0;
        const start = slashIdx;
        const end = start + endOfWord;
        // Remove the /command text
        draftContent = draftContent.slice(0, start) + draftContent.slice(end);
        // Reset cursor to where / was
        ta.selectionStart = start;
        ta.selectionEnd = start;
        // Run the formatting action
        cmd.action();
        closeSlashMenu();
        requestAnimationFrame(() => ta?.focus());
    }

    function handleSlashKeydown(e: KeyboardEvent) {
        if (!slashOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            slashIndex = Math.min(slashIndex + 1, slashFiltered.length - 1);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            slashIndex = Math.max(slashIndex - 1, 0);
            return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            const cmd = slashFiltered[slashIndex];
            if (cmd) applySlashCommand(cmd);
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            closeSlashMenu();
            return;
        }
    }

    // Detect slash in textarea input
    function handleFormatInput() {
        const ta = editDraftEl;
        if (!ta) return;
        const cursor = ta.selectionStart;
        if (cursor === 0) {
            closeSlashMenu();
            return;
        }
        const charBefore = draftContent[cursor - 1];
        if (charBefore === "/") {
            openSlashMenu(cursor);
        } else if (slashOpen) {
            const before = draftContent.slice(0, cursor);
            const slashIdx = before.lastIndexOf("/");
            if (slashIdx === -1) {
                closeSlashMenu();
                return;
            }
            const term = before.slice(slashIdx + 1);
            if (term.includes(" ") || term.includes("\n")) {
                closeSlashMenu();
            } else {
                slashSearch = term;
                slashIndex = 0;
            }
        }
    }

    // ── Markdown insertion helpers ─────────────────────────────────────────
    function getTa(): HTMLTextAreaElement | null {
        return editDraftEl;
    }

    function insertWrap(before: string, after: string) {
        const ta = getTa();
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = draftContent.slice(start, end) || m.markdown_placeholder_text();
        const replacement = `${before}${selected}${after}`;
        draftContent =
            draftContent.slice(0, start) +
            replacement +
            draftContent.slice(end);
        requestAnimationFrame(() => {
            ta.focus();
            ta.selectionStart = start + before.length;
            ta.selectionEnd = start + before.length + selected.length;
        });
    }

    function insertLine(prefix: string) {
        const ta = getTa();
        if (!ta) return;
        const start = ta.selectionStart;
        // Find start of current line
        const before = draftContent.slice(0, start);
        const lineStart = before.lastIndexOf("\n") + 1;
        const insertion = `${prefix}`;
        draftContent =
            draftContent.slice(0, lineStart) +
            insertion +
            draftContent.slice(lineStart);
        requestAnimationFrame(() => {
            ta.focus();
            const newCursor = lineStart + insertion.length;
            ta.selectionStart = newCursor;
            ta.selectionEnd = newCursor;
        });
    }

    function insertCodeBlock() {
        const ta = getTa();
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = draftContent.slice(start, end) || m.markdown_placeholder_code();
        const replacement = "```\n" + selected + "\n```";
        draftContent =
            draftContent.slice(0, start) +
            replacement +
            draftContent.slice(end);
        requestAnimationFrame(() => {
            ta.focus();
            const newCursor = start + replacement.length;
            ta.selectionStart = newCursor;
            ta.selectionEnd = newCursor;
        });
    }

    // ── Error surfacing ────────────────────────────────────────────────────
    let actionError = $state<string | null>(null);
    let actionErrorTimer: ReturnType<typeof setTimeout> | null = null;

    function showError(msg: string) {
        actionError = msg;
        if (actionErrorTimer) clearTimeout(actionErrorTimer);
        actionErrorTimer = setTimeout(() => {
            actionError = null;
        }, 6000);
    }

    function clearError() {
        if (actionErrorTimer) clearTimeout(actionErrorTimer);
        actionError = null;
    }

    // ── Load file tree ─────────────────────────────────────────────────────
    async function loadFiles() {
        loading = true;
        error = null;
        try {
            const exists = await docsDirectoryExists(workspacePath, boardId);
            hasDocsDir = exists;

            if (exists) {
                const entries = await listDocFiles(workspacePath, boardId);
                files = entries;
                // Auto-expand all top-level directories
                for (const entry of entries) {
                    if (entry.isDir) {
                        expandedFolders.add(entry.relativePath);
                    }
                }
            }
        } catch (e) {
            error = String(e);
            files = [];
        } finally {
            loading = false;
        }
    }

    // Reload when board changes
    $effect(() => {
        // Read reactive deps
        const _workspacePath = workspacePath;
        const _boardId = boardId;
        if (!_workspacePath || !_boardId) return;
        void loadFiles();
    });

    // ── File selection ─────────────────────────────────────────────────────
    let prevSelectedPath = $state<string | null>(null);

    async function selectFile(entry: DocFileEntry) {
        if (entry.isDir) return;
        selectedPath = entry.relativePath;
    }

    $effect(() => {
        if (!selectedPath || selectedPath === prevSelectedPath) return;
        prevSelectedPath = selectedPath;
        fileContent = null;

        void (async () => {
            try {
                const content = await readDocFile(
                    workspacePath,
                    boardId,
                    selectedPath!,
                );
                fileContent = content;
            } catch (e) {
                fileContent = `*${m.docs_error_reading_file({ error: String(e) })}*`;
            }
        })();
    });

    // ── Create new note (inline filename input) ────────────────────────────
    let creatingFile = $state(false);
    let newFileName = $state("");
    let newFileInputEl = $state<HTMLInputElement | null>(null);

    function startCreateFile() {
        creatingFile = true;
        newFileName = "";
        // If docs dir doesn't exist yet, suggest README.md as default
        if (!hasDocsDir) {
            newFileName = "README.md";
        }
        requestAnimationFrame(() => {
            newFileInputEl?.focus();
            newFileInputEl?.select();
        });
    }

    async function confirmCreateFile() {
        const name = newFileName.trim();
        if (!name) {
            creatingFile = false;
            return;
        }

        clearError();
        const fileName = name.endsWith(".md") ? name : `${name}.md`;
        creatingFile = false;
        try {
            const result = await createDocFile(
                workspacePath,
                boardId,
                fileName,
                `# ${fileName.replace(".md", "")}\n\n`,
            );
            if (result) {
                await loadFiles();
                const newEntry = findEntry(files, result);
                if (newEntry) {
                    selectedPath = newEntry.relativePath;
                }
            } else {
                showError(
                    m.docs_create_file_failed(),
                );
            }
        } catch (e) {
            showError(String(e));
        }
    }

    function handleNewFileKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            void confirmCreateFile();
        } else if (e.key === "Escape") {
            e.preventDefault();
            creatingFile = false;
        }
    }

    function findEntry(
        entries: DocFileEntry[],
        relativePath: string,
    ): DocFileEntry | null {
        for (const entry of entries) {
            if (entry.relativePath === relativePath) return entry;
            if (entry.isDir) {
                const found = findEntry(entry.children, relativePath);
                if (found) return found;
            }
        }
        return null;
    }

    // ── Editor mode ────────────────────────────────────────────────────────
    function enterEditMode() {
        if (!fileContent) return;
        draftContent = fileContent;
        editing = true;

        // Focus textarea on next tick after render
        requestAnimationFrame(() => {
            editDraftEl?.focus();
        });
    }

    // Global Ctrl+S handler (catches it even if textarea isn't focused)
    function handleWindowKeydown(e: KeyboardEvent) {
        if (!editing) return;
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            void handleSave();
        }
    }

    async function handleSave() {
        if (!selectedPath || saving) return;
        saving = true;
        try {
            const saved = await writeDocFile(
                workspacePath,
                boardId,
                selectedPath,
                draftContent,
            );
            if (saved) {
                fileContent = draftContent;
                flashSaved();
            }
        } finally {
            saving = false;
        }
    }

    function exitEditMode() {
        void handleSave().then(() => {
            editing = false;
        });
    }

    function handleEditorKeydown(e: KeyboardEvent) {
        // Ctrl+S → save
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            void handleSave();
            return;
        }
        // Esc → save & exit (only if slash menu is closed)
        if (e.key === "Escape") {
            if (slashOpen) {
                closeSlashMenu();
                return;
            }
            e.preventDefault();
            void exitEditMode();
            return;
        }
        // Arrow keys in slash menu
        if (
            slashOpen &&
            (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Tab")
        ) {
            handleSlashKeydown(e);
            return;
        }
        // Enter in slash menu
        if (slashOpen && e.key === "Enter") {
            handleSlashKeydown(e);
            return;
        }
        // Ctrl+B → bold
        if ((e.ctrlKey || e.metaKey) && e.key === "b") {
            e.preventDefault();
            insertWrap("**", "**");
            return;
        }
    }

    // When switching files while editing, save first
    $effect(() => {
        if (!editing || !selectedPath) return;
        if (selectedPath !== prevSelectedPath) {
            // User clicked a different file — save draft first
            void handleSave().then(() => {
                editing = false;
            });
        }
    });

    // ── File management: rename ───────────────────────────────────────────
    let renamingPath = $state<string | null>(null);
    let renameValue = $state("");
    let renameInputEl = $state<HTMLInputElement | null>(null);

    function startRename(entry: DocFileEntry) {
        if (editing) return;
        renamingPath = entry.relativePath;
        renameValue = entry.name;
        requestAnimationFrame(() => {
            renameInputEl?.focus();
            renameInputEl?.select();
        });
    }

    async function confirmRename() {
        const oldPath = renamingPath;
        if (!oldPath || !renameValue.trim()) {
            renamingPath = null;
            return;
        }

        const newName = renameValue.trim();
        // Preserve extension for files (not dirs)
        const isDir = oldPath === oldPath.replace(/\//g, "") ? false : true;
        const finalName = isDir
            ? newName
            : newName.endsWith(".md")
              ? newName
              : `${newName}.md`;

        renamingPath = null;
        const result = await renameDocFile(
            workspacePath,
            boardId,
            oldPath,
            finalName,
        );
        if (result) {
            // If the renamed file was selected, update selection
            if (selectedPath === oldPath) {
                selectedPath = result;
            }
            await loadFiles();
        }
    }

    function cancelRename() {
        renamingPath = null;
    }

    function handleRenameKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            void confirmRename();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelRename();
        }
    }

    // ── File management: delete ────────────────────────────────────────────
    let deletingPath = $state<string | null>(null);

    async function confirmDelete(entry: DocFileEntry) {
        if (editing) return;
        const confirmed = window.confirm(
            entry.isDir
                ? m.docs_delete_folder_confirm({ name: entry.name })
                : m.docs_delete_file_confirm({ name: entry.name }),
        );
        if (!confirmed) return;

        deletingPath = entry.relativePath;
        try {
            const deleted = await deleteDocFile(
                workspacePath,
                boardId,
                entry.relativePath,
            );
            if (deleted) {
                // If the deleted file was selected, clear selection
                if (selectedPath === entry.relativePath) {
                    selectedPath = null;
                    fileContent = null;
                }
                await loadFiles();
            }
        } finally {
            deletingPath = null;
        }
    }

    // ── File management: create folder ─────────────────────────────────────
    let creatingFolder = $state(false);
    let newFolderValue = $state("");
    let newFolderInputEl = $state<HTMLInputElement | null>(null);

    function startCreateFolder() {
        creatingFolder = true;
        newFolderValue = "";
        requestAnimationFrame(() => {
            newFolderInputEl?.focus();
        });
    }

    async function confirmCreateFolder() {
        if (!newFolderValue.trim()) {
            creatingFolder = false;
            return;
        }
        creatingFolder = false;
        await createDocFolder(workspacePath, boardId, newFolderValue.trim());
        await loadFiles();
    }

    function handleNewFolderKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            void confirmCreateFolder();
        } else if (e.key === "Escape") {
            e.preventDefault();
            creatingFolder = false;
        }
    }

    // ── Folder toggle ──────────────────────────────────────────────────────
    function toggleFolder(relativePath: string) {
        if (expandedFolders.has(relativePath)) {
            expandedFolders.delete(relativePath);
        } else {
            expandedFolders.add(relativePath);
        }
        // Trigger reactivity by creating a new Set
        expandedFolders = new Set(expandedFolders);
    }

    // ── Inline markdown renderer ───────────────────────────────────────────
    function renderMarkdown(md: string): string {
        const lines = md.split("\n");
        const htmlParts: string[] = [];
        let inParagraph = false;

        function closeParagraph() {
            if (inParagraph) {
                htmlParts.push("</p>");
                inParagraph = false;
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Blank line → paragraph break
            if (trimmed === "") {
                closeParagraph();
                continue;
            }

            // Headings
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                closeParagraph();
                const level = headingMatch[1].length;
                const text = inlineMarkdown(escapeHtml(headingMatch[2]));
                htmlParts.push(`<h${level}>${text}</h${level}>`);
                continue;
            }

            // Unordered list items
            const listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
            if (listMatch) {
                closeParagraph();
                const text = inlineMarkdown(escapeHtml(listMatch[1]));
                htmlParts.push(`<li>${text}</li>`);
                continue;
            }

            // Horizontal rule
            if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
                closeParagraph();
                htmlParts.push("<hr>");
                continue;
            }

            // Regular paragraph line
            if (!inParagraph) {
                htmlParts.push("<p>");
                inParagraph = true;
            } else {
                htmlParts.push("<br>");
            }
            htmlParts.push(inlineMarkdown(escapeHtml(trimmed)));
        }

        closeParagraph();
        return htmlParts.join("\n");
    }

    /** Process inline markdown within a line of text (bold, code, links). */
    function inlineMarkdown(text: string): string {
        // Bold: **text** or __text__
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
        // Italic: *text* or _text_
        text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
        text = text.replace(/_(.+?)_/g, "<em>$1</em>");
        // Inline code: `code`
        text = text.replace(/`(.+?)`/g, "<code>$1</code>");
        // Links: [text](url)
        text = text.replace(
            /\[(.+?)\]\((.+?)\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>',
        );
        return text;
    }

    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ── File tree rendering helpers ────────────────────────────────────────
    function isSelected(entry: DocFileEntry): boolean {
        return entry.relativePath === selectedPath;
    }

    function isExpanded(entry: DocFileEntry): boolean {
        return expandedFolders.has(entry.relativePath);
    }

    function fileIcon(_entry: DocFileEntry): any {
        return Document;
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="board-docs">
    {#if loading}
        <div class="board-docs-loading">
            <span>{m.docs_loading()}</span>
        </div>
    {:else if !hasDocsDir && files.length === 0}
        <div class="board-docs-empty">
            <Notebook size={48} />
            <h2>{m.docs_empty_title()}</h2>
            <p>{m.docs_empty_description()}</p>
            {#if actionError}
                <p class="board-docs-error-msg">{actionError}</p>
            {/if}
            {#if creatingFile}
                <div class="board-docs-inline-create">
                    <Document size={16} />
                    <input
                        bind:this={newFileInputEl}
                        type="text"
                        class="board-docs-inline-input"
                        placeholder={m.docs_filename_placeholder()}
                        bind:value={newFileName}
                        onkeydown={handleNewFileKeydown}
                        onblur={confirmCreateFile}
                        aria-label={m.docs_new_file_name()}
                    />
                </div>
            {:else}
                <Button
                    kind="primary"
                    icon={DocumentAdd}
                    onclick={startCreateFile}
                >
                    {m.docs_new_note()}
                </Button>
            {/if}
        </div>
    {:else}
        <div class="board-docs-layout">
            <!-- ── File Tree Sidebar ─────────────────────────────────────── -->
            <aside class="board-docs-tree">
                <div class="board-docs-tree-header">
                    <span class="board-docs-tree-title">{m.board_tab_docs()}</span>
                    <div class="board-docs-tree-toolbar">
                        <button
                            class="board-docs-tree-toolbar-btn"
                            onclick={startCreateFolder}
                            aria-label={m.docs_create_new_folder()}
                            title={m.docs_new_folder()}
                        >
                            <FolderAdd size={14} />
                        </button>
                        <button
                            class="board-docs-tree-toolbar-btn"
                            onclick={startCreateFile}
                            aria-label={m.docs_create_new_note()}
                            title={m.docs_new_note()}
                        >
                            <DocumentAdd size={14} />
                        </button>
                    </div>
                </div>
                {#if actionError}
                    <div class="board-docs-error-bar">{actionError}</div>
                {/if}
                <nav class="board-docs-tree-list" aria-label={m.docs_document_files()}>
                    {#if creatingFile}
                        <div class="tree-create-input">
                            <Document size={14} />
                            <input
                                bind:this={newFileInputEl}
                                type="text"
                                class="tree-inline-input"
                                placeholder={m.docs_filename_placeholder()}
                                bind:value={newFileName}
                                onkeydown={handleNewFileKeydown}
                                onblur={confirmCreateFile}
                                aria-label={m.docs_new_file_name()}
                            />
                        </div>
                    {/if}
                    {#if creatingFolder}
                        <div class="tree-create-input">
                            <Folder size={14} />
                            <input
                                bind:this={newFolderInputEl}
                                type="text"
                                class="tree-inline-input"
                                placeholder={m.docs_folder_name_placeholder()}
                                bind:value={newFolderValue}
                                onkeydown={handleNewFolderKeydown}
                                onblur={confirmCreateFolder}
                                aria-label={m.docs_new_folder_name()}
                            />
                        </div>
                    {/if}
                    {#each files as entry (entry.relativePath)}
                        {#if entry.isDir}
                            <div class="tree-folder">
                                <button
                                    class="tree-folder-toggle"
                                    onclick={() =>
                                        toggleFolder(entry.relativePath)}
                                    aria-expanded={isExpanded(entry)}
                                >
                                    {#if isExpanded(entry)}
                                        <ChevronDown size={14} />
                                    {:else}
                                        <ChevronRight size={14} />
                                    {/if}
                                    <Folder size={14} />
                                    {#if renamingPath === entry.relativePath}
                                        <input
                                            bind:this={renameInputEl}
                                            type="text"
                                            class="tree-inline-input"
                                            bind:value={renameValue}
                                            onkeydown={handleRenameKeydown}
                                            onblur={confirmRename}
                                            onclick={(e) => e.stopPropagation()}
                                            aria-label={m.docs_rename_folder()}
                                        />
                                    {:else}
                                        <span>{entry.name}</span>
                                    {/if}
                                </button>
                                {#if isExpanded(entry)}
                                    <div class="tree-folder-children">
                                        {#each entry.children as child (child.relativePath)}
                                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                                            <div
                                                class="tree-file-row"
                                                class:tree-file-row--selected={isSelected(
                                                    child,
                                                )}
                                            >
                                                <button
                                                    class="tree-file"
                                                    onclick={() =>
                                                        selectFile(child)}
                                                >
                                                    <Document size={14} />
                                                    {#if renamingPath === child.relativePath}
                                                        <input
                                                            bind:this={
                                                                renameInputEl
                                                            }
                                                            type="text"
                                                            class="tree-inline-input"
                                                            bind:value={
                                                                renameValue
                                                            }
                                                            onkeydown={handleRenameKeydown}
                                                            onblur={confirmRename}
                                                            onclick={(e) =>
                                                                e.stopPropagation()}
                                                            aria-label={m.docs_rename_file()}
                                                        />
                                                    {:else}
                                                        <span>{child.name}</span
                                                        >
                                                    {/if}
                                                </button>
                                                <div class="tree-file-actions">
                                                    <button
                                                        class="tree-action-btn"
                                                        onclick={() =>
                                                            startRename(child)}
                                                        aria-label={m.docs_rename()}
                                                        title={m.docs_rename()}
                                                    >
                                                        <Edit size={12} />
                                                    </button>
                                                    <button
                                                        class="tree-action-btn tree-action-btn--delete"
                                                        onclick={() =>
                                                            confirmDelete(
                                                                child,
                                                            )}
                                                        disabled={deletingPath ===
                                                            child.relativePath}
                                                        aria-label={m.table_delete()}
                                                        title={m.table_delete()}
                                                    >
                                                        <TrashCan size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <div
                                class="tree-file-row"
                                class:tree-file-row--selected={isSelected(
                                    entry,
                                )}
                            >
                                <button
                                    class="tree-file"
                                    onclick={() => selectFile(entry)}
                                >
                                    <Document size={14} />
                                    {#if renamingPath === entry.relativePath}
                                        <input
                                            bind:this={renameInputEl}
                                            type="text"
                                            class="tree-inline-input"
                                            bind:value={renameValue}
                                            onkeydown={handleRenameKeydown}
                                            onblur={confirmRename}
                                            onclick={(e) => e.stopPropagation()}
                                            aria-label={m.docs_rename_file()}
                                        />
                                    {:else}
                                        <span>{entry.name}</span>
                                    {/if}
                                </button>
                                <div class="tree-file-actions">
                                    <button
                                        class="tree-action-btn"
                                        onclick={() => startRename(entry)}
                                        aria-label={m.docs_rename()}
                                        title={m.docs_rename()}
                                    >
                                        <Edit size={12} />
                                    </button>
                                    <button
                                        class="tree-action-btn tree-action-btn--delete"
                                        onclick={() => confirmDelete(entry)}
                                        disabled={deletingPath ===
                                            entry.relativePath}
                                        aria-label={m.table_delete()}
                                        title={m.table_delete()}
                                    >
                                        <TrashCan size={12} />
                                    </button>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </nav>
            </aside>

            <!-- ── Content Area ──────────────────────────────────────────── -->
            <main class="board-docs-content">
                {#if !selectedPath}
                    <div class="board-docs-content-empty">
                        <Notebook size={40} />
                        <p>{m.docs_select_file()}</p>
                    </div>
                {:else if fileContent === null}
                    <div class="board-docs-content-loading">
                        <span>{m.settings_loading()}</span>
                    </div>
                {:else if !editing}
                    <!-- ── Read-Only Preview ────────────────────────────── -->
                    <article class="board-docs-preview">
                        <div class="board-docs-preview-header">
                            <span class="board-docs-preview-filename"
                                >{selectedPath}</span
                            >
                            <button
                                class="board-docs-edit-btn"
                                onclick={enterEditMode}
                                aria-label={m.docs_edit_file()}
                                title={m.docs_edit_shortcut()}
                            >
                                <Edit size={14} />
                                <span>{m.docs_edit()}</span>
                            </button>
                        </div>
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="markdown-body"
                            onclick={(e) => {
                                // Open external links in new window
                                const target = e.target as HTMLElement;
                                if (
                                    target.tagName === "A" &&
                                    target.getAttribute("target") === "_blank"
                                ) {
                                    e.preventDefault();
                                    const href = target.getAttribute("href");
                                    if (href) {
                                        window.open(href, "_blank", "noopener");
                                    }
                                }
                            }}
                        >
                            {@html renderMarkdown(fileContent)}
                        </div>
                    </article>
                {:else}
                    <!-- ── Split-Pane Editor ────────────────────────────── -->
                    <article class="board-docs-editor">
                        <div class="board-docs-editor-header">
                            <span class="board-docs-editor-filename"
                                >{selectedPath}</span
                            >
                            <div class="board-docs-editor-actions">
                                {#if saving}
                                    <span class="board-docs-editor-saving"
                                        >{m.modal_board_saving()}</span
                                    >
                                {:else if savedIndicator}
                                    <span class="board-docs-editor-saved"
                                        >{m.docs_saved()}</span
                                    >
                                {/if}
                                <button
                                    class="board-docs-done-btn"
                                    onclick={exitEditMode}
                                    disabled={saving}
                                >
                                    {m.docs_done()}
                                </button>
                            </div>
                        </div>
                        <!-- ── Formatting toolbar ────────────────────────── -->
                        <div class="editor-toolbar">
                            {#each FORMAT_ACTIONS as fmt}
                                <button
                                    class="editor-toolbar-btn"
                                    onclick={fmt.action}
                                    title={fmt.title}
                                    aria-label={fmt.title}>{fmt.label}</button
                                >
                            {/each}
                        </div>
                        <div class="board-docs-editor-panes">
                            <div class="editor-textarea-wrap">
                                <!-- ── Slash command menu ────────────────── -->
                                {#if slashOpen}
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div
                                        bind:this={slashMenuEl}
                                        class="slash-menu"
                                        role="listbox"
                                        aria-label={m.docs_slash_commands()}
                                    >
                                        {#each slashFiltered as cmd, i (cmd.id)}
                                            <button
                                                class="slash-menu-item"
                                                class:slash-menu-item--active={i ===
                                                    slashIndex}
                                                role="option"
                                                aria-selected={i === slashIndex}
                                                onclick={() =>
                                                    applySlashCommand(cmd)}
                                                onmouseenter={() =>
                                                    (slashIndex = i)}
                                            >
                                                <span class="slash-menu-label"
                                                    >{cmd.label}</span
                                                >
                                                <span class="slash-menu-hint"
                                                    >/{cmd.match.split(
                                                        " ",
                                                    )[0]}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                                <textarea
                                    bind:this={editDraftEl}
                                    class="board-docs-editor-textarea"
                                    bind:value={draftContent}
                                    onkeydown={handleEditorKeydown}
                                    oninput={handleFormatInput}
                                    onblur={() => {
                                        if (editing) {
                                            void handleSave();
                                        }
                                    }}
                                    spellcheck="false"
                                    aria-label={m.docs_markdown_editor()}
                                ></textarea>
                            </div>
                            <div class="board-docs-editor-preview">
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="markdown-body"
                                    onclick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (
                                            target.tagName === "A" &&
                                            target.getAttribute("target") ===
                                                "_blank"
                                        ) {
                                            e.preventDefault();
                                            const href =
                                                target.getAttribute("href");
                                            if (href) {
                                                window.open(
                                                    href,
                                                    "_blank",
                                                    "noopener",
                                                );
                                            }
                                        }
                                    }}
                                >
                                    {@html renderMarkdown(draftContent)}
                                </div>
                            </div>
                        </div>
                    </article>
                {/if}
            </main>
        </div>
    {/if}
    <footer class="board-docs-debug">
        <code>docs: {docsDir(workspacePath, boardId)}</code>
        <code>ws: {workspacePath || "(empty)"}</code>
    </footer>
</div>

<style>
    .board-docs {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    /* ── Loading / Empty states ──────────────────────────────────────────── */
    .board-docs-loading,
    .board-docs-empty {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--cds-spacing-04, 0.75rem);
        color: var(--cds-text-02);
        text-align: center;
        padding: var(--cds-spacing-07, 2rem);
    }

    .board-docs-empty h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--cds-text-01);
    }

    .board-docs-empty p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--cds-text-02);
        max-width: 24rem;
        line-height: 1.5;
    }

    /* ── Inline create input (empty state) ───────────────────────────────── */
    .board-docs-inline-create {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4375rem 0.75rem;
        background: var(--cds-field-01, #f4f4f4);
        border: 1px solid var(--cds-interactive-01, #0f62fe);
        border-radius: 4px;
        width: 100%;
        max-width: 20rem;
        box-sizing: border-box;
    }

    :global(.t--dark) .board-docs-inline-create {
        background: var(--cds-field-01, #333);
    }

    .board-docs-inline-input {
        all: unset;
        flex: 1;
        min-width: 0;
        font-size: 0.875rem;
        font-family: inherit;
        color: var(--cds-text-01);
        line-height: 1.4;
    }

    .board-docs-inline-input::placeholder {
        color: var(--cds-text-03);
    }

    /* ── Error states ────────────────────────────────────────────────────── */
    .board-docs-error-msg {
        color: var(--cds-support-01, #da1e28) !important;
        font-size: 0.8125rem !important;
        background: color-mix(
            in srgb,
            var(--cds-support-01, #da1e28) 10%,
            transparent
        );
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        max-width: 28rem;
    }

    .board-docs-error-bar {
        margin: 0.25rem 0.5rem;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        color: var(--cds-support-01, #da1e28);
        background: color-mix(
            in srgb,
            var(--cds-support-01, #da1e28) 10%,
            transparent
        );
        border-radius: 3px;
        line-height: 1.4;
    }

    /* ── Layout: tree sidebar + content ──────────────────────────────────── */
    .board-docs-layout {
        display: flex;
        flex: 1;
        min-height: 0;
    }

    /* ── File Tree Sidebar ───────────────────────────────────────────────── */
    .board-docs-tree {
        width: 220px;
        flex-shrink: 0;
        border-right: 1px solid var(--cds-ui-03);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--cds-ui-01, #f4f4f4);
    }

    :global(.t--dark) .board-docs-tree {
        background: var(--cds-ui-01, #2c2c2c);
    }

    .board-docs-tree-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.625rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .board-docs-tree-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--cds-text-02);
    }

    .board-docs-tree-toolbar {
        display: flex;
        align-items: center;
        gap: 0.125rem;
    }

    .board-docs-tree-toolbar-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--cds-text-02);
        transition: background 0.12s ease;
    }

    .board-docs-tree-toolbar-btn:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    .board-docs-tree-toolbar-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .board-docs-tree-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.25rem 0;
    }

    /* ── Inline rename / create inputs ──────────────────────────────────── */
    .tree-inline-input {
        all: unset;
        flex: 1;
        min-width: 0;
        font-size: inherit;
        font-family: inherit;
        color: inherit;
        background: var(--cds-field-01, #f4f4f4);
        padding: 0.0625rem 0.25rem;
        border: 1px solid var(--cds-interactive-01, #0f62fe);
        border-radius: 2px;
        line-height: 1.4;
    }

    :global(.t--dark) .tree-inline-input {
        background: var(--cds-field-01, #333);
    }

    .tree-create-input {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.3125rem 0.625rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        line-height: 1.3;
    }

    /* ── Tree nodes ──────────────────────────────────────────────────────── */
    .tree-file-row {
        display: flex;
        align-items: center;
        transition: background 0.1s ease;
    }

    .tree-file-row:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    .tree-file-row--selected {
        background: var(--cds-selected-ui, #e0e0e0);
    }

    .tree-file-row--selected .tree-file span {
        font-weight: 500;
    }

    .tree-file,
    .tree-folder-toggle {
        all: unset;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex: 1;
        min-width: 0;
        padding: 0.3125rem 0.625rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        cursor: pointer;
        box-sizing: border-box;
        line-height: 1.3;
    }

    .tree-file:hover {
        background: transparent;
    }

    .tree-folder-toggle:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    .tree-folder-toggle {
        font-weight: 500;
    }

    .tree-folder-children {
        padding-left: 1.25rem;
    }

    .tree-file span,
    .tree-folder-toggle span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ── Tree item action buttons (rename, delete) ───────────────────────── */
    .tree-file-actions {
        display: none;
        align-items: center;
        gap: 0.125rem;
        padding-right: 0.25rem;
        flex-shrink: 0;
    }

    .tree-file-row:hover .tree-file-actions {
        display: flex;
    }

    .tree-action-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 3px;
        cursor: pointer;
        color: var(--cds-text-03);
        transition:
            color 0.1s ease,
            background 0.1s ease;
        flex-shrink: 0;
    }

    .tree-action-btn:hover {
        background: var(--cds-hover-ui, #d8d8d8);
        color: var(--cds-text-01);
    }

    .tree-action-btn--delete:hover {
        color: var(--cds-support-01, #da1e28);
    }

    .tree-action-btn:disabled {
        opacity: 0.3;
        cursor: default;
    }

    /* ── Content Area ────────────────────────────────────────────────────── */
    .board-docs-content {
        flex: 1;
        min-width: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .board-docs-content-empty,
    .board-docs-content-loading {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--cds-spacing-03, 0.5rem);
        color: var(--cds-text-02);
        font-size: 0.875rem;
        padding: var(--cds-spacing-07, 2rem);
    }

    .board-docs-preview,
    .board-docs-editor {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .board-docs-preview {
        padding: 0;
        max-width: 48rem;
    }

    /* ── Preview header ──────────────────────────────────────────────────── */
    .board-docs-preview-header,
    .board-docs-editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.4375rem 1.25rem;
        border-bottom: 1px solid var(--cds-ui-03);
        flex-shrink: 0;
    }

    .board-docs-preview-filename,
    .board-docs-editor-filename {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-02);
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .board-docs-edit-btn {
        all: unset;
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.12s ease;
    }

    .board-docs-edit-btn:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    /* ── Editor ──────────────────────────────────────────────────────────── */
    .board-docs-editor {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .board-docs-editor-panes {
        flex: 1;
        display: flex;
        flex-direction: row;
        min-height: 0;
    }

    /* ── Formatting toolbar ──────────────────────────────────────────────── */
    .editor-toolbar {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-01, #f4f4f4);
        flex-shrink: 0;
        flex-wrap: wrap;
    }

    :global(.t--dark) .editor-toolbar {
        background: var(--cds-ui-01, #2c2c2c);
    }

    .editor-toolbar-btn {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 26px;
        padding: 0 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--cds-text-02);
        cursor: pointer;
        border-radius: 3px;
        transition:
            background 0.1s ease,
            color 0.1s ease;
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
    }

    .editor-toolbar-btn:hover {
        background: var(--cds-hover-ui, #e8e8e8);
        color: var(--cds-text-01);
    }

    .editor-toolbar-btn:active {
        background: var(--cds-selected-ui, #d8d8d8);
    }

    /* ── Textarea wrapper (for slash menu positioning) ───────────────────── */
    .editor-textarea-wrap {
        flex: 1;
        display: flex;
        position: relative;
        min-height: 0;
    }

    .board-docs-editor-textarea {
        flex: 1;
        min-width: 0;
        min-height: 0;
        resize: none;
        border: none;
        outline: none;
        padding: 1rem;
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--cds-text-01);
        background: var(--cds-ui-background, #ffffff);
        border-right: 1px solid var(--cds-ui-03);
        tab-size: 2;
    }

    :global(.t--dark) .board-docs-editor-textarea {
        background: var(--cds-ui-background, #1a1a1a);
    }

    .board-docs-editor-textarea::placeholder {
        color: var(--cds-text-03);
    }

    /* ── Slash command menu ──────────────────────────────────────────────── */
    .slash-menu {
        position: absolute;
        top: 0.25rem;
        left: 0.5rem;
        z-index: 100;
        min-width: 180px;
        max-height: 240px;
        overflow-y: auto;
        background: var(--cds-ui-01, #f4f4f4);
        border: 1px solid var(--cds-ui-03);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 0.25rem;
    }

    :global(.t--dark) .slash-menu {
        background: var(--cds-ui-01, #2c2c2c);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .slash-menu-item {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.375rem 0.625rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        cursor: pointer;
        border-radius: 4px;
        box-sizing: border-box;
        transition: background 0.08s ease;
    }

    .slash-menu-item:hover,
    .slash-menu-item--active {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    .slash-menu-label {
        font-weight: 500;
    }

    .slash-menu-hint {
        font-size: 0.6875rem;
        color: var(--cds-text-03);
        font-family: "IBM Plex Mono", "SF Mono", monospace;
        margin-left: 1rem;
    }

    .board-docs-editor-preview {
        flex: 1;
        min-width: 0;
        overflow-y: auto;
        padding: 1rem 1.25rem;
    }

    .board-docs-editor-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .board-docs-editor-saving {
        font-size: 0.75rem;
        color: var(--cds-text-03);
        animation: docs-saving-pulse 1s ease-in-out infinite;
    }

    .board-docs-editor-saved {
        font-size: 0.75rem;
        color: var(--cds-support-02, #24a148);
        font-weight: 500;
        animation: docs-saved-fade 1.5s ease-out forwards;
    }

    @keyframes docs-saved-fade {
        0% {
            opacity: 1;
        }
        70% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }

    @keyframes docs-saving-pulse {
        0%,
        100% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
    }

    .board-docs-done-btn {
        all: unset;
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-04, #ffffff);
        background: var(--cds-interactive-01, #0f62fe);
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.12s ease;
    }

    .board-docs-done-btn:hover {
        background: var(--cds-hover-primary, #0353e9);
    }

    .board-docs-done-btn:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .board-docs-preview .markdown-body {
        padding: 1.25rem 1.5rem;
    }

    /* ── Markdown rendered body ──────────────────────────────────────────── */
    .markdown-body {
        font-size: 0.9375rem;
        line-height: 1.65;
        color: var(--cds-text-01);
        word-wrap: break-word;
    }

    .markdown-body :global(h1) {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.75rem 0;
        padding-bottom: 0.375rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .markdown-body :global(h2) {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 1.25rem 0 0.5rem 0;
    }

    .markdown-body :global(h3) {
        font-size: 1.0625rem;
        font-weight: 600;
        margin: 1rem 0 0.375rem 0;
    }

    .markdown-body :global(p) {
        margin: 0 0 0.625rem 0;
    }

    .markdown-body :global(li) {
        margin: 0.1875rem 0;
        padding-left: 0.375rem;
        list-style: disc;
        margin-left: 1.25rem;
        font-size: 0.9375rem;
    }

    .markdown-body :global(code) {
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
        background: var(--cds-ui-02, #f4f4f4);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
    }

    :global(.t--dark) .markdown-body :global(code) {
        background: var(--cds-ui-02, #393939);
    }

    .markdown-body :global(a) {
        color: var(--cds-link-01, #0f62fe);
        text-decoration: underline;
    }

    .markdown-body :global(hr) {
        border: none;
        border-top: 1px solid var(--cds-ui-03);
        margin: 1rem 0;
    }

    .markdown-body :global(strong) {
        font-weight: 600;
    }

    /* ── Debug footer ────────────────────────────────────────────────────── */
    .board-docs-debug {
        flex-shrink: 0;
        display: flex;
        gap: 1rem;
        padding: 0.25rem 0.625rem;
        font-size: 0.6875rem;
        color: var(--cds-text-03);
        background: var(--cds-ui-02, #f4f4f4);
        border-top: 1px solid var(--cds-ui-03);
        overflow: hidden;
    }

    :global(.t--dark) .board-docs-debug {
        background: var(--cds-ui-02, #393939);
    }

    .board-docs-debug code {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>

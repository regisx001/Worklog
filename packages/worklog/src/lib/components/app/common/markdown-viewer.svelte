<script lang="ts">
    import { marked } from "marked";
    import DOMPurify from "dompurify";
    import * as m from "$lib/paraglide/messages.js";

    export let content: string = "";

    // Reactive statement: Whenever `content` changes, re-parse and sanitize
    $: parsedHtml = content 
        ? DOMPurify.sanitize(marked.parse(content) as string) 
        : "";
</script>

<div class="markdown-body">
    {#if parsedHtml}
        {@html parsedHtml}
    {:else}
        <p class="markdown-empty">{m.markdown_no_description()}</p>
    {/if}
</div>

<style>
    .markdown-body {
        font-family: var(--font-body);
        font-size: 0.8125rem;
        line-height: 1.55;
        color: var(--cds-text-01);
        word-wrap: break-word;
    }

    .markdown-empty {
        color: var(--cds-text-helper);
        font-style: italic;
        margin: 0;
    }

    /* Headings */
    .markdown-body :global(h1),
    .markdown-body :global(h2),
    .markdown-body :global(h3),
    .markdown-body :global(h4),
    .markdown-body :global(h5),
    .markdown-body :global(h6) {
        margin-top: 1em;
        margin-bottom: 0.3em;
        font-weight: 600;
        line-height: 1.25;
        color: var(--cds-text-01);
    }

    .markdown-body :global(h1) { font-size: 1.25em; border-bottom: 1px solid var(--cds-ui-03); padding-bottom: 0.25em; }
    .markdown-body :global(h2) { font-size: 1.1em; border-bottom: 1px solid var(--cds-ui-03); padding-bottom: 0.2em; }
    .markdown-body :global(h3) { font-size: 1em; }
    .markdown-body :global(h4) { font-size: 0.9375em; }

    /* Paragraphs and general blocks */
    .markdown-body :global(p),
    .markdown-body :global(blockquote),
    .markdown-body :global(ul),
    .markdown-body :global(ol),
    .markdown-body :global(dl),
    .markdown-body :global(table),
    .markdown-body :global(pre),
    .markdown-body :global(details) {
        margin-top: 0;
        margin-bottom: 0.6em;
    }

    /* Lists */
    .markdown-body :global(ul),
    .markdown-body :global(ol) {
        padding-left: 1.5em;
    }

    .markdown-body :global(ul) { list-style-type: disc; }
    .markdown-body :global(ol) { list-style-type: decimal; }
    .markdown-body :global(li + li) { margin-top: 0.15em; }

    /* Blockquotes */
    .markdown-body :global(blockquote) {
        margin: 0 0 1em 0;
        padding: 0 1em;
        color: var(--cds-text-02);
        border-left: 0.25em solid var(--cds-ui-04);
    }

    /* Code blocks */
    .markdown-body :global(code) {
        font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 0.85em;
        padding: 0.2em 0.4em;
        margin: 0;
        background-color: var(--cds-ui-02);
        border-radius: 3px;
    }

    .markdown-body :global(pre) {
        padding: 1em;
        overflow: auto;
        font-size: 0.85em;
        line-height: 1.45;
        background-color: var(--cds-ui-02);
        border-radius: 4px;
    }

    .markdown-body :global(pre code) {
        padding: 0;
        margin: 0;
        font-size: 100%;
        background-color: transparent;
        border: 0;
    }

    /* Tables */
    .markdown-body :global(table) {
        border-spacing: 0;
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1em;
    }

    .markdown-body :global(table th),
    .markdown-body :global(table td) {
        padding: 0.5em 0.75em;
        border: 1px solid var(--cds-ui-04);
    }

    .markdown-body :global(table th) {
        font-weight: 600;
        background-color: var(--cds-ui-02);
    }

    /* Links */
    .markdown-body :global(a) {
        color: var(--cds-link-01);
        text-decoration: none;
    }

    .markdown-body :global(a:hover) {
        text-decoration: underline;
    }

    /* Horizontal Rules */
    .markdown-body :global(hr) {
        height: 1px;
        padding: 0;
        margin: 1.5em 0;
        background-color: var(--cds-ui-04);
        border: 0;
    }

    /* Images */
    .markdown-body :global(img) {
        max-width: 100%;
        box-sizing: content-box;
        background-color: var(--cds-ui-background);
    }
</style>

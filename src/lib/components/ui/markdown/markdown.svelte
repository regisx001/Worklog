<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		content = '',
		class: className
	}: {
		content: string;
		class?: string;
	} = $props();

	function parseMarkdown(md: string) {
		let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		html = html.replace(/^---$/gm, '<hr class="my-4 border-t border-border" />');

		html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-1">$1</h3>');
		html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
		html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-black mt-6 mb-3">$1</h1>');

		html = html.replace(
			/^(?:>|&gt;) (.*$)/gm,
			'<blockquote class="border-l-4 border-primary/30 pl-4 py-1 italic text-muted-foreground my-3">$1</blockquote>'
		);

		html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
		html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
		html = html.replace(/_(.*?)_/g, '<em>$1</em>');

		html = html.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" class="text-primary font-medium underline underline-offset-4 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">$1</a>'
		);

		html = html.replace(
			/`(.*?)`/g,
			'<code class="bg-muted px-1.5 py-0.5 rounded text-[0.85em] font-mono border border-border/50">$1</code>'
		);

		html = html.replace(/^[\*\+-] (.*$)/gm, '<li class="ml-4 list-disc pl-1">$1</li>');
		html = html.replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal pl-1">$1</li>');

		const lines = html.split('\n');
		let processed = [];
		let inList = false;

		for (let line of lines) {
			const l = line.trim();
			const isLi = l.startsWith('<li');

			if (isLi && !inList) {
				processed.push('<ul class="my-3 space-y-1">');
				inList = true;
			} else if (!isLi && inList) {
				processed.push('</ul>');
				inList = false;
			}

			if (
				l &&
				!l.startsWith('<h') &&
				!l.startsWith('<li') &&
				!l.startsWith('<hr') &&
				!l.startsWith('<blockquote') &&
				!l.startsWith('<ul') &&
				!l.startsWith('</ul')
			) {
				processed.push(`<p class="mb-3 last:mb-0">${line}</p>`);
			} else {
				processed.push(line);
			}
		}

		if (inList) processed.push('</ul>');

		return processed.join('\n').trim();
	}

	const rendered = $derived(parseMarkdown(content));
</script>

<div class={cn('text-base leading-relaxed', className)}>
	{@html rendered}
</div>

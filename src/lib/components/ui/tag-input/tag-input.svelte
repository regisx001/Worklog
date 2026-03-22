<script lang="ts">
	import { cn } from "$lib/utils";
	import * as Chip from "$lib/components/ui/chip";
	import { X } from "@lucide/svelte";

	let {
		tags = $bindable([]),
		placeholder = "Add tag...",
		disabled = false,
		maxTags,
		class: className,
		chipVariant = "secondary",
		validate,
		onadd,
		onremove,
	}: {
		tags: string[];
		placeholder?: string;
		disabled?: boolean;
		maxTags?: number;
		class?: string;
		chipVariant?: "default" | "secondary" | "outline" | "ghost";
		validate?: (tag: string) => boolean;
		onadd?: (tag: string) => void;
		onremove?: (tag: string) => void;
	} = $props();

	let inputValue = $state("");
	let inputRef: HTMLInputElement | undefined = $state();

	function addTag(text: string) {
		const trimmed = text.trim();

		if (!trimmed) return;
		if (tags.includes(trimmed)) return;
		if (maxTags && tags.length >= maxTags) return;
		if (validate && !validate(trimmed)) return;

		tags = [...tags, trimmed];
		inputValue = "";
		onadd?.(trimmed);
	}

	function removeTag(index: number) {
		const removed = tags[index];
		tags = tags.filter((_, i) => i !== index);
		onremove?.(removed);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag(inputValue);
		} else if (
			e.key === "Backspace" &&
			inputValue === "" &&
			tags.length > 0
		) {
			removeTag(tags.length - 1);
		}
	}

	function handleContainerClick() {
		inputRef?.focus();
	}
</script>

<div
	class={cn(
		"flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
		"focus-within:ring-1 focus-within:ring-ring/45 focus-within:ring-offset-0",
		disabled && "cursor-not-allowed opacity-50",
		className,
	)}
	onclick={handleContainerClick}
	role="textbox"
	tabindex="-1"
	onkeydown={() => {}}
>
	{#each tags as tag, i}
		<Chip.Root
			variant={chipVariant}
			size="sm"
			removable={!disabled}
			onremove={() => removeTag(i)}
			{disabled}
			class="animate-in zoom-in-50 fade-in-0 duration-200"
		>
			{tag}
		</Chip.Root>
	{/each}

	<input
		bind:this={inputRef}
		bind:value={inputValue}
		{disabled}
		{placeholder}
		onkeydown={handleKeydown}
		onblur={() => {}}
		class="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px]"
	/>
</div>

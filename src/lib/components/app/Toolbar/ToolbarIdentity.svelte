<script lang="ts">
    interface ToolbarIdentityProps {
        projectName: string;
    }

    let { projectName }: ToolbarIdentityProps = $props();
</script>

<div class="flex shrink-0 items-center gap-2 pr-2">
    <span
        class="font-display text-[11px] font-bold tracking-[0.09em] text-muted-foreground"
        >WORKLOG</span
    >
</div>

<div class="min-w-0 flex-1">
    <p
        class="truncate text-center font-display text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
    >
        {projectName || "Project"}
    </p>
</div>

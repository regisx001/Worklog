<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        SheetDescription,
        SheetHeader,
        SheetTitle,
    } from "$lib/components/ui/sheet/index.js";
    import type { Ticket } from "$lib/components/app/types.js";

    interface TicketDetailHeaderProps {
        ticket: Ticket;
    }

    let { ticket }: TicketDetailHeaderProps = $props();
</script>

<SheetHeader
    class="gap-1 border-b border-border/70 bg-surface-panel/80 px-4 py-3"
>
    <div class="flex items-center gap-2">
        <SheetTitle
            class="font-mono text-[12px] font-semibold tracking-[0.08em]"
            >{ticket.id}</SheetTitle
        >
        <Badge variant="outline" class="text-[10px] uppercase tracking-[0.08em]"
            >{ticket.labels[0] ?? "general"}</Badge
        >
    </div>
    <SheetDescription class="text-[12px] text-muted-foreground">
        Inline editing enabled. Save with Ctrl/Cmd+Enter.
    </SheetDescription>
</SheetHeader>

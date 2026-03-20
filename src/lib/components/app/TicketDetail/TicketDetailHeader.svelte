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

<SheetHeader class="gap-1 px-3 py-2.5">
    <div class="flex items-center gap-2">
        <SheetTitle class="text-xs font-semibold tracking-wide"
            >{ticket.id}</SheetTitle
        >
        <Badge variant="outline" class="text-[10px] uppercase"
            >{ticket.labels[0] ?? "general"}</Badge
        >
    </div>
    <SheetDescription class="text-[11px] text-muted-foreground">
        Inline editing enabled. Save with Ctrl/Cmd+Enter.
    </SheetDescription>
</SheetHeader>

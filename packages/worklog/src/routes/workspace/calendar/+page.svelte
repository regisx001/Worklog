<script lang="ts">
    import GlobalCalendarBoard from "$lib/components/app/calendar/global-calendar-board.svelte";
    import * as m from "$lib/paraglide/messages.js";
</script>

<svelte:head>
    <title>{m.sidebar_global_calendar()}</title>
</svelte:head>

<GlobalCalendarBoard />

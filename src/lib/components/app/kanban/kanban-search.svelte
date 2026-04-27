<script lang="ts">
    import {
        Modal,
        TextInput,
        TextArea,
        Select,
        SelectItem,
        MultiSelect,
        Button,
        InlineNotification,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        ToastNotification,
    } from "carbon-components-svelte";

    let searchQuery = $state("");
</script>

<Toolbar>
    <ToolbarContent>
        <ToolbarSearch
            value={searchQuery}
            oninput={(e: any) => (searchQuery = e.currentTarget.value)}
            placeholder="Search tickets…"
            persistent
        />
        <!-- <div class="toolbar-stats">
            <span class="stats-text">{doneCount} / {totalTickets} done</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {progress}%"></div>
            </div>
        </div> -->
    </ToolbarContent>
</Toolbar>

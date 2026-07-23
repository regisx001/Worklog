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
    import * as m from "$lib/paraglide/messages.js";

    let searchQuery = $state("");
</script>

<Toolbar>
    <ToolbarContent>
        <ToolbarSearch
            value={searchQuery}
            oninput={(e: any) => (searchQuery = e.currentTarget.value)}
            placeholder={m.board_search_placeholder()}
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

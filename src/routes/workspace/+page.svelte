<script>
    import {
        Column,
        Content,
        Grid,
        Header,
        HeaderAction,
        HeaderPanelDivider,
        HeaderPanelLink,
        HeaderPanelLinks,
        HeaderUtilities,
        Row,
        SkipToContent,
    } from "carbon-components-svelte";
    import AppToolbar from "$lib/components/app/layout/toolbar/app-toolbar.svelte";
</script>

<AppToolbar />

<Content>
    <Grid>
        <Row>
            <Column><h1>Welcome</h1></Column>
        </Row>
    </Grid>
</Content>

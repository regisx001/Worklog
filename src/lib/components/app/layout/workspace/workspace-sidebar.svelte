<script>
    import {
        SideNav,
        SideNavDivider,
        SideNavItems,
        SideNavLink,
        SideNavMenu,
        SideNavMenuItem,
        TileGroup,
        RadioTile,
    } from "carbon-components-svelte";
</script>

<!-- <TileGroup legendText="Service pricing tiers" name="plan" selected="standard">
    <RadioTile value="lite">Lite plan</RadioTile>
    <RadioTile value="standard">Standard plan</RadioTile>
    <RadioTile value="plus">Plus plan</RadioTile>
</TileGroup> -->

<SideNav>
    <SideNavItems>
        <SideNavLink text="Link 1" />
        <SideNavLink text="Link 2" />
        <SideNavLink text="Link 3" />
        <SideNavMenu text="Menu">
            <SideNavMenuItem href="/" text="Link 1" />
            <SideNavMenuItem href="/" text="Link 2" />
            <SideNavMenuItem href="/" text="Link 3" />
        </SideNavMenu>
        <SideNavDivider />
        <SideNavLink text="Link 4" />
    </SideNavItems>
</SideNav>

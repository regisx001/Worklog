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

<SideNav isOpen>
    <SideNavItems>
        <TileGroup
            legendText="Service pricing tiers"
            name="plan"
            selected="standard"
        >
            <RadioTile value="lite">Lite plan</RadioTile>
            <RadioTile value="standard">Standard plan</RadioTile>
            <RadioTile value="plsus">Plus plan</RadioTile>
            <RadioTile value="plucsxs">Plus plan</RadioTile>
            <RadioTile value="plucss">Plus plan</RadioTile>
            <RadioTile value="plussc">Plus plan</RadioTile>
            <RadioTile value="pluscssc">Plus plan</RadioTile>
        </TileGroup>

        <!-- <SideNavLink text="Link 1" />
        <SideNavLink text="Link 2" />
        <SideNavLink text="Link 3" />
        <SideNavMenu text="Menu">
            <SideNavMenuItem href="/" text="Link 1" />
            <SideNavMenuItem href="/" text="Link 2" />
            <SideNavMenuItem href="/" text="Link 3" />
        </SideNavMenu>
        <SideNavDivider />
        <SideNavLink text="Link 4" /> -->
    </SideNavItems>
</SideNav>

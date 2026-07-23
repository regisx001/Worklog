<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        getReactiveLocale,
        setReactiveLocale,
    } from "$lib/hooks/locale.svelte";
    import * as m from "$lib/paraglide/messages.js";
    import {
        Button,
        TextArea,
        TextInput,
        RadioButtonGroup,
        RadioButton,
        ButtonSet,
        Tabs,
        Tab,
        TabContent,
        Toggle,
        Select,
        SelectItem,
        PasswordInput,
        InlineLoading,
        Tag,
        ContentSwitcher,
        Switch,
        InlineNotification,
    } from "carbon-components-svelte";
    import { getWorkspace } from "$lib/hooks/workspace.svelte";
    import { getDb } from "$lib/db";
    import {
        exportDatabaseWithOptions,
        type ExportOptions,
    } from "$lib/db/export";
    import { importFromFile } from "$lib/db/mappers";
    import { notifications } from "$lib/hooks/notifications.svelte";
    import {
        checkForUpdate,
        RELEASES_URL,
        type UpdateState,
    } from "$lib/updater";
    import type { ExportFormat, ExportMode } from "$lib/db/mappers";
    import { getSyncConfig } from "$lib/sync/sync-config.svelte";
    import { SyncEngine } from "$lib/sync/sync-engine";
    import type { SyncStatus } from "$lib/sync/types";
    import { getAppZoom } from "$lib/hooks/app-zoom.svelte";
    import {
        useAppAppearance,
        type ThemeMode,
    } from "$lib/hooks/app-appearance.svelte";
    import ZoomControls from "$lib/components/app/layout/workspace/zoom-controls.svelte";
    import {
        Settings,
        View,
        DataBase,
        Cloud,
        Code,
        Search,
        ArrowLeft,
        Renew,
        MagicWand,
        ColorPalette,
        WarningAlt,
        Launch,
        TrashCan,
        Add,
        Checkmark,
        Close,
        CheckmarkOutline,
        Moon,
        Sun,
        Screen,
        Document,
        Table,
        Folder,
        Download,
        Upload,
    } from "carbon-icons-svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { seedDatabase, seedLazyLoadingTest } from "$lib/db/seed";
    import { EventRepo, type EventRecord } from "$lib/db";
    import { Time } from "carbon-icons-svelte";

    type SettingsCategory =
        | "general"
        | "appearance"
        | "customization"
        | "data"
        | "sync"
        | "debug"
        | "advanced";
    let activeCategory = $state<SettingsCategory>("general");

    const categories = [
        { id: "general", label: m.settings_category_general(), icon: Settings },
        {
            id: "appearance",
            label: m.settings_category_appearance(),
            icon: View,
        },
        {
            id: "customization",
            label: m.settings_category_customization(),
            icon: MagicWand,
        },
        { id: "data", label: m.settings_category_data(), icon: DataBase },
        { id: "sync", label: m.settings_category_sync(), icon: Cloud },
        { id: "debug", label: "Debug", icon: Code },
        {
            id: "advanced",
            label: m.settings_category_advanced(),
            icon: Settings,
        },
    ] as const;
    let searchQuery = $state("");

    const workspace = getWorkspace();
    const { ticketTypesApi } = getWorkspaceShellContext();
    const syncConfig = getSyncConfig();
    const appZoom = getAppZoom();
    const appAppearance = useAppAppearance();
    const languageOptions = [
        { label: "English", value: "en" },
        { label: "Français", value: "fr" },
        { label: "简体中文", value: "zh-CN" },
    ] as const;

    const workspaceName = $derived(workspace.meta?.name ?? m.settings_default_workspace());
    const workspacePath = $derived(workspace.path ?? m.settings_not_available());
    const workspaceStatus = $derived(workspace.status);
    const schemaVersion = $derived(workspace.meta?.schema_version ?? m.settings_unknown());
    const workspaceStatusLabel = $derived.by(() =>
        workspaceStatus === "ready" ? m.settings_workspace_status_ready() : workspaceStatus,
    );

    let exportFormat = $state<ExportFormat>("json");
    let exportMode = $state<ExportMode>("single-file");

    // ── Updater State ─────────────────────────────────────────────────────
    let updateState = $state<UpdateState>({
        status: "idle",
        info: null,
        progress: { downloaded: 0, contentLength: 0, percent: 0 },
        errorMessage: null,
    });

    // ── Customization State ───────────────────────────────────────────────
    let newTypeName = $state("");
    let newTypeColor = $state("#525252");
    let editingTypeId = $state<string | null>(null);
    let editingTypeName = $state("");
    let editingTypeColor = $state("");

    async function handleAddType() {
        if (!newTypeName.trim()) return;
        await ticketTypesApi.create({
            name: newTypeName.trim(),
            color: newTypeColor,
            is_default: ticketTypesApi.types.length === 0,
        });
        newTypeName = "";
    }

    async function handleUpdateType(id: string) {
        if (!editingTypeName.trim()) return;
        await ticketTypesApi.update(id, {
            name: editingTypeName.trim(),
            color: editingTypeColor,
        });
        editingTypeId = null;
    }

    async function handleDeleteType(id: string) {
        await ticketTypesApi.remove(id);
    }

    async function handleSetDefaultType(id: string) {
        await ticketTypesApi.update(id, { is_default: true });
    }

    // ── Sync state ─────────────────────────────────────────────────────────
    let syncRemoteUrl = $state("");
    let syncAccessToken = $state("");
    let syncBranch = $state("main");
    let syncGitName = $state("");
    let syncGitEmail = $state("");
    let syncAutoSync = $state(false);
    let syncAutoSyncInterval = $state(15);
    let syncLoading = $state(false);
    let syncLoadingMessage = $state("");
    let gitAvailable = $state<boolean | null>(null);

    // Load sync config on mount
    $effect(() => {
        if (workspace.status === "ready" && workspace.path) {
            void loadSyncConfig();
        }
    });

    async function loadSyncConfig() {
        if (!workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            await syncConfig.load(db);
            syncRemoteUrl = syncConfig.config.remote_url;
            syncAccessToken = syncConfig.config.access_token;
            syncBranch = syncConfig.config.branch;
            syncGitName = syncConfig.config.git_name;
            syncGitEmail = syncConfig.config.git_email;
            syncAutoSync = syncConfig.config.auto_sync;
            syncAutoSyncInterval = syncConfig.config.auto_sync_interval;

            // Check git availability
            const engine = new SyncEngine(workspace.path);
            gitAvailable = await engine.isGitAvailable();
        } catch (e) {
            console.error("Failed to load sync config", e);
        }
    }

    async function saveSyncConfig() {
        if (!workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            syncConfig.config = {
                remote_url: syncRemoteUrl,
                access_token: syncAccessToken,
                branch: syncBranch,
                git_name: syncGitName,
                git_email: syncGitEmail,
                auto_sync: syncAutoSync,
                auto_sync_interval: syncAutoSyncInterval,
                last_synced_at: syncConfig.config.last_synced_at,
            };
            await syncConfig.save(db);
            notifications.add({
                kind: "success",
                title: m.settings_sync_saved_title(),
                subtitle: m.settings_sync_saved_subtitle(),
                timeout: 3000,
            });
        } catch (error) {
            notifications.add({
                kind: "error",
                title: m.settings_save_failed(),
                subtitle: String(error),
                timeout: 5000,
            });
        }
    }

    async function handleSyncPush() {
        if (!workspace.path) return;
        syncLoading = true;
        syncLoadingMessage = m.settings_pushing_remote();
        syncConfig.setStatus("pushing");
        try {
            const db = await getDb(workspace.path);
            const engine = new SyncEngine(workspace.path);
            await engine.initialize(syncConfig.config);
            const result = await engine.push(db, syncConfig.config);

            if (result.status === "success") {
                syncConfig.updateLastSynced(result.timestamp);
                await syncConfig.save(db);
                notifications.add({
                    kind: "success",
                    title: m.sync_push_success(),
                    subtitle: result.message,
                    timeout: 3000,
                });
            } else {
                notifications.add({
                    kind: "error",
                    title: m.sync_push_failed(),
                    subtitle: result.message,
                    timeout: 5000,
                });
            }
            syncConfig.setStatus(
                result.status === "success" ? "idle" : "error",
            );
        } catch (error) {
            notifications.add({
                kind: "error",
                title: m.sync_push_failed(),
                subtitle: String(error),
                timeout: 5000,
            });
            syncConfig.setStatus("error");
        } finally {
            syncLoading = false;
            syncLoadingMessage = "";
        }
    }

    async function handleSyncPull() {
        if (!workspace.path) return;
        syncLoading = true;
        syncLoadingMessage = m.settings_pulling_remote();
        syncConfig.setStatus("pulling");
        try {
            const db = await getDb(workspace.path);
            const engine = new SyncEngine(workspace.path);
            await engine.initialize(syncConfig.config);
            const result = await engine.pull(db, syncConfig.config);

            if (result.status === "success") {
                syncConfig.updateLastSynced(result.timestamp);
                await syncConfig.save(db);
                notifications.add({
                    kind: "success",
                    title: m.sync_pull_success(),
                    subtitle: result.message,
                    timeout: 3000,
                });
                window.location.reload();
            } else if (result.status === "conflict") {
                notifications.add({
                    kind: "warning",
                    title: m.settings_merge_conflict(),
                    subtitle: result.message,
                    timeout: 8000,
                });
                syncConfig.setStatus("conflict");
            } else {
                notifications.add({
                    kind: "error",
                    title: m.sync_pull_failed(),
                    subtitle: result.message,
                    timeout: 5000,
                });
                syncConfig.setStatus("error");
            }
        } catch (error) {
            notifications.add({
                kind: "error",
                title: m.sync_pull_failed(),
                subtitle: String(error),
                timeout: 5000,
            });
            syncConfig.setStatus("error");
        } finally {
            syncLoading = false;
            syncLoadingMessage = "";
        }
    }

    // ── Navigation ─────────────────────────────────────────────────────────
    function goToBoards() {
        void goto("/workspace");
    }

    function refreshWorkspaceState() {
        void workspace.init();
    }

    // ── Export / Import ────────────────────────────────────────────────────
    async function handleExport() {
        if (workspace.status !== "ready" || !workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            const options: ExportOptions = {
                format: exportFormat,
                mode: exportMode,
            };
            const success = await exportDatabaseWithOptions(db, options);
            if (success) {
                notifications.add({
                    kind: "success",
                    title: m.settings_export_successful(),
                    subtitle: m.settings_export_success_msg({ format: exportFormat.toUpperCase(), mode: exportModeLabel() }),
                    timeout: 3000,
                });
            }
        } catch (error) {
            console.error(m.settings_export_failed_log(), error);
            notifications.add({
                kind: "error",
                title: m.settings_export_failed(),
                subtitle: String(error),
                timeout: 5000,
            });
        }
    }

    async function handleImport() {
        if (workspace.status !== "ready" || !workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            const result = await importFromFile(db, "merge");
            if (result) {
                notifications.add({
                    kind: "success",
                    title: m.settings_import_successful(),
                    subtitle: m.settings_import_success_msg({ boards: result.boardsCreated, tickets: result.ticketsCreated, updated: result.ticketsUpdated }),
                    timeout: 5000,
                });
                window.location.reload();
            }
        } catch (error) {
            console.error(m.settings_import_failed_log(), error);
            notifications.add({
                kind: "error",
                title: m.settings_import_failed(),
                subtitle: String(error),
                timeout: 5000,
            });
        }
    }

    async function handleCheckForUpdates() {
        await checkForUpdate((s) => {
            updateState = s;
        });
    }

    async function openReleasesPage() {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(RELEASES_URL);
    }

    function exportModeLabel(): string {
        return exportMode === "single-file"
            ? m.settings_export_mode_single_file()
            : m.settings_export_mode_folder();
    }

    function formatBytes(bytes: number): string {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }

    // ── Derived ────────────────────────────────────────────────────────────
    const syncConfigured = $derived(
        syncRemoteUrl.length > 0 && syncAccessToken.length > 0,
    );
    const syncStatusLabel = $derived.by(() => {
        const s = syncConfig.status;
        if (s === "not_configured") return m.settings_sync_status_not_configured();
        if (s === "idle") return m.settings_sync_status_ready();
        if (s === "pushing") return m.settings_sync_status_pushing();
        if (s === "pulling") return m.settings_sync_status_pulling();
        if (s === "conflict") return m.settings_sync_status_conflict();
        if (s === "error") return m.sync_error();
        return s;
    });
    const syncStatusColor = $derived.by(
        (): "green" | "red" | "blue" | "warm-gray" | "magenta" => {
            const s = syncConfig.status;
            if (s === "idle") return "green";
            if (s === "pushing" || s === "pulling") return "blue";
            if (s === "error") return "red";
            if (s === "conflict") return "magenta";
            return "warm-gray";
        },
    );

    async function handleSeedPerformance() {
        if (!workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            notifications.add({
                kind: "info",
                title: m.settings_seeding(),
                subtitle: m.settings_seeding_subtitle(),
                timeout: 3000,
            });
            await seedLazyLoadingTest(db);
            notifications.add({
                kind: "success",
                title: m.settings_seeding_complete(),
                subtitle: m.settings_seeding_complete_subtitle(),
                timeout: 5000,
            });
            void workspace.init(); // Refresh workspace state
        } catch (e) {
            notifications.add({
                kind: "error",
                title: m.settings_seeding_failed(),
                subtitle: String(e),
                timeout: 5000,
            });
        }
    }

    // ── Events Viewer State ───────────────────────────────────────────────
    let events = $state<EventRecord[]>([]);
    let eventsLoading = $state(false);
    let eventsError = $state<string | null>(null);
    let expandedEventId = $state<string | null>(null);

    async function loadEvents() {
        if (!workspace.path) return;
        eventsLoading = true;
        eventsError = null;
        try {
            const db = await getDb(workspace.path);
            events = await EventRepo.listEvents(db, { desc: true, limit: 200 });
        } catch (e) {
            eventsError = String(e);
            events = [];
        } finally {
            eventsLoading = false;
        }
    }

    function toggleEventPayload(eventId: string) {
        expandedEventId = expandedEventId === eventId ? null : eventId;
    }

    function formatPayload(payload: Record<string, unknown>): string {
        return JSON.stringify(payload, null, 2);
    }

    function formatTimestamp(ts: string): string {
        const d = new Date(ts);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    function truncateId(id: string): string {
        return id.length > 14 ? id.slice(0, 14) + "…" : id;
    }

    // ── Filter state for events ────────────────────────────────────────────
    let eventTypeFilter = $state<string>("all");

    const filteredEvents = $derived(
        eventTypeFilter === "all"
            ? events
            : events.filter((e) => e.event_type === eventTypeFilter),
    );

    // Derive unique event types for the filter dropdown
    const availableEventTypes = $derived<string[]>([
        "all",
        ...new Set(events.map((e) => e.event_type)),
    ]);

    // @ts-ignore
    const version = __APP_VERSION__;
    function matchesSearch(text: string) {
        if (!searchQuery) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    }
</script>

<div class="settings-layout">
    <!-- Sidebar -->
    <aside class="settings-sidebar">
        <header class="sidebar-header">
            <Button
                kind="ghost"
                iconDescription={m.board_back_to_workspace()}
                icon={ArrowLeft}
                onclick={goToBoards}
            />
            <span>{m.sidebar_settings()}</span>
        </header>

        <nav class="sidebar-nav">
            {#each categories as category}
                <button
                    class="nav-item"
                    class:active={activeCategory === category.id}
                    onclick={() => (activeCategory = category.id)}
                >
                    <category.icon size={20} />
                    <span>{category.label}</span>
                </button>
            {/each}
        </nav>

        <footer class="sidebar-footer">
            <div class="app-version">
                v{version}
            </div>
            <Button
                kind="ghost"
                size="small"
                icon={Renew}
                onclick={refreshWorkspaceState}
            >
                {m.settings_refresh()}
            </Button>
        </footer>
    </aside>

    <!-- Main Content -->
    <main class="settings-content">
        <header class="content-header">
            <div class="search-container">
                <Search size={16} />
                <input
                    type="text"
                    placeholder={m.settings_search_placeholder()}
                    bind:value={searchQuery}
                />
            </div>
            <div class="breadcrumbs">
                {m.sidebar_settings()} &gt; {categories.find((c) => c.id === activeCategory)
                    ?.label}
            </div>
        </header>

        <div class="content-body">
            <!-- ── General Category ────────────────────────────────────── -->
            {#if activeCategory === "general"}
                <div class="category-view">
                    {#if matchesSearch("Workspace Information Database schema version Worklog version")}
                        <section class="settings-section">
                            <h2>{m.settings_workspace_info()}</h2>
                            <div class="settings-card">
                                <div class="settings-grid">
                                    <TextInput
                                        id="workspace-name"
                                        labelText={m.settings_workspace_name()}
                                        value={workspaceName}
                                        readonly
                                    />
                                    <TextInput
                                        id="workspace-status"
                                        labelText={m.settings_workspace_status()}
                                        value={workspaceStatusLabel}
                                        readonly
                                    />
                                    <TextInput
                                        id="workspace-schema"
                                        labelText={m.settings_database_schema_version()}
                                        value={schemaVersion}
                                        readonly
                                    />
                                    <TextArea
                                        id="workspace-path"
                                        labelText={m.settings_workspace_path()}
                                        value={workspacePath}
                                        rows={3}
                                        readonly
                                    />
                                    <TextInput
                                        id="app-version"
                                        labelText={m.settings_worklog_version()}
                                        value={version}
                                        readonly
                                    />
                                </div>
                            </div>
                        </section>
                    {/if}

                    {#if matchesSearch("Updates Check for updates Application")}
                        <section class="settings-section">
                            <h2>{m.settings_app_updates()}</h2>
                            <p class="section-desc">
                                {m.settings_updates_desc()}
                            </p>

                            <div class="settings-card updater-card">
                                {#if updateState.status === "idle"}
                                    <!-- Idle: show check button -->
                                    <div class="updater-idle">
                                        <div class="updater-current">
                                            <span class="updater-label"
                                                >{m.settings_current_version()}</span
                                            >
                                            <span class="updater-version"
                                                >v{version}</span
                                            >
                                        </div>
                                        <Button
                                            kind="primary"
                                            icon={Renew}
                                            onclick={handleCheckForUpdates}
                                        >
                                            {m.settings_check_for_updates()}
                                        </Button>
                                    </div>
                                {:else if updateState.status === "checking"}
                                    <!-- Checking: spinner -->
                                    <div class="updater-status-row">
                                        <InlineLoading
                                            description={m.settings_checking_updates()}
                                        />
                                    </div>
                                {:else if updateState.status === "no-update"}
                                    <!-- No update: success state -->
                                    <div
                                        class="updater-status-row updater-success"
                                    >
                                        <CheckmarkOutline size={20} />
                                        <div class="updater-status-text">
                                            <strong>{m.settings_up_to_date()}</strong>
                                            <span
                                                >{m.settings_latest_version({ version })}</span
                                            >
                                        </div>
                                        <Button
                                            kind="ghost"
                                            size="small"
                                            icon={Renew}
                                            onclick={handleCheckForUpdates}
                                        >
                                            {m.settings_check_again()}
                                        </Button>
                                    </div>
                                {:else if updateState.status === "update-available"}
                                    <!-- Update available: show info + manual download button -->
                                    <div class="updater-available">
                                        <div class="updater-available-header">
                                            <div class="updater-version-badge">
                                                <Tag type="green" size="sm"
                                                    >{m.settings_new_version()}</Tag
                                                >
                                                <span
                                                    class="updater-new-version"
                                                    >v{updateState.info
                                                        ?.version}</span
                                                >
                                            </div>
                                            {#if updateState.info?.date}
                                                <span class="updater-date">
                                                    {new Date(
                                                        updateState.info.date,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        },
                                                    )}
                                                </span>
                                            {/if}
                                        </div>
                                        {#if updateState.info?.body}
                                            <div class="updater-notes">
                                                <span
                                                    class="updater-notes-label"
                                                    >{m.settings_release_notes()}</span
                                                >
                                                <p class="updater-notes-body">
                                                    {updateState.info.body}
                                                </p>
                                            </div>
                                        {/if}
                                        <div class="updater-actions">
                                            <Button
                                                kind="primary"
                                                icon={Launch}
                                                onclick={openReleasesPage}
                                            >
                                                {m.settings_go_to_download_page()}
                                            </Button>
                                            <Button
                                                kind="ghost"
                                                size="small"
                                                onclick={() => {
                                                    updateState = {
                                                        status: "idle",
                                                        info: null,
                                                        progress: {
                                                            downloaded: 0,
                                                            contentLength: 0,
                                                            percent: 0,
                                                        },
                                                        errorMessage: null,
                                                    };
                                                }}
                                            >
                                                {m.settings_dismiss()}
                                            </Button>
                                        </div>
                                    </div>
                                {:else if updateState.status === "install-failed"}
                                    <!-- Install failed: offer manual download -->
                                    <div class="updater-install-failed">
                                        <div
                                            class="updater-status-row updater-error"
                                        >
                                            <WarningAlt size={20} />
                                            <div class="updater-status-text">
                                                <strong
                                                    >{m.settings_auto_update_unavailable()}</strong
                                                >
                                                <span
                                                    >{updateState.errorMessage}</span
                                                >
                                            </div>
                                        </div>
                                        <div class="updater-actions">
                                            <Button
                                                kind="primary"
                                                icon={Launch}
                                                onclick={openReleasesPage}
                                            >
                                                {m.settings_download_manually()}
                                            </Button>
                                            <Button
                                                kind="ghost"
                                                size="small"
                                                onclick={() => {
                                                    updateState = {
                                                        status: "idle",
                                                        info: null,
                                                        progress: {
                                                            downloaded: 0,
                                                            contentLength: 0,
                                                            percent: 0,
                                                        },
                                                        errorMessage: null,
                                                    };
                                                }}
                                            >
                                                {m.settings_dismiss()}
                                            </Button>
                                        </div>
                                    </div>
                                {:else if updateState.status === "error"}
                                    <!-- Error state -->
                                    <div
                                        class="updater-status-row updater-error"
                                    >
                                        <WarningAlt size={20} />
                                        <div class="updater-status-text">
                                            <strong>{m.settings_update_failed()}</strong>
                                            <span
                                                >{updateState.errorMessage ??
                                                    m.settings_unknown_error()}</span
                                            >
                                        </div>
                                        <Button
                                            kind="ghost"
                                            size="small"
                                            icon={Renew}
                                            onclick={handleCheckForUpdates}
                                        >
                                            {m.settings_retry()}
                                        </Button>
                                    </div>
                                {/if}
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Appearance Category ────────────────────────────────── -->
            {#if activeCategory === "appearance"}
                <div class="category-view">
                    {#if matchesSearch("Language Locale English French Chinese Simplified Chinese 中文 简体中文")}
                        <section class="settings-section">
                            <h2>{m.settings_language()}</h2>
                            <p class="section-desc">
                                {m.settings_language_desc()}
                            </p>
                            <div class="settings-card">
                                <ContentSwitcher
                                    selectedIndex={Math.max(
                                        languageOptions.findIndex(
                                            (option) =>
                                                option.value ===
                                                getReactiveLocale(),
                                        ),
                                        0,
                                    )}
                                    on:change={(e) => {
                                        const index = e.detail;
                                        const newLang =
                                            languageOptions[index]?.value ??
                                            "en";
                                        setReactiveLocale(newLang);
                                        localStorage.setItem(
                                            "app_lang",
                                            newLang,
                                        );
                                    }}
                                >
                                    {#each languageOptions as option}
                                        <Switch text={option.label} />
                                    {/each}
                                </ContentSwitcher>
                            </div>
                        </section>
                    {/if}

                    {#if matchesSearch("Theme Dark Light System Mode")}
                        <section class="settings-section">
                            <h2>{m.settings_theme()}</h2>
                            <p class="section-desc">
                                {m.settings_theme_desc()}
                            </p>
                            <div class="settings-card">
                                <div class="theme-selector">
                                    <button
                                        class="theme-card"
                                        class:selected={appAppearance.theme ===
                                            "light"}
                                        onclick={() =>
                                            (appAppearance.theme = "light")}
                                    >
                                        <Sun size={24} />
                                        <span>{m.settings_theme_light()}</span>
                                    </button>
                                    <button
                                        class="theme-card"
                                        class:selected={appAppearance.theme ===
                                            "dark"}
                                        onclick={() =>
                                            (appAppearance.theme = "dark")}
                                    >
                                        <Moon size={24} />
                                        <span>{m.settings_theme_dark()}</span>
                                    </button>
                                    <button
                                        class="theme-card"
                                        class:selected={appAppearance.theme ===
                                            "system"}
                                        onclick={() =>
                                            (appAppearance.theme = "system")}
                                    >
                                        <Screen size={24} />
                                        <span>{m.settings_theme_system()}</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                    {/if}

                    {#if matchesSearch("Accent Color Customization Interactive")}
                        <section class="settings-section">
                            <h2>{m.settings_accent_color()}</h2>
                            <p class="section-desc">
                                {m.settings_accent_color_desc()}
                            </p>
                            <div class="settings-card">
                                <div class="accent-palette">
                                    {#each ["#0f62fe" /* Carbon Blue */, "#0072c3" /* Teal/Cyan */, "#198038" /* Green */, "#a56eff" /* Purple */, "#fa4d56" /* Red */, "#ff832b" /* Orange */, "#f1c21b" /* Yellow */] as color}
                                        <button
                                            class="color-swatch"
                                            class:selected={appAppearance.accent ===
                                                color}
                                            style="background-color: {color};"
                                            onclick={() =>
                                                (appAppearance.accent = color)}
                                            title={color}
                                        >
                                            {#if appAppearance.accent === color}
                                                <Checkmark
                                                    size={16}
                                                    class="color-swatch-check"
                                                />
                                            {/if}
                                        </button>
                                    {/each}
                                    <div class="color-swatch-custom">
                                        <input
                                            type="color"
                                            bind:value={appAppearance.accent}
                                            class="color-input-sm"
                                            title={m.settings_custom_color()}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    {/if}

                    {#if matchesSearch("Font Size Typography Scale")}
                        <section class="settings-section">
                            <h2>{m.settings_typography()}</h2>
                            <p class="section-desc">
                                {m.settings_typography_desc()}
                            </p>
                            <div class="settings-card">
                                <ContentSwitcher
                                    selectedIndex={appAppearance.fontSize ===
                                    "small"
                                        ? 0
                                        : appAppearance.fontSize === "large"
                                          ? 2
                                          : 1}
                                    on:change={(e) => {
                                        const index = e.detail;
                                        if (index === 0)
                                            appAppearance.fontSize = "small";
                                        else if (index === 2)
                                            appAppearance.fontSize = "large";
                                        else appAppearance.fontSize = "default";
                                    }}
                                >
                                    <Switch text={m.settings_font_small()} />
                                    <Switch text={m.settings_font_default()} />
                                    <Switch text={m.settings_font_large()} />
                                </ContentSwitcher>
                            </div>
                        </section>
                    {/if}

                    {#if matchesSearch("Application Zoom global scale")}
                        <section class="settings-section">
                            <div class="header-with-tag">
                                <h2>{m.settings_app_zoom()}</h2>
                                <Tag type="teal" size="sm">{m.settings_experimental()}</Tag>
                            </div>
                            <p class="section-desc">
                                {m.settings_app_zoom_desc_prefix()} <kbd>Ctrl</kbd> +
                                <kbd>+</kbd> {m.settings_app_zoom_desc_and()} <kbd>Ctrl</kbd> + <kbd>-</kbd>
                                {m.settings_app_zoom_desc_suffix()}
                            </p>
                            <div class="settings-card">
                                <div class="control-box">
                                    <ZoomControls />
                                </div>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Customization Category ──────────────────────────────── -->
            {#if activeCategory === "customization"}
                <div class="category-view">
                    {#if matchesSearch("Ticket Types Customization Colors Icons")}
                        <section class="settings-section">
                            <h2>{m.settings_ticket_types()}</h2>
                            <p class="section-desc">
                                {m.settings_ticket_types_desc()}
                            </p>
                            <div class="settings-card">
                                <div class="type-management-list">
                                    {#each ticketTypesApi.types as type}
                                        <div
                                            class="type-item"
                                            class:is-default={type.is_default}
                                        >
                                            {#if editingTypeId === type.id}
                                                <div class="type-edit-form">
                                                    <TextInput
                                                        size="sm"
                                                        bind:value={
                                                            editingTypeName
                                                        }
                                                    />
                                                    <input
                                                        type="color"
                                                        bind:value={
                                                            editingTypeColor
                                                        }
                                                        class="color-input-sm"
                                                    />
                                                    <Button
                                                        size="small"
                                                        kind="ghost"
                                                        icon={Checkmark}
                                                        iconDescription={m.modal_save_changes()}
                                                        onclick={() =>
                                                            handleUpdateType(
                                                                type.id,
                                                            )}
                                                    />
                                                    <Button
                                                        size="small"
                                                        kind="ghost"
                                                        icon={Close}
                                                        iconDescription={m.modal_cancel()}
                                                        onclick={() =>
                                                            (editingTypeId =
                                                                null)}
                                                    />
                                                </div>
                                            {:else}
                                                <div class="type-display">
                                                    <div
                                                        class="type-color-dot"
                                                        style="background-color: {type.color}"
                                                    ></div>
                                                    <span class="type-name"
                                                        >{type.name}</span
                                                    >
                                                    {#if type.is_default}
                                                        <Tag
                                                            size="sm"
                                                            type="blue"
                                                            >{m.settings_default()}</Tag
                                                        >
                                                    {/if}
                                                </div>
                                                <div class="type-actions">
                                                    {#if !type.is_default}
                                                        <Button
                                                            size="small"
                                                            kind="ghost"
                                                            onclick={() =>
                                                                handleSetDefaultType(
                                                                    type.id,
                                                                )}
                                                        >
                                                            {m.settings_set_default()}
                                                        </Button>
                                                    {/if}
                                                    <Button
                                                        size="small"
                                                        kind="ghost"
                                                        icon={Code}
                                                        iconDescription={m.ticket_ctx_edit()}
                                                        onclick={() => {
                                                            editingTypeId =
                                                                type.id;
                                                            editingTypeName =
                                                                type.name;
                                                            editingTypeColor =
                                                                type.color;
                                                        }}
                                                    />
                                                    <Button
                                                        size="small"
                                                        kind="ghost"
                                                        icon={TrashCan}
                                                        iconDescription={m.table_delete()}
                                                        onclick={() =>
                                                            handleDeleteType(
                                                                type.id,
                                                            )}
                                                    />
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>

                                <div class="add-type-form">
                                    <h3>{m.settings_add_new_type()}</h3>
                                    <div class="add-type-inputs">
                                        <TextInput
                                            labelText={m.modal_board_name()}
                                            placeholder={m.settings_ticket_type_name_placeholder()}
                                            bind:value={newTypeName}
                                        />
                                        <div class="color-picker-group">
                                            <label for="new-type-color"
                                                >{m.settings_color()}</label
                                            >
                                            <input
                                                id="new-type-color"
                                                type="color"
                                                bind:value={newTypeColor}
                                            />
                                        </div>
                                        <Button
                                            kind="secondary"
                                            icon={Add}
                                            onclick={handleAddType}
                                        >
                                            {m.settings_add_type()}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Data Category ──────────────────────────────────────── -->
            {#if activeCategory === "data"}
                <div class="category-view">
                    {#if matchesSearch("Export Import Data Management JSON CSV")}
                        <section class="settings-section">
                            <h2>{m.settings_export_data()}</h2>
                            <p class="section-desc">
                                {m.settings_export_desc()}
                            </p>

                            <div class="settings-card">
                                <h3>{m.settings_export_format()}</h3>
                                <div class="theme-selector">
                                    <button
                                        class="export-card"
                                        class:selected={exportFormat === "json"}
                                        onclick={() => (exportFormat = "json")}
                                    >
                                        <Document size={24} />
                                        <div class="export-card-text">
                                            <span>JSON</span>
                                            <small
                                                >{m.settings_export_json_desc()}</small
                                            >
                                        </div>
                                    </button>
                                    <button
                                        class="export-card"
                                        class:selected={exportFormat === "csv"}
                                        onclick={() => (exportFormat = "csv")}
                                    >
                                        <Table size={24} />
                                        <div class="export-card-text">
                                            <span>CSV</span>
                                            <small
                                                >{m.settings_export_csv_desc()}</small
                                            >
                                        </div>
                                    </button>
                                </div>

                                <h3>{m.settings_export_mode()}</h3>
                                <div class="theme-selector">
                                    <button
                                        class="export-card"
                                        class:selected={exportMode ===
                                            "single-file"}
                                        onclick={() =>
                                            (exportMode = "single-file")}
                                    >
                                        <Document size={24} />
                                        <div class="export-card-text">
                                            <span>{m.settings_export_mode_single_file()}</span>
                                            <small
                                                >{m.settings_export_single_file_desc()}</small
                                            >
                                        </div>
                                    </button>
                                    <button
                                        class="export-card"
                                        class:selected={exportMode === "folder"}
                                        onclick={() => (exportMode = "folder")}
                                    >
                                        <Folder size={24} />
                                        <div class="export-card-text">
                                            <span>{m.settings_export_mode_folder()}</span>
                                            <small
                                                >{m.settings_export_folder_desc()}</small
                                            >
                                        </div>
                                    </button>
                                </div>

                                <div class="export-preview">
                                    <strong>{m.settings_export_preview_heading()}</strong>
                                    {exportFormat.toUpperCase()} &middot; {exportMode ===
                                    "single-file"
                                        ? m.settings_export_mode_single_file()
                                        : m.settings_export_mode_folder()}<br />
                                    <span class="preview-muted">
                                        {#if exportMode === "single-file"}
                                            {m.settings_export_single_file_preview({ format: exportFormat })}
                                        {:else}
                                            {m.settings_export_folder_preview({ format: exportFormat })}
                                        {/if}
                                    </span>
                                </div>

                                <Button
                                    kind="primary"
                                    icon={Download}
                                    onclick={handleExport}
                                >
                                    {m.settings_export_data_button()}
                                </Button>
                            </div>
                        </section>

                        <section class="settings-section">
                            <h2>{m.settings_import_data()}</h2>
                            <p class="section-desc">
                                {m.settings_import_desc()}
                            </p>
                            <div class="settings-card">
                                <InlineNotification
                                    kind="warning"
                                    title={m.settings_warning()}
                                    subtitle={m.settings_import_warning()}
                                    hideCloseButton
                                />
                                <Button
                                    kind="danger-tertiary"
                                    icon={Upload}
                                    onclick={handleImport}
                                >
                                    {m.settings_import_data_button()}
                                </Button>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Sync Category ──────────────────────────────────────── -->
            {#if activeCategory === "sync"}
                <div class="category-view">
                    {#if matchesSearch("Git Synchronization Personal Access Token GitHub Auto-sync")}
                        <section class="settings-section">
                            <div class="header-with-status">
                                <div class="header-with-tag">
                                    <h2>{m.settings_git_sync()}</h2>
                                    <Tag type="teal" size="sm">{m.settings_experimental()}</Tag
                                    >
                                </div>
                                <Tag type={syncStatusColor} size="sm"
                                    >{syncStatusLabel}</Tag
                                >
                            </div>
                            <p class="section-desc">
                                {m.settings_git_sync_desc()}
                            </p>
                            <div class="settings-card">
                                {#if gitAvailable === false}
                                    <aside class="git-warning" role="alert">
                                        <strong>{m.settings_git_not_found()}</strong>
                                        <span>
                                            {m.settings_git_not_found_desc_prefix()} <code>git</code> {m.settings_git_not_found_desc_suffix()}
                                        </span>
                                    </aside>
                                {/if}

                                <div class="sync-form">
                                    <TextInput
                                        id="sync-remote-url"
                                        labelText={m.settings_remote_url()}
                                        placeholder="https://github.com/user/repo.git"
                                        bind:value={syncRemoteUrl}
                                        disabled={gitAvailable === false}
                                    />

                                    <PasswordInput
                                        id="sync-access-token"
                                        labelText={m.settings_access_token()}
                                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                        bind:value={syncAccessToken}
                                        disabled={gitAvailable === false}
                                    />

                                    <div class="settings-grid">
                                        <TextInput
                                            id="sync-branch"
                                            labelText={m.settings_branch()}
                                            placeholder="main"
                                            bind:value={syncBranch}
                                            disabled={gitAvailable === false}
                                        />

                                        <TextInput
                                            id="sync-git-name"
                                            labelText={m.settings_git_name()}
                                            placeholder={m.settings_git_name_placeholder()}
                                            bind:value={syncGitName}
                                            disabled={gitAvailable === false}
                                        />

                                        <TextInput
                                            id="sync-git-email"
                                            labelText={m.settings_git_email()}
                                            placeholder="user@example.com"
                                            bind:value={syncGitEmail}
                                            disabled={gitAvailable === false}
                                        />
                                    </div>

                                    <div class="sync-options">
                                        <Toggle
                                            id="sync-auto-sync"
                                            labelText={m.settings_auto_sync()}
                                            labelA={m.settings_off()}
                                            labelB={m.settings_on()}
                                            bind:toggled={syncAutoSync}
                                            disabled={gitAvailable === false}
                                        />

                                        {#if syncAutoSync}
                                            <Select
                                                id="sync-auto-sync-interval"
                                                labelText={m.settings_sync_interval()}
                                                bind:selected={
                                                    syncAutoSyncInterval
                                                }
                                                disabled={gitAvailable ===
                                                    false}
                                            >
                                                <SelectItem
                                                    value={1}
                                                    text={m.settings_every_1_minute()}
                                                />
                                                <SelectItem
                                                    value={5}
                                                    text={m.settings_every_5_minutes()}
                                                />
                                                <SelectItem
                                                    value={15}
                                                    text={m.settings_every_15_minutes()}
                                                />
                                                <SelectItem
                                                    value={30}
                                                    text={m.settings_every_30_minutes()}
                                                />
                                                <SelectItem
                                                    value={60}
                                                    text={m.settings_every_1_hour()}
                                                />
                                                <SelectItem
                                                    value={120}
                                                    text={m.settings_every_2_hours()}
                                                />
                                                <SelectItem
                                                    value={360}
                                                    text={m.settings_every_6_hours()}
                                                />
                                            </Select>
                                        {/if}
                                    </div>

                                    {#if syncConfig.config.last_synced_at}
                                        <TextInput
                                            id="sync-last-synced"
                                            labelText={m.settings_last_synced()}
                                            value={new Date(
                                                syncConfig.config.last_synced_at,
                                            ).toLocaleString()}
                                            readonly
                                        />
                                    {/if}
                                </div>

                                <div class="actions-group">
                                    <Button
                                        kind="primary"
                                        onclick={saveSyncConfig}
                                        disabled={gitAvailable === false}
                                    >
                                        {m.settings_save_configuration()}
                                    </Button>

                                    {#if syncConfigured && gitAvailable !== false}
                                        <div class="manual-actions">
                                            <h3>{m.settings_manual_actions()}</h3>
                                            {#if syncLoading}
                                                <InlineLoading
                                                    description={syncLoadingMessage}
                                                />
                                            {:else}
                                                <ButtonSet>
                                                    <Button
                                                        kind="tertiary"
                                                        onclick={handleSyncPush}
                                                    >
                                                        {m.settings_push()}
                                                    </Button>
                                                    <Button
                                                        kind="tertiary"
                                                        onclick={handleSyncPull}
                                                    >
                                                        {m.settings_pull()}
                                                    </Button>
                                                </ButtonSet>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Debug Category ────────────────────────────────────── -->
            {#if activeCategory === "debug"}
                <div class="category-view">
                    {#if matchesSearch("Performance Testing Seeding Lazy Loading")}
                        <section class="settings-section">
                            <div class="header-with-tag">
                                <h2>{m.settings_performance_testing()}</h2>
                                <Tag type="magenta" size="sm">{m.settings_debug_only()}</Tag>
                            </div>
                            <p class="section-desc">
                                {m.settings_performance_desc()}
                            </p>
                            <div class="settings-card">
                                <div class="debug-card">
                                    <h3>{m.settings_seed_large_board()}</h3>
                                    <p>
                                        {m.settings_seed_large_board_desc()}
                                    </p>
                                    <div class="debug-actions">
                                        <Button
                                            kind="tertiary"
                                            icon={MagicWand}
                                            onclick={handleSeedPerformance}
                                        >
                                            {m.settings_seed_200_tickets()}
                                        </Button>
                                    </div>
                                </div>

                                <div
                                    class="debug-card"
                                    style="margin-top: 1.5rem;"
                                >
                                    <h3>{m.settings_verify_lazy_loading()}</h3>
                                    <ul class="debug-guide">
                                        <li>
                                            <strong>{m.settings_infinite_scroll()}</strong> {m.settings_infinite_scroll_desc()}
                                        </li>
                                        <li>
                                            <strong>{m.settings_deferred_rendering()}</strong>
                                            {m.settings_deferred_rendering_desc()}
                                        </li>
                                        <li>
                                            <strong>{m.settings_network_db_activity()}</strong>
                                            {m.settings_network_db_activity_desc()}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    {/if}

                    {#if matchesSearch("Events Audit Log Viewer")}
                        <section class="settings-section">
                            <div class="header-with-tag">
                                <h2>{m.settings_events_log()}</h2>
                                <Tag type="magenta" size="sm">{m.settings_debug_only()}</Tag>
                            </div>
                            <p class="section-desc">
                                {m.settings_events_log_desc()}
                            </p>
                            <div class="settings-card">
                                <div class="debug-card">
                                    <div class="debug-actions">
                                        <Button
                                            kind="tertiary"
                                            icon={Time}
                                            onclick={loadEvents}
                                            disabled={eventsLoading}
                                        >
                                            {eventsLoading
                                                ? m.settings_loading()
                                                : m.settings_load_events()}
                                        </Button>
                                        {#if events.length > 0}
                                            <span
                                                style="margin-left: 0.75rem; font-size: 0.875rem; color: var(--cds-text-secondary); align-self: center;"
                                            >
                                                {m.settings_event_count({ count: events.length })}
                                            </span>
                                        {/if}
                                    </div>

                                    {#if eventsError}
                                        <InlineNotification
                                            kind="error"
                                            title={m.settings_failed_load_events()}
                                            subtitle={eventsError}
                                            hideCloseButton
                                        />
                                    {/if}

                                    {#if events.length > 0}
                                        <!-- Filter -->
                                        <div
                                            style="display: flex; gap: 0.5rem; align-items: center; margin-top: 1rem;"
                                        >
                                            <label
                                                for="event-type-filter"
                                                style="font-size: 0.875rem; color: var(--cds-text-secondary);"
                                            >
                                                {m.settings_filter()}
                                            </label>
                                            <select
                                                id="event-type-filter"
                                                bind:value={eventTypeFilter}
                                                style="padding: 0.25rem 0.5rem; border: 1px solid var(--cds-ui-03); border-radius: 4px; background: var(--cds-field-01); color: var(--cds-text-primary); font-size: 0.875rem;"
                                            >
                                                {#each availableEventTypes as type}
                                                    <option value={type}>
                                                        {type === "all"
                                                            ? m.settings_all_types()
                                                            : type.replace(
                                                                  "_",
                                                                  " ",
                                                              )}
                                                    </option>
                                                {/each}
                                            </select>
                                        </div>

                                        <!-- Events Table -->
                                        <div
                                            style="margin-top: 0.75rem; overflow-x: auto; border: 1px solid var(--cds-ui-03); border-radius: 4px;"
                                        >
                                            <table
                                                style="width: 100%; border-collapse: collapse; font-size: 0.8125rem;"
                                            >
                                                <thead>
                                                    <tr
                                                        style="background: var(--cds-ui-01);"
                                                    >
                                                        <th
                                                            style="padding: 0.5rem; text-align: left; color: var(--cds-text-secondary); font-weight: 600; white-space: nowrap;"
                                                        >
                                                            {m.settings_table_type()}
                                                        </th>
                                                        <th
                                                            style="padding: 0.5rem; text-align: left; color: var(--cds-text-secondary); font-weight: 600; white-space: nowrap;"
                                                        >
                                                            {m.settings_entity()}
                                                        </th>
                                                        <th
                                                            style="padding: 0.5rem; text-align: left; color: var(--cds-text-secondary); font-weight: 600; white-space: nowrap;"
                                                        >
                                                            {m.settings_actor()}
                                                        </th>
                                                        <th
                                                            style="padding: 0.5rem; text-align: left; color: var(--cds-text-secondary); font-weight: 600; white-space: nowrap;"
                                                        >
                                                            {m.table_created()}
                                                        </th>
                                                        <th
                                                            style="padding: 0.5rem; text-align: left; color: var(--cds-text-secondary); font-weight: 600; white-space: nowrap;"
                                                        >
                                                            {m.settings_payload()}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {#each filteredEvents as event (event.id)}
                                                        <tr
                                                            style="border-top: 1px solid var(--cds-ui-03);"
                                                            class:expanded={expandedEventId ===
                                                                event.id}
                                                        >
                                                            <td
                                                                style="padding: 0.5rem; white-space: nowrap;"
                                                            >
                                                                <Tag
                                                                    type="cool-gray"
                                                                    size="sm"
                                                                >
                                                                    {event.event_type.replace(
                                                                        /_/g,
                                                                        " ",
                                                                    )}
                                                                </Tag>
                                                            </td>
                                                            <td
                                                                style="padding: 0.5rem; white-space: nowrap; color: var(--cds-text-primary); font-family: monospace; font-size: 0.75rem;"
                                                            >
                                                                {event.entity_type}/{truncateId(
                                                                    event.entity_id,
                                                                )}
                                                            </td>
                                                            <td
                                                                style="padding: 0.5rem; white-space: nowrap; color: var(--cds-text-primary);"
                                                            >
                                                                {event.actor ||
                                                                    "—"}
                                                            </td>
                                                            <td
                                                                style="padding: 0.5rem; white-space: nowrap; color: var(--cds-text-secondary); font-size: 0.75rem;"
                                                            >
                                                                {formatTimestamp(
                                                                    event.created_at,
                                                                )}
                                                            </td>
                                                            <td
                                                                style="padding: 0.5rem;"
                                                            >
                                                                <Button
                                                                    kind="ghost"
                                                                    size="small"
                                                                    onclick={() =>
                                                                        toggleEventPayload(
                                                                            event.id,
                                                                        )}
                                                                >
                                                                    {expandedEventId ===
                                                                    event.id
                                                                        ? m.settings_hide()
                                                                        : m.settings_show()}
                                                                    JSON
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        {#if expandedEventId === event.id}
                                                            <tr>
                                                                <td
                                                                    colspan="5"
                                                                    style="padding: 0 0.5rem 0.5rem 0.5rem;"
                                                                >
                                                                    <pre
                                                                        style="background: var(--cds-ui-01); border: 1px solid var(--cds-ui-03); border-radius: 4px; padding: 0.75rem; font-size: 0.75rem; line-height: 1.4; overflow-x: auto; white-space: pre-wrap; color: var(--cds-text-primary); max-height: 300px; overflow-y: auto;"><code
                                                                            >${formatPayload(
                                                                                event.payload,
                                                                            )}</code
                                                                        ></pre>
                                                                </td>
                                                            </tr>
                                                        {/if}
                                                    {/each}
                                                </tbody>
                                            </table>
                                        </div>
                                    {:else if !eventsLoading}
                                        <p
                                            style="margin-top: 1rem; font-size: 0.875rem; color: var(--cds-text-secondary);"
                                        >
                                            {m.settings_load_events_hint()}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Advanced Category ──────────────────────────────────── -->
            {#if activeCategory === "advanced"}
                <div class="category-view">
                    {#if matchesSearch("Developer Tools Experimental Advanced Diagnostics")}
                        <section class="settings-section">
                            <h2>{m.settings_developer_tools()}</h2>
                            <p class="section-desc">
                                {m.settings_developer_tools_desc()}
                            </p>
                            <div class="settings-card">
                                <div class="advanced-grid">
                                    <Button
                                        kind="ghost"
                                        onclick={refreshWorkspaceState}
                                    >
                                        {m.settings_force_state_reinit()}
                                    </Button>
                                    <p class="help-text">
                                        {m.settings_force_state_reinit_desc()}
                                    </p>
                                </div>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}
        </div>
    </main>
</div>

<style>
    .settings-layout {
        height: 100vh;
        display: flex;
        overflow: hidden;
        background: var(--cds-ui-01);
    }

    /* ── Sidebar ───────────────────────────────────────────────────────── */
    .settings-sidebar {
        width: 260px;
        flex-shrink: 0;
        /* background: var(--cds-ui-02); */
        border-right: 1px solid var(--cds-ui-03);
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        height: 48px;
        display: flex;
        align-items: center;
        padding-left: 0.5rem;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .sidebar-nav {
        flex: 1;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: var(--cds-text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.1s ease;
        text-align: left;
    }

    .nav-item:hover {
        background: var(--cds-ui-03);
        color: var(--cds-text-primary);
    }

    .nav-item.active {
        background: color-mix(
            in srgb,
            var(--cds-interactive-01) 10%,
            transparent
        );
        color: var(--cds-interactive-01);
        font-weight: 600;
        border-radius: 0 4px 4px 0;
        position: relative;
    }

    .nav-item.active::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--cds-interactive-01);
        border-radius: 0 2px 2px 0;
    }

    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid var(--cds-ui-03);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .app-version {
        font-size: 0.75rem;
        color: var(--cds-text-helper);
        font-family: var(--cds-code-01-font-family);
    }

    /* ── Main Content ──────────────────────────────────────────────────── */
    .settings-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .content-header {
        padding: 1.5rem 2rem;
        background: var(--cds-ui-01);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .search-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--cds-field-01);
        border: 1px solid var(--cds-ui-03);
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        max-width: 600px;
    }

    .search-container input {
        border: none;
        background: transparent;
        color: var(--cds-text-primary);
        font-size: 0.875rem;
        flex: 1;
        outline: none;
    }

    .breadcrumbs {
        display: inline-flex;
        align-items: center;
        background: var(--cds-ui-02);
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        color: var(--cds-text-secondary);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        width: fit-content;
    }

    .content-body {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
    }

    .category-view {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 3rem;
    }

    .settings-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .settings-section h2 {
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--cds-text-primary);
        margin: 0;
    }

    .settings-section h3 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
    }

    .settings-card {
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }

    .section-desc {
        font-size: 0.875rem;
        color: var(--cds-text-secondary);
        margin: -0.75rem 0 0.5rem 0;
        max-width: 600px;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .control-box {
        background: var(--cds-ui-02);
        padding: 1.5rem;
        border-radius: 4px;
        border: 1px solid var(--cds-ui-03);
    }

    /* ── Appearance Styles ────────────────────────────────────────────────── */
    .theme-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }

    .theme-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.5rem;
        background: var(--cds-ui-02);
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        color: var(--cds-text-secondary);
        transition: all 0.2s ease;
    }

    .theme-card:hover {
        background: var(--cds-ui-03);
        color: var(--cds-text-primary);
    }

    .theme-card.selected {
        border-color: var(--cds-interactive-01);
        background: color-mix(
            in srgb,
            var(--cds-interactive-01) 5%,
            var(--cds-ui-01)
        );
        color: var(--cds-interactive-01);
    }

    .theme-card span {
        font-weight: 500;
        font-size: 0.875rem;
    }

    .accent-palette {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
    }

    .color-swatch {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.1s ease;
    }

    .color-swatch:hover {
        transform: scale(1.1);
    }

    .color-swatch.selected {
        outline: 2px solid var(--cds-text-primary);
        outline-offset: 2px;
    }

    .color-swatch-custom {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        overflow: hidden;
        border: 1px solid var(--cds-ui-04);
        margin-left: 0.5rem;
    }

    .color-swatch-custom .color-input-sm {
        width: 150%;
        height: 150%;
        margin: -25%;
        padding: 0;
        border: none;
        cursor: pointer;
    }

    .header-with-tag,
    .header-with-status {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-with-status {
        justify-content: space-between;
    }

    .export-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: var(--cds-ui-02);
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        color: var(--cds-text-secondary);
        transition: all 0.2s ease;
        text-align: left;
    }

    .export-card:hover {
        background: var(--cds-ui-03);
        color: var(--cds-text-primary);
    }

    .export-card.selected {
        border-color: var(--cds-interactive-01);
        background: color-mix(
            in srgb,
            var(--cds-interactive-01) 5%,
            var(--cds-ui-01)
        );
        color: var(--cds-interactive-01);
    }

    .export-card-text {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .export-card-text span {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--cds-text-primary);
    }

    .export-card.selected .export-card-text span {
        color: var(--cds-interactive-01);
    }

    .export-card-text small {
        font-size: 0.75rem;
        color: var(--cds-text-secondary);
        line-height: 1.2;
    }

    .export-preview {
        background: var(--cds-ui-02);
        padding: 1rem;
        border-radius: 4px;
        font-size: 0.875rem;
        line-height: 1.5;
        border-left: 4px solid var(--cds-interactive-01);
    }

    .preview-muted {
        color: var(--cds-text-secondary);
    }

    .sync-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .sync-options {
        display: flex;
        align-items: flex-end;
        gap: 2rem;
        padding: 1rem;
        background: var(--cds-ui-02);
        border-radius: 4px;
    }

    .actions-group {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-top: 1rem;
    }

    .manual-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-02);
        border-radius: 0 0 4px 4px;
    }

    .git-warning {
        padding: 1rem;
        background: #fff8e1;
        border-left: 4px solid #ffc107;
        color: #856404;
        font-size: 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .advanced-grid {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
        background: var(--cds-ui-02);
        border-radius: 4px;
    }

    .help-text {
        font-size: 0.8125rem;
        color: var(--cds-text-helper);
        margin: 0;
    }

    /* ── Customization Category ────────────────────────────────────────── */
    .type-management-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        background: var(--cds-ui-02);
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid var(--cds-ui-03);
    }

    .type-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        background: var(--cds-ui-01);
        border-radius: 4px;
        border: 1px solid transparent;
        transition: all 0.1s ease;
    }

    .type-item:hover {
        border-color: var(--cds-ui-03);
    }

    .type-item.is-default {
        border-left: 4px solid var(--cds-interactive-01);
    }

    .type-display,
    .type-edit-form {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    .type-color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .type-name {
        font-size: 0.875rem;
        color: var(--cds-text-primary);
        font-weight: 500;
    }

    .type-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .color-input-sm {
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
    }

    .add-type-form {
        margin-top: 1rem;
        padding: 1.5rem;
        background: var(--cds-ui-02);
        border-radius: 4px;
        border: 1px solid var(--cds-ui-03);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .add-type-inputs {
        display: flex;
        align-items: flex-end;
        gap: 1.5rem;
    }

    .color-picker-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .color-picker-group label {
        font-size: 0.75rem;
        color: var(--cds-text-secondary);
    }

    .color-picker-group input {
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-01);
        border-radius: 4px;
        cursor: pointer;
    }

    .updater-available {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .updater-available-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .updater-version-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .updater-new-version {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--cds-text-primary);
        font-family: var(--cds-code-01-font-family);
    }

    .updater-date {
        font-size: 0.8125rem;
        color: var(--cds-text-helper);
    }

    .updater-notes {
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 4px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .updater-notes-label {
        font-size: 0.75rem;
        color: var(--cds-text-helper);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .updater-notes-body {
        font-size: 0.875rem;
        color: var(--cds-text-secondary);
        margin: 0;
        line-height: 1.5;
        white-space: pre-wrap;
    }

    .updater-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .updater-install-failed {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    /* ── Debug Category ────────────────────────────────────────────────── */
    .debug-card {
        background: var(--cds-ui-02);
        border: 1px solid var(--cds-ui-03);
        border-radius: 6px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .debug-card h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--cds-text-primary);
        margin: 0;
    }

    .debug-card p {
        font-size: 0.875rem;
        color: var(--cds-text-secondary);
        line-height: 1.5;
        margin: 0;
    }

    .debug-actions {
        display: flex;
        justify-content: flex-start;
        padding-top: 0.5rem;
    }

    .debug-guide {
        list-style-type: disc;
        padding-left: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .debug-guide li {
        font-size: 0.875rem;
        color: var(--cds-text-secondary);
        line-height: 1.5;
    }

    .debug-guide li strong {
        color: var(--cds-text-primary);
        display: block;
        margin-bottom: 0.125rem;
    }
</style>

<script lang="ts">
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { getDb, SettingsRepo, WorkspaceRepo } from "$lib/db";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";

    interface PersistedSettings {
        workspaceName: string;
        authorName: string;
        gitBranch: string;
        autosaveSeconds: string;
    }

    const workspace = useWorkspace();

    let workspaceName = $state("Worklog Workspace");
    let authorName = $state("");
    let gitBranch = $state("main");
    let autosaveSeconds = $state("10");
    let loading = $state(true);
    let saving = $state(false);
    let errorMessage = $state<string | null>(null);
    let successMessage = $state<string | null>(null);
    let initialValues = $state<PersistedSettings | null>(null);

    const hasChanges = $derived.by(() => {
        if (!initialValues) return false;

        return (
            workspaceName !== initialValues.workspaceName ||
            authorName !== initialValues.authorName ||
            gitBranch !== initialValues.gitBranch ||
            autosaveSeconds !== initialValues.autosaveSeconds
        );
    });

    let loadedPath = $state<string | null>(null);

    $effect(() => {
        const path = workspace.path;
        if (!path || loadedPath === path) return;

        loadedPath = path;
        void loadSettings(path);
    });

    async function loadSettings(path: string) {
        loading = true;
        errorMessage = null;
        successMessage = null;

        try {
            const db = await getDb(path);
            const [meta, settings] = await Promise.all([
                WorkspaceRepo.getWorkspaceMeta(db),
                SettingsRepo.getSettings(db),
            ]);

            workspaceName = meta?.name ?? workspaceName;
            authorName = settings.author_name;
            gitBranch = settings.default_branch;
            autosaveSeconds = String(settings.autosave_seconds);

            initialValues = {
                workspaceName,
                authorName,
                gitBranch,
                autosaveSeconds,
            };
        } catch (error) {
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load settings";
        } finally {
            loading = false;
        }
    }

    function resetForm() {
        if (!initialValues) return;

        workspaceName = initialValues.workspaceName;
        authorName = initialValues.authorName;
        gitBranch = initialValues.gitBranch;
        autosaveSeconds = initialValues.autosaveSeconds;
        errorMessage = null;
        successMessage = null;
    }

    async function saveSettings() {
        const path = workspace.path;
        if (!path || saving || !initialValues) return;

        const parsedAutosave = Number.parseInt(autosaveSeconds, 10);
        if (!Number.isFinite(parsedAutosave) || parsedAutosave < 1) {
            errorMessage = "Autosave interval must be a positive integer.";
            successMessage = null;
            return;
        }

        saving = true;
        errorMessage = null;
        successMessage = null;

        try {
            const db = await getDb(path);

            await Promise.all([
                WorkspaceRepo.updateWorkspaceName(db, workspaceName.trim()),
                SettingsRepo.updateSettings(db, {
                    author_name: authorName.trim(),
                    default_branch: gitBranch.trim() || "main",
                    autosave_seconds: parsedAutosave,
                }),
            ]);

            initialValues = {
                workspaceName,
                authorName,
                gitBranch,
                autosaveSeconds: String(parsedAutosave),
            };
            autosaveSeconds = String(parsedAutosave);
            successMessage = "Settings saved.";
        } catch (error) {
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to save settings";
        } finally {
            saving = false;
        }
    }
</script>

<main class="h-full min-h-0 overflow-y-auto p-4 sm:p-5 lg:p-6">
    <section class="mx-auto w-full max-w-4xl space-y-4">
        <header class="space-y-1">
            <div class="flex items-center gap-2">
                <h1 class="text-sm font-semibold tracking-wide">Settings</h1>
                <Badge variant="outline" class="text-[10px]">Workspace</Badge>
            </div>
            <p class="text-xs text-muted-foreground">
                Tune your local-first workspace behavior and defaults.
            </p>
            {#if errorMessage}
                <p class="text-[11px] text-destructive">{errorMessage}</p>
            {/if}
            {#if successMessage}
                <p class="text-[11px] text-chart-4">{successMessage}</p>
            {/if}
        </header>

        <div class="rounded-lg border border-border/90 bg-surface-card">
            <div class="space-y-1 px-4 py-3">
                <h2 class="text-xs font-semibold">General</h2>
                <p class="text-[11px] text-muted-foreground">
                    Basic identity and commit metadata.
                </p>
            </div>

            <Separator />

            <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                <div class="space-y-1.5">
                    <label
                        class="text-[11px] text-muted-foreground"
                        for="workspace-name"
                    >
                        Workspace Name
                    </label>
                    <Input id="workspace-name" bind:value={workspaceName} />
                </div>

                <div class="space-y-1.5">
                    <label
                        class="text-[11px] text-muted-foreground"
                        for="author-name"
                    >
                        Git Author
                    </label>
                    <Input
                        id="author-name"
                        bind:value={authorName}
                        placeholder="Jane Doe"
                    />
                </div>
            </div>
        </div>

        <div class="rounded-lg border border-border/90 bg-surface-card">
            <div class="space-y-1 px-4 py-3">
                <h2 class="text-xs font-semibold">Workflow Defaults</h2>
                <p class="text-[11px] text-muted-foreground">
                    Defaults applied when creating tasks and syncing changes.
                </p>
            </div>

            <Separator />

            <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                <div class="space-y-1.5">
                    <label
                        class="text-[11px] text-muted-foreground"
                        for="git-branch"
                    >
                        Default Branch
                    </label>
                    <Input id="git-branch" bind:value={gitBranch} />
                </div>

                <div class="space-y-1.5">
                    <label
                        class="text-[11px] text-muted-foreground"
                        for="autosave-seconds"
                    >
                        Autosave Interval (seconds)
                    </label>
                    <Input id="autosave-seconds" bind:value={autosaveSeconds} />
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end gap-2">
            <Button
                variant="outline"
                size="sm"
                onclick={resetForm}
                disabled={loading || saving || !hasChanges}
            >
                Reset
            </Button>
            <Button
                size="sm"
                onclick={saveSettings}
                disabled={loading || saving || !hasChanges}
            >
                {saving ? "Saving..." : "Save settings"}
            </Button>
        </div>
    </section>
</main>

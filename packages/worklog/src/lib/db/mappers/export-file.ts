import type Database from '@tauri-apps/plugin-sql';
import { save } from '@tauri-apps/plugin-dialog';
import { documentDir } from '@tauri-apps/api/path';
import { writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import type { ExportOptions } from './types';
import { extractSnapshot } from './extract';
import { snapshotToSingleJson, snapshotToFolderJsonFiles } from './serialize-json';
import { snapshotToSingleCsv, snapshotToFolderCsvFiles } from './serialize-csv';
import * as m from "$lib/paraglide/messages.js";

/**
 * Full export orchestration: extract → serialize → prompt user → write to disk.
 *
 * @returns true if export was successful, false if user cancelled
 */
export async function exportToFile(db: Database, options: ExportOptions): Promise<boolean> {
    try {
        const snapshot = await extractSnapshot(db);
        const documentsPath = await documentDir();
        const dateSuffix = new Date().toISOString().split('T')[0];

        if (options.mode === 'single-file') {
            // ── Single File Mode ───────────────────────────────────────────
            const content = options.format === 'json'
                ? snapshotToSingleJson(snapshot)
                : snapshotToSingleCsv(snapshot);

            const ext = options.format === 'json' ? 'json' : 'csv';
            const filterName = options.format === 'json' ? 'JSON' : 'CSV';

            const filePath = await save({
                title: m.export_dialog_title({ format: filterName }),
                defaultPath: `${documentsPath}/.worklog/worklog_export_${dateSuffix}.${ext}`,
                filters: [{ name: filterName, extensions: [ext] }],
            });

            if (!filePath) return false; // User cancelled

            await writeTextFile(filePath, content);
            return true;

        } else {
            // ── Folder Mode ────────────────────────────────────────────────
            const files = options.format === 'json'
                ? snapshotToFolderJsonFiles(snapshot)
                : snapshotToFolderCsvFiles(snapshot);

            // Prompt user for a base directory by saving a placeholder file
            const basePath = await save({
                title: m.export_dialog_choose_folder(),
                defaultPath: `${documentsPath}/.worklog/worklog_export_${dateSuffix}/metadata.json`,
                filters: [{ name: 'JSON', extensions: ['json'] }],
            });

            if (!basePath) return false; // User cancelled

            // Derive the folder path from the selected file path
            const folderPath = basePath.replace(/\/metadata\.json$/, '');

            // Create boards subdirectory if needed
            const boardsDir = `${folderPath}/boards`;
            const boardsDirExists = await exists(boardsDir);
            if (!boardsDirExists) {
                await mkdir(boardsDir, { recursive: true });
            }

            // Write all files
            for (const [relativePath, content] of files.entries()) {
                const fullPath = `${folderPath}/${relativePath}`;
                await writeTextFile(fullPath, content);
            }

            return true;
        }
    } catch (error) {
        console.error('Failed to export:', error);
        throw error;
    }
}

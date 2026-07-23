import type Database from '@tauri-apps/plugin-sql';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile, readDir } from '@tauri-apps/plugin-fs';
import type { ImportResult, ImportStrategy } from './types';
import { parseSnapshotFromSingleJson, parseSnapshotFromFolder } from './deserialize-json';
import { csvToTickets } from './deserialize-csv';
import { importSnapshot } from './import';
import type { BoardSnapshot } from './types';
import * as m from "$lib/paraglide/messages.js";

/**
 * Full import orchestration: prompt user → read → deserialize → import into DB.
 *
 * Auto-detects the source:
 * - Single .json file → parsed as a full workspace snapshot
 * - Single .csv file → parsed as tickets (requires an active board context)
 * - Folder selection → reads metadata.json to determine structure
 *
 * @returns ImportResult on success, null if user cancelled
 */
export async function importFromFile(
    db: Database,
    strategy: ImportStrategy = 'merge',
): Promise<ImportResult | null> {
    try {
        // Let user pick a file or folder
        const selected = await open({
            title: m.import_dialog_title(),
            multiple: false,
            directory: false,
            filters: [
                { name: m.import_dialog_filter_worklog_export(), extensions: ['json', 'csv'] },
            ],
        });

        if (!selected) return null; // User cancelled

        const filePath = selected as string;

        // Determine format from extension
        const isJson = filePath.toLowerCase().endsWith('.json');
        const isCsv = filePath.toLowerCase().endsWith('.csv');

        if (isJson) {
            const content = await readTextFile(filePath);
            const snapshot = parseSnapshotFromSingleJson(content);
            return await importSnapshot(db, snapshot, strategy);
        }

        if (isCsv) {
            const content = await readTextFile(filePath);
            const tickets = csvToTickets(content);

            if (tickets.length === 0) {
                return {
                    boardsCreated: 0,
                    boardsUpdated: 0,
                    ticketsCreated: 0,
                    ticketsUpdated: 0,
                    ticketsSkipped: 0,
                };
            }

            // Group tickets by board_id and build a minimal snapshot
            const boardMap = new Map<string, BoardSnapshot>();
            for (const ticket of tickets) {
                if (!boardMap.has(ticket.board_id)) {
                    boardMap.set(ticket.board_id, {
                        board: {
                            id: ticket.board_id,
                            name: `Imported Board (${ticket.board_id})`,
                            description: '',
                            tabs_config: '["kanban"]',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            archived_at: new Date().toISOString()
                        },
                        tickets: [],
                    });
                }
                boardMap.get(ticket.board_id)!.tickets.push(ticket);
            }

            const snapshot = {
                export_version: 1,
                exported_at: new Date().toISOString(),
                workspace_meta: null,
                app_settings: null,
                boards: Array.from(boardMap.values()),
            };

            return await importSnapshot(db, snapshot, strategy);
        }

        throw new Error(`Unsupported file format: ${filePath}`);
    } catch (error) {
        console.error('Failed to import:', error);
        throw error;
    }
}

/**
 * Import from a folder path (used by sync engine and manual folder import).
 */
export async function importFromFolder(
    db: Database,
    folderPath: string,
    strategy: ImportStrategy = 'merge',
): Promise<ImportResult> {
    const files = new Map<string, string>();

    // Read top-level files
    const topEntries = await readDir(folderPath);
    for (const entry of topEntries) {
        if (entry.name && entry.name.endsWith('.json') && !entry.isDirectory) {
            const content = await readTextFile(`${folderPath}/${entry.name}`);
            files.set(entry.name, content);
        }
    }

    // Read boards/ subdirectory if it exists
    try {
        const boardEntries = await readDir(`${folderPath}/boards`);
        for (const entry of boardEntries) {
            if (entry.name && (entry.name.endsWith('.json') || entry.name.endsWith('.csv'))) {
                const content = await readTextFile(`${folderPath}/boards/${entry.name}`);
                files.set(`boards/${entry.name}`, content);
            }
        }
    } catch {
        // boards/ directory doesn't exist — that's fine
    }

    // Check if there are CSV board files (folder-mode CSV export)
    const hasCsvBoards = Array.from(files.keys()).some(
        k => k.startsWith('boards/') && k.endsWith('.csv')
    );

    if (hasCsvBoards) {
        // Handle CSV folder mode: board metadata from .json, tickets from .csv
        return await importCsvFolderSnapshot(db, files, strategy);
    }

    // Standard JSON folder mode
    const snapshot = parseSnapshotFromFolder(files);
    return await importSnapshot(db, snapshot, strategy);
}

/**
 * Handles the CSV folder mode where board metadata is in .json and tickets in .csv
 */
async function importCsvFolderSnapshot(
    db: Database,
    files: Map<string, string>,
    strategy: ImportStrategy,
): Promise<ImportResult> {
    const snapshot = parseSnapshotFromFolder(files);

    // For each board that has a corresponding CSV file, parse tickets from CSV
    for (const boardSnap of snapshot.boards) {
        const csvKey = `boards/${boardSnap.board.id}.csv`;
        const csvContent = files.get(csvKey);
        if (csvContent) {
            boardSnap.tickets = csvToTickets(csvContent, boardSnap.board.id);
        }
    }

    return await importSnapshot(db, snapshot, strategy);
}

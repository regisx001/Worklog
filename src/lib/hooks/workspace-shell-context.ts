import { createContext } from "svelte";

import type { useBoards } from "$lib/hooks/boards.svelte";
import type { useWorkspace } from "$lib/hooks/workspace.svelte";

export type WorkspaceApi = ReturnType<typeof useWorkspace>;
export type BoardsApi = ReturnType<typeof useBoards>;

export interface WorkspaceShellContext {
    workspace: WorkspaceApi;
    boardsApi: BoardsApi;
}

export const [getWorkspaceShellContext, setWorkspaceShellContext] =
    createContext<WorkspaceShellContext>();

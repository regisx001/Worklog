export interface RemoteInfo {
    branches: string[];
    defaultBranch: string | null;
}

export function gitInitArgs(branch: string): string[] {
    return ['init', `--initial-branch=${branch}`];
}

export function gitPushArgs(branch: string, force = false): string[] {
    return [
        'push',
        ...(force ? ['--force'] : []),
        '-u',
        'origin',
        `HEAD:refs/heads/${branch}`,
    ];
}

export function parseRemoteInfo(output: string): RemoteInfo {
    const lines = output.split(/\r?\n/);
    const branches = lines
        .map((line) => line.match(/^[^\s]+\s+refs\/heads\/(.+)$/)?.[1])
        .filter((branch): branch is string => Boolean(branch));
    const defaultBranch =
        lines
            .map(
                (line) =>
                    line.match(/^ref:\s+refs\/heads\/(.+)\s+HEAD$/)?.[1],
            )
            .find((branch): branch is string => Boolean(branch)) ?? null;

    return { branches: [...new Set(branches)], defaultBranch };
}

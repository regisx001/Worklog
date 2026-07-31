import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
    gitInitArgs,
    gitPushArgs,
    parseRemoteInfo,
} from '../src/lib/sync/git-commands.ts';
import { SyncOperationGate } from '../src/lib/sync/sync-operation-gate.ts';
import { runAutomaticSync } from '../src/lib/sync/sync-flow.ts';

function gitResult(cwd, args) {
    return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

function git(cwd, args) {
    const result = gitResult(cwd, args);
    assert.equal(
        result.status,
        0,
        `${args.join(' ')} failed:\n${result.stderr || result.stdout}`,
    );
    return result.stdout.trim();
}

function gitAsync(cwd, args, env = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn('git', args, {
            cwd,
            env: { ...process.env, ...env },
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data;
        });
        child.stderr.on('data', (data) => {
            stderr += data;
        });
        child.once('error', reject);
        child.once('close', (code) => resolve({ code, stdout, stderr }));
    });
}

async function withRepositories(run) {
    const root = await mkdtemp(join(tmpdir(), 'worklog-sync-'));
    const local = join(root, 'local');
    const remote = join(root, 'remote.git');

    try {
        git(root, ['init', '--bare', remote]);
        await run({ root, local, remote });
    } finally {
        await rm(root, { recursive: true, force: true });
    }
}

function createCommit(local) {
    git(local, ['config', 'user.name', 'Worklog test']);
    git(local, ['config', 'user.email', 'worklog-test@example.invalid']);
    git(local, ['commit', '--allow-empty', '-m', 'sync fixture']);
}

function seedRemote(root, remote, branch) {
    const seed = join(root, `seed-${branch}`);
    git(root, [...gitInitArgs(branch), seed]);
    createCommit(seed);
    git(seed, ['remote', 'add', 'origin', remote]);
    git(seed, gitPushArgs(branch));
    git(root, ['--git-dir', remote, 'symbolic-ref', 'HEAD', `refs/heads/${branch}`]);
    return seed;
}

function inspectRemote(root, remote) {
    return parseRemoteInfo(git(root, ['ls-remote', '--symref', remote]));
}

test('initializes and publishes the configured main branch', async () => {
    await withRepositories(async ({ root, local, remote }) => {
        git(root, [...gitInitArgs('main'), local]);
        assert.equal(git(local, ['branch', '--show-current']), 'main');
        createCommit(local);
        git(local, ['remote', 'add', 'origin', remote]);
        git(local, gitPushArgs('main'));

        assert.notEqual(
            git(root, ['--git-dir', remote, 'rev-parse', 'refs/heads/main']),
            '',
        );
    });
});

test('publishes a legacy master snapshot to the configured main branch', async () => {
    await withRepositories(async ({ root, local, remote }) => {
        git(root, ['init', '--initial-branch=master', local]);
        assert.equal(git(local, ['branch', '--show-current']), 'master');
        createCommit(local);
        git(local, ['remote', 'add', 'origin', remote]);
        git(local, gitPushArgs('main'));

        assert.notEqual(
            git(root, ['--git-dir', remote, 'rev-parse', 'refs/heads/main']),
            '',
        );
    });
});

test('recognizes an empty remote before the first push', async () => {
    await withRepositories(async ({ root, remote }) => {
        assert.deepEqual(inspectRemote(root, remote), {
            branches: [],
            defaultBranch: null,
        });
    });
});

test('pushes an existing clean local snapshot to repair a missing remote branch', async () => {
    await withRepositories(async ({ root, local, remote }) => {
        git(root, [...gitInitArgs('main'), local]);
        createCommit(local);
        git(local, ['remote', 'add', 'origin', remote]);
        assert.equal(git(local, ['status', '--short']), '');

        git(local, gitPushArgs('main'));
        assert.equal(git(local, ['status', '--short']), '');
        git(local, gitPushArgs('main'));

        assert.ok(inspectRemote(root, remote).branches.includes('main'));
    });
});

test('detects an existing target branch and a different remote default branch', async () => {
    await withRepositories(async ({ root, remote }) => {
        seedRemote(root, remote, 'main');
        const targetInfo = inspectRemote(root, remote);
        assert.ok(targetInfo.branches.includes('main'));
        assert.equal(targetInfo.defaultBranch, 'main');

        const masterRemote = join(root, 'master.git');
        git(root, ['init', '--bare', masterRemote]);
        seedRemote(root, masterRemote, 'master');
        const mismatchInfo = inspectRemote(root, masterRemote);
        assert.equal(mismatchInfo.defaultBranch, 'master');
        assert.notEqual(mismatchInfo.defaultBranch, 'main');
    });
});

test('reports a non-fast-forward push instead of treating it as success', async () => {
    await withRepositories(async ({ root, remote }) => {
        seedRemote(root, remote, 'main');
        const first = join(root, 'first');
        const second = join(root, 'second');
        git(root, ['clone', remote, first]);
        git(root, ['clone', remote, second]);
        createCommit(first);
        git(first, gitPushArgs('main'));
        createCommit(second);

        const result = gitResult(second, gitPushArgs('main'));
        assert.notEqual(result.status, 0);
        assert.match(
            result.stderr || result.stdout,
            /non-fast-forward|fetch first|rejected/i,
        );
    });
});

test('reports authentication failure from a protected remote', async () => {
    const server = createServer((_request, response) => {
        response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Worklog"' });
        response.end('authentication required');
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    try {
        const address = server.address();
        assert.ok(address && typeof address === 'object');
        const result = await gitAsync(process.cwd(), [
            'ls-remote',
            `http://worklog-test-token@127.0.0.1:${address.port}/repo.git`,
        ], { GIT_TERMINAL_PROMPT: '0' });
        assert.notEqual(result.code, 0);
        assert.match(
            result.stderr || result.stdout,
            /authentication|password|terminal prompts|401/i,
        );
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('does not push when automatic pull needs attention', async () => {
    let pushCalls = 0;
    const failedPull = {
        status: 'branch_mismatch',
        message: 'Remote default branch differs',
        timestamp: new Date().toISOString(),
    };

    const result = await runAutomaticSync(
        async () => failedPull,
        async () => {
            pushCalls += 1;
            return {
                status: 'success',
                message: 'unexpected push',
                timestamp: new Date().toISOString(),
            };
        },
    );

    assert.equal(result, failedPull);
    assert.equal(pushCalls, 0);
});

test('serializes concurrent sync requests through one operation gate', async () => {
    const gate = new SyncOperationGate();
    let release;
    const first = gate.run(
        async () => {
            await new Promise((resolve) => {
                release = resolve;
            });
            return 'first';
        },
        () => 'busy',
    );

    const second = await gate.run(
        async () => 'second',
        () => 'busy',
    );
    assert.equal(second, 'busy');

    release();
    assert.equal(await first, 'first');
});

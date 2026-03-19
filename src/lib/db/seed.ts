import type Database from '@tauri-apps/plugin-sql';
import { BoardRepo, TicketRepo, WorkspaceRepo } from '$lib/db';

export async function seedDatabase(db: Database): Promise<void> {
    console.log('[seed] Starting...');

    // ── Workspace ────────────────────────────────────────
    await WorkspaceRepo.initWorkspace(db, 'Worklog Dev');
    console.log('[seed] Workspace ready');

    // ── Boards ───────────────────────────────────────────
    const backend = await BoardRepo.createBoard(db, {
        name: 'Backend API',
        description: 'FastAPI services and database layer'
    });

    const frontend = await BoardRepo.createBoard(db, {
        name: 'Frontend',
        description: 'SvelteKit UI components and routing'
    });

    const devops = await BoardRepo.createBoard(db, {
        name: 'DevOps',
        description: 'Docker, CI/CD, and deployment'
    });

    console.log('[seed] Boards created:', [backend.name, frontend.name, devops.name]);

    // ── Backend Tickets ───────────────────────────────────
    await TicketRepo.createTicket(db, {
        board_id: backend.id,
        title: 'Setup FastAPI project structure',
        description: 'Initialize the project with routers, schemas, and db config.',
        labels: ['setup', 'backend']
    });

    const authTicket = await TicketRepo.createTicket(db, {
        board_id: backend.id,
        title: 'Implement JWT authentication',
        description: 'Add login, refresh token, and protected route middleware.',
        labels: ['auth', 'backend']
    });

    await TicketRepo.updateTicket(db, authTicket.id, { status: 'in_progress' });

    const dbTicket = await TicketRepo.createTicket(db, {
        board_id: backend.id,
        title: 'Design PostgreSQL schema',
        description: 'Create tables for users, workspaces, boards, and tickets.',
        labels: ['database', 'backend']
    });

    await TicketRepo.updateTicket(db, dbTicket.id, { status: 'done' });

    await TicketRepo.createTicket(db, {
        board_id: backend.id,
        title: 'Add rate limiting to API endpoints',
        description: 'Use slowapi to prevent abuse on public routes.',
        labels: ['security', 'backend']
    });

    // ── Frontend Tickets ──────────────────────────────────
    const kanbanTicket = await TicketRepo.createTicket(db, {
        board_id: frontend.id,
        title: 'Build KanbanColumn component',
        description: 'Render tickets by status in three columns.',
        labels: ['ui', 'svelte']
    });

    await TicketRepo.updateTicket(db, kanbanTicket.id, { status: 'in_progress' });

    await TicketRepo.createTicket(db, {
        board_id: frontend.id,
        title: 'Implement CommandPalette (Ctrl+K)',
        description: 'Search and trigger actions via keyboard.',
        labels: ['ui', 'keyboard']
    });

    const detailTicket = await TicketRepo.createTicket(db, {
        board_id: frontend.id,
        title: 'Ticket detail panel — inline editing',
        description: 'Click a field to edit, Enter to save, Escape to cancel.',
        labels: ['ui', 'svelte']
    });

    await TicketRepo.updateTicket(db, detailTicket.id, {
        status: 'done',
        comments: [
            {
                author: 'regisx001',
                body: 'Inline editing works, needs keyboard nav polish.',
                timestamp: new Date().toISOString()
            }
        ]
    });

    await TicketRepo.createTicket(db, {
        board_id: frontend.id,
        title: 'Dark theme polish — typography and spacing',
        description: 'Review all components against the design spec.',
        labels: ['ui', 'design']
    });

    // ── DevOps Tickets ────────────────────────────────────
    await TicketRepo.createTicket(db, {
        board_id: devops.id,
        title: 'Write Dockerfile for Tauri build',
        description: 'Cross-platform build pipeline using Docker.',
        labels: ['docker', 'ci']
    });

    const ciTicket = await TicketRepo.createTicket(db, {
        board_id: devops.id,
        title: 'Setup GitHub Actions release workflow',
        description: 'Auto-build .deb, .dmg, .exe on tag push.',
        labels: ['ci', 'github']
    });

    await TicketRepo.updateTicket(db, ciTicket.id, { status: 'in_progress' });

    console.log('[seed] Tickets created');
    console.log('[seed] Done');
}

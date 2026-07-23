import { getDb, TicketRepo, EventRepo, BoardRepo } from '$lib/db';

export interface OverviewMetrics {
    activeBoards: number;
    totalTickets: number;
    doneTickets: number;
    completionRate: number;
    overdueCount: number;
    totalTrend: 'up' | 'down' | 'stable';
}

export interface StatusCount {
    status: string;
    count: number;
    percentage: number;
}

export interface BoardTicketCount {
    boardId: string;
    boardName: string;
    openCount: number;
}

export interface UpcomingDeadline {
    id: string;
    title: string;
    priority: string;
    dueDate: string;
    boardName: string;
}

export interface OverdueBreakdown {
    priority: string;
    count: number;
}

export interface LabelFrequency {
    label: string;
    count: number;
}

export interface RecentActivityItem {
    id: string;
    eventType: string;
    payload: Record<string, unknown>;
    timestamp: string;
}

export interface TimelinePoint {
    date: string;
    created: number;
    completed: number;
}

export interface OverviewData {
    metrics: OverviewMetrics;
    statusBreakdown: StatusCount[];
    busiestBoards: BoardTicketCount[];
    upcomingDeadlines: UpcomingDeadline[];
    recentActivity: RecentActivityItem[];
    overdueBreakdown: OverdueBreakdown[];
    topLabels: LabelFrequency[];
    progressTimeline: TimelinePoint[];
}

export function getWorkspaceOverview(getWorkspacePath: () => string | null) {
    let _data = $state<OverviewData | null>(null);
    let _loading = $state(false);
    let _error = $state<string | null>(null);

    async function load() {
        const workspacePath = getWorkspacePath();
        if (!workspacePath) {
            _data = null;
            return;
        }

        _loading = true;
        _error = null;

        try {
            const db = await getDb(workspacePath);

            // Fetch all data in parallel
            const [allTickets, boards, overdueByPriority, upcoming, totalOverdue, events] =
                await Promise.all([
                    TicketRepo.listAllTickets(db),
                    BoardRepo.listBoards(db, { archived: false }),
                    TicketRepo.getOverdueByPriority(db),
                    TicketRepo.getUpcomingDeadlines(db, 10),
                    TicketRepo.countOverdueTickets(db),
                    EventRepo.listEvents(db, { desc: true, limit: 30 }),
                ]);

            const boardMap = new Map(boards.map((b) => [b.id, b]));

            // ── Metrics ─────────────────────────────────────────────────────
            const totalTickets = allTickets.length;
            const doneTickets = allTickets.filter((t) => t.status === 'done').length;
            const completionRate = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

            const metrics: OverviewMetrics = {
                activeBoards: boards.length,
                totalTickets,
                doneTickets,
                completionRate,
                overdueCount: totalOverdue,
                totalTrend: 'up',
            };

            // ── Status Breakdown ─────────────────────────────────────────────
            const STATUS_ORDER = ['backlog', 'todo', 'in_progress', 'done'];
            const statusBreakdown: StatusCount[] = STATUS_ORDER.map((status) => {
                const count = allTickets.filter((t) => t.status === status).length;
                return {
                    status,
                    count,
                    percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0,
                };
            });

            // ── Busiest Boards ──────────────────────────────────────────────
            const boardOpenCounts = new Map<string, number>();
            for (const t of allTickets) {
                if (t.status !== 'done') {
                    boardOpenCounts.set(t.board_id, (boardOpenCounts.get(t.board_id) ?? 0) + 1);
                }
            }
            const busiestBoards: BoardTicketCount[] = [...boardOpenCounts.entries()]
                .map(([boardId, count]) => ({
                    boardId,
                    boardName: boardMap.get(boardId)?.name ?? '',
                    openCount: count,
                }))
                .sort((a, b) => b.openCount - a.openCount)
                .slice(0, 5);

            // ── Upcoming Deadlines ──────────────────────────────────────────
            const upcomingDeadlines: UpcomingDeadline[] = upcoming.map((t) => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                dueDate: t.due_date ?? '',
                boardName: boardMap.get(t.board_id)?.name ?? '',
            }));

            // ── Overdue Breakdown ───────────────────────────────────────────
            const overdueBreakdown: OverdueBreakdown[] = overdueByPriority.map((o) => ({
                priority: o.priority,
                count: o.count,
            }));
            // Ensure p1, p2, p3 all appear even if zero
            const priorityOrder = ['p1', 'p2', 'p3'];
            const mappedOverdue = new Map(overdueBreakdown.map((o) => [o.priority, o]));
            const fullOverdueBreakdown: OverdueBreakdown[] = priorityOrder.map((p) => ({
                priority: p,
                count: mappedOverdue.get(p)?.count ?? 0,
            }));

            // ── Top Labels ──────────────────────────────────────────────────
            const labelCounts = new Map<string, number>();
            for (const t of allTickets) {
                for (const label of t.labels) {
                    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
                }
            }
            const topLabels: LabelFrequency[] = [...labelCounts.entries()]
                .map(([label, count]) => ({ label, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // ── Recent Activity ─────────────────────────────────────────────
            const recentActivity: RecentActivityItem[] = events.map((e) => ({
                id: e.id,
                eventType: e.event_type,
                payload: e.payload,
                timestamp: e.created_at,
            }));

            // ── Progress Timeline (last 30 days) ────────────────────────────
            const now = new Date();
            const dayMap = new Map<string, { created: number; completed: number }>();
            for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                dayMap.set(key, { created: 0, completed: 0 });
            }

            // Count created tickets per day from ticket created_at
            for (const t of allTickets) {
                const day = t.created_at.slice(0, 10);
                if (dayMap.has(day)) {
                    dayMap.get(day)!.created++;
                }
            }

            // Count completions from events (ticket_moved to done)
            // Payload structure: { before: { status }, after: { status } }
            const completionEvents = await EventRepo.listEvents(db, {
                event_type: 'ticket_moved' as any,
                desc: false,
                limit: 500,
            });
            const completedViaEvents = new Set<string>();
            for (const e of completionEvents) {
                const payload = e.payload as Record<string, any>;
                const toStatus = payload.after?.status;
                if (toStatus === 'done') {
                    completedViaEvents.add(e.entity_id);
                    const day = e.created_at.slice(0, 10);
                    if (dayMap.has(day)) {
                        dayMap.get(day)!.completed++;
                    }
                }
            }

            // Fallback: count done tickets by updated_at for data imported
            // without events (e.g. initial seed, file import)
            for (const t of allTickets) {
                if (t.status === 'done' && !completedViaEvents.has(t.id)) {
                    const day = t.updated_at.slice(0, 10);
                    if (dayMap.has(day)) {
                        dayMap.get(day)!.completed++;
                    }
                }
            }

            const progressTimeline: TimelinePoint[] = [...dayMap.entries()].map(([date, counts]) => ({
                date,
                created: counts.created,
                completed: counts.completed,
            }));

            _data = {
                metrics,
                statusBreakdown,
                busiestBoards,
                upcomingDeadlines,
                recentActivity,
                overdueBreakdown: fullOverdueBreakdown,
                topLabels,
                progressTimeline,
            };
        } catch (e) {
            _error = String(e);
            console.error('[workspace-overview] Failed to load:', e);
        } finally {
            _loading = false;
        }
    }

    return {
        get data() { return _data; },
        get loading() { return _loading; },
        get error() { return _error; },
        load,
    };
}

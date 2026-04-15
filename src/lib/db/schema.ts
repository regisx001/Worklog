export const SCHEMA_VERSION = 4;

export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS workspace_meta (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    name            TEXT NOT NULL,
    schema_version  INTEGER NOT NULL DEFAULT 1,
    sync_mode       TEXT NOT NULL DEFAULT 'local',
    created_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS boards (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id          TEXT PRIMARY KEY,
    board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'todo'
                CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')),
    priority    TEXT NOT NULL DEFAULT 'p2'
                CHECK (priority IN ('p1', 'p2', 'p3')),
    ticket_type TEXT NOT NULL DEFAULT 'feature'
                CHECK (ticket_type IN ('feature', 'bug', 'chore')),
    due_date    TEXT,
    labels      TEXT NOT NULL DEFAULT '[]',
    comments    TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    author_name       TEXT NOT NULL DEFAULT '',
    default_branch    TEXT NOT NULL DEFAULT 'main',
    autosave_seconds  INTEGER NOT NULL DEFAULT 10,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_board_id ON tickets(board_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status   ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
  CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON tickets(ticket_type);
  CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date);
`;

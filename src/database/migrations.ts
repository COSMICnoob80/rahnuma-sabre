export const ASSETS_MIGRATION_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    label TEXT NOT NULL,
    amount_pkr REAL NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    imported_at TEXT NOT NULL,
    raw_line TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_assets_kind ON assets (kind)`,
  `CREATE INDEX IF NOT EXISTS idx_assets_source ON assets (source)`,
];

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { ASSETS_MIGRATION_STATEMENTS } from '../src/database/migrations.ts';

function migrate(db: DatabaseSync): void {
  for (const statement of ASSETS_MIGRATION_STATEMENTS) db.exec(statement);
}

test('assets migration: creates the table with the import-stamp columns', () => {
  const db = new DatabaseSync(':memory:');
  migrate(db);

  const columns = db
    .prepare('PRAGMA table_info(assets)')
    .all()
    .map((row: any) => row.name);

  assert.deepEqual(columns, [
    'id',
    'kind',
    'label',
    'amount_pkr',
    'source',
    'imported_at',
    'raw_line',
  ]);

  const indexes = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'assets'")
    .all()
    .map((row: any) => row.name);

  assert.ok(indexes.includes('idx_assets_kind'));
  assert.ok(indexes.includes('idx_assets_source'));
});

test('assets migration: re-running is idempotent and never drops existing rows', () => {
  const db = new DatabaseSync(':memory:');
  migrate(db);

  db.prepare(
    'INSERT INTO assets (kind, label, amount_pkr, source, imported_at, raw_line) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('gold', 'Gold', 500000, 'fbr', '2026-01-01T00:00:00.000Z', 'Gold: 500000');

  migrate(db);
  migrate(db);

  const rows = db.prepare('SELECT kind, label, amount_pkr, source FROM assets').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].kind, 'gold');
  assert.equal(rows[0].amount_pkr, 500000);
  assert.equal(rows[0].source, 'fbr');

  db.prepare(
    'INSERT INTO assets (kind, label, amount_pkr, source, imported_at, raw_line) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('property', 'Plot', 1200000, 'manual', '2026-01-02T00:00:00.000Z', null);

  migrate(db);
  const after = db.prepare('SELECT COUNT(*) AS total FROM assets').get();
  assert.equal(after.total, 2);
});

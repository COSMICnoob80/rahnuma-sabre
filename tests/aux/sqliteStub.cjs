// Minimal expo-sqlite stand-in backed by Node's built-in SQLite, so the real
// db.ts queries run in the screen render harness instead of being mocked away.
const { DatabaseSync } = require('node:sqlite');

function createDatabase() {
  const db = new DatabaseSync(':memory:');

  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async getAllAsync(sql, ...params) {
      return db.prepare(sql).all(...params);
    },
    async getFirstAsync(sql, ...params) {
      const row = db.prepare(sql).get(...params);
      return row === undefined ? null : row;
    },
    async runAsync(sql, ...params) {
      const result = db.prepare(sql).run(...params);
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: Number(result.changes),
      };
    },
  };
}

async function openDatabaseAsync() {
  return createDatabase();
}

module.exports = { openDatabaseAsync };

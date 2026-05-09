import * as SQLite from 'expo-sqlite';
import { Holding, Expense, Income } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('rahnuma_sabre.db');
    await initDb(db);
  }
  return db;
}

async function initDb(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      quantity REAL NOT NULL,
      avg_buy_price REAL NOT NULL,
      current_price REAL,
      last_fetched TEXT
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      amount REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// Holdings
export async function getHoldings(): Promise<Holding[]> {
  const d = await getDb();
  return d.getAllAsync<Holding>('SELECT * FROM holdings ORDER BY ticker');
}

export async function addHolding(h: Omit<Holding, 'id'>): Promise<number> {
  const d = await getDb();
  const r = await d.runAsync(
    'INSERT INTO holdings (ticker, quantity, avg_buy_price, current_price, last_fetched) VALUES (?, ?, ?, ?, ?)',
    h.ticker, h.quantity, h.avg_buy_price, h.current_price, h.last_fetched
  );
  return r.lastInsertRowId;
}

export async function updateHoldingPrice(id: number, price: number): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    "UPDATE holdings SET current_price = ?, last_fetched = datetime('now') WHERE id = ?",
    price, id
  );
}

export async function deleteHolding(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM holdings WHERE id = ?', id);
}

// Expenses
export async function getExpenses(): Promise<Expense[]> {
  const d = await getDb();
  return d.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC');
}

export async function addExpense(e: Omit<Expense, 'id'>): Promise<number> {
  const d = await getDb();
  const r = await d.runAsync(
    'INSERT INTO expenses (amount, category, date) VALUES (?, ?, ?)',
    e.amount, e.category, e.date
  );
  return r.lastInsertRowId;
}

export async function getExpensesByMonth(month: string): Promise<Expense[]> {
  const d = await getDb();
  return d.getAllAsync<Expense>(
    "SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC",
    month
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function getExpenseTotalByMonth(month: string): Promise<number> {
  const d = await getDb();
  const r = await d.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime('%Y-%m', date) = ?",
    month
  );
  return r?.total ?? 0;
}

export async function getExpenseByCategory(month: string): Promise<{ category: string; total: number }[]> {
  const d = await getDb();
  return d.getAllAsync<{ category: string; total: number }>(
    "SELECT category, SUM(amount) as total FROM expenses WHERE strftime('%Y-%m', date) = ? GROUP BY category ORDER BY total DESC",
    month
  );
}

// Income
export async function getIncome(): Promise<Income[]> {
  const d = await getDb();
  return d.getAllAsync<Income>('SELECT * FROM income');
}

export async function addIncome(i: Omit<Income, 'id'>): Promise<number> {
  const d = await getDb();
  const r = await d.runAsync(
    'INSERT INTO income (source, amount) VALUES (?, ?)',
    i.source, i.amount
  );
  return r.lastInsertRowId;
}

export async function getTotalIncome(): Promise<number> {
  const d = await getDb();
  const r = await d.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM income'
  );
  return r?.total ?? 0;
}

export async function deleteIncome(id: number): Promise<void> {
  const d = await getDb();
  await d.runAsync('DELETE FROM income WHERE id = ?', id);
}

// Settings
export async function getSetting(key: string): Promise<string | null> {
  const d = await getDb();
  const r = await d.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return r?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb();
  await d.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key, value
  );
}

// PIN
export async function setPin(pin: string): Promise<void> {
  const hash = simpleHash(pin);
  await setSetting('pin_hash', hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = await getSetting('pin_hash');
  if (!hash) return true;
  return hash === simpleHash(pin);
}

export async function hasPin(): Promise<boolean> {
  const hash = await getSetting('pin_hash');
  return hash !== null;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = ((h << 5) - h) + c;
    h = h & h;
  }
  return Math.abs(h).toString(16);
}

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Game, GamePlayer, Table, User } from '../types';

export type { Game, GamePlayer, Table, User };

// Khởi tạo database connection
export async function getDb() {
  return open({
    filename: './data/billiards.db',
    driver: sqlite3.Database
  });
}

// Helper function để thực hiện transaction
export async function executeTransaction<T>(callback: (db: Awaited<ReturnType<typeof getDb>>) => Promise<T>): Promise<T> {
  const db = await getDb();
  try {
    await db.exec('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  } finally {
    await db.close();
  }
}

// Khởi tạo database schema
export async function initDb() {
  const db = await getDb();

  // Tạo bảng members
  await db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      payment_qr TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tạo bảng bills
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      table_number TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'cancelled')) DEFAULT 'active',
      start_time TEXT NOT NULL,
      end_time TEXT,
      notes TEXT,
      payer_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payer_id) REFERENCES members (id)
    )
  `);

  // Tạo bảng bill_participants để lưu người chơi trong mỗi bill
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bill_participants (
      bill_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      has_paid BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (bill_id, member_id),
      FOREIGN KEY (bill_id) REFERENCES bills (id),
      FOREIGN KEY (member_id) REFERENCES members (id)
    )
  `);

  await db.close();
}

// Helper function để query database
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  try {
    return await db.all(sql, params);
  } finally {
    await db.close();
  }
}

// Helper function để query một record
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results[0] || null;
}

export default {
  query,
  queryOne,
  getDb,
  initDb,
  executeTransaction
};

// Khởi tạo database khi import module
initDb().catch(console.error); 
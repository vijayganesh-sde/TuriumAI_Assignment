import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/knowledge.db");

let _db = null;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL CHECK(type IN ('note', 'url')),
      source      TEXT NOT NULL,
      raw_content TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id        TEXT PRIMARY KEY,
      item_id   TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      content   TEXT NOT NULL,
      chunk_idx INTEGER NOT NULL,
      embedding BLOB
    );
  `);

  logger.info("Database initialized");
}

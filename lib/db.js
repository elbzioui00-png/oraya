const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

module.exports = db;
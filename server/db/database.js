const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let db = null;

function initDatabase() {
  const dbPath = process.env.DATABASE_PATH || './db/run2rank.db';
  const dbDir = path.dirname(dbPath);

  // Create db directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create or open database
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Execute the entire schema at once (better-sqlite3 supports this)
  try {
    db.exec(schema);
  } catch (error) {
    console.error('Error executing schema:', error);
    throw error;
  }

  console.log('✅ Database initialized successfully');
  return db;
}

function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};

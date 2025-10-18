const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "mager.db");

let dbInstance = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initDatabase() {
  ensureDataDirectory();

  dbInstance = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error("Failed to connect to SQLite database:", err.message);
    } else {
      console.log("SQLite database connected");
    }
  });

  dbInstance.serialize(() => {
    dbInstance.run(
      `CREATE TABLE IF NOT EXISTS user_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        message_id INTEGER NOT NULL
      )`,
      (err) => {
        if (err) {
          console.error("Failed to ensure user_posts table:", err.message);
        }
      }
    );

    dbInstance.run(
      `CREATE INDEX IF NOT EXISTS idx_user_posts_user_id_timestamp
       ON user_posts (user_id, timestamp DESC)`,
      (err) => {
        if (err) {
          console.error("Failed to ensure user_posts index:", err.message);
        }
      }
    );
  });

  return dbInstance;
}

function getDatabase() {
  if (!dbInstance) {
    throw new Error("Database has not been initialized. Call initDatabase() first.");
  }
  return dbInstance;
}

async function saveUserPost(userId, category, message, type, messageId) {
  const sanitizedMessage = message || "(No caption)";
  const timestamp = Date.now();
  const db = getDatabase();

  const insertQuery = `
    INSERT INTO user_posts (user_id, category, message, type, timestamp, message_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const cleanupQuery = `
    DELETE FROM user_posts
    WHERE user_id = ?
      AND id NOT IN (
        SELECT id FROM user_posts
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 50
      )
  `;

  await new Promise((resolve, reject) => {
    db.run(insertQuery, [userId, category, sanitizedMessage, type, timestamp, messageId], (insertErr) => {
      if (insertErr) {
        console.error(`Failed to save post for user ${userId}:`, insertErr.message);
        return reject(insertErr);
      }

      db.run(cleanupQuery, [userId, userId], (cleanupErr) => {
        if (cleanupErr) {
          console.error(`Failed to clean up posts for user ${userId}:`, cleanupErr.message);
          return reject(cleanupErr);
        }

        resolve();
      });
    });
  });

  console.log(`💾 Post saved for user ${userId}.`);
}

function getUserPosts(userId, limit = 5) {
  const db = getDatabase();
  const query = `
    SELECT category, message, type, timestamp, message_id
    FROM user_posts
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  return new Promise((resolve, reject) => {
    db.all(query, [userId, limit], (err, rows) => {
      if (err) {
        console.error(`Failed to fetch posts for user ${userId}:`, err.message);
        return reject(err);
      }

      const posts = rows.map((row) => ({
        category: row.category,
        message: row.message,
        type: row.type,
        timestamp: new Date(row.timestamp),
        messageId: row.message_id,
      }));

      resolve(posts);
    });
  });
}

module.exports = {
  initDatabase,
  getDatabase,
  saveUserPost,
  getUserPosts,
  DATA_DIR,
  DB_PATH,
};

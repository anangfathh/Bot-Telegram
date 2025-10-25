const mysql = require("mysql2/promise");
const { DATABASE } = require("./config");

let pool;

async function initDatabase() {
  if (pool) {
    return pool;
  }

  try {
    const adminConnection = await mysql.createConnection({
      host: DATABASE.HOST,
      port: DATABASE.PORT,
      user: DATABASE.USER,
      password: DATABASE.PASSWORD,
      multipleStatements: true,
    });

    await adminConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DATABASE.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await adminConnection.end();

    pool = mysql.createPool({
      host: DATABASE.HOST,
      port: DATABASE.PORT,
      user: DATABASE.USER,
      password: DATABASE.PASSWORD,
      database: DATABASE.NAME,
      waitForConnections: true,
      connectionLimit: DATABASE.CONNECTION_LIMIT,
    });

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS user_posts (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        timestamp DATETIME NOT NULL,
        message_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_posts_user_id_timestamp (user_id, timestamp DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS drivers (
        user_id BIGINT PRIMARY KEY,
        username VARCHAR(64) NULL,
        full_name VARCHAR(255) NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        joined_at DATETIME NOT NULL,
        expires_at DATETIME NULL,
        last_payment_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_drivers_status_expires (status, expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    console.log("MySQL database connected");
    return pool;
  } catch (error) {
    console.error("Failed to initialize MySQL database:", error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error("Database has not been initialized. Call initDatabase() first.");
  }
  return pool;
}

async function saveUserPost(userId, category, message, type, messageId) {
  const sanitizedMessage = message || "(No caption)";
  const timestamp = new Date();
  const db = getPool();

  const insertQuery = `
    INSERT INTO user_posts (user_id, category, message, type, timestamp, message_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const cleanupQuery = `
    DELETE FROM user_posts
    WHERE user_id = ?
      AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM user_posts
          WHERE user_id = ?
          ORDER BY timestamp DESC
          LIMIT 50
        ) AS recent_posts
      )
  `;

  await db.execute(insertQuery, [userId, category, sanitizedMessage, type, timestamp, messageId]);
  await db.execute(cleanupQuery, [userId, userId]);
  console.log(`💾 Post saved for user ${userId}.`);
}

async function getUserPosts(userId, limit = 5) {
  const db = getPool();
  const query = `
    SELECT category, message, type, timestamp, message_id
    FROM user_posts
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  const [rows] = await db.execute(query, [userId, limit]);
  return rows.map((row) => ({
    category: row.category,
    message: row.message,
    type: row.type,
    timestamp: new Date(row.timestamp),
    messageId: row.message_id,
  }));
}

module.exports = {
  initDatabase,
  saveUserPost,
  getUserPosts,
  getPool,
};

const mysql = require("mysql2/promise");
const { DATABASE, POST_EXPIRATION } = require("./config");

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
        is_closed TINYINT(1) NOT NULL DEFAULT 0,
        closed_at DATETIME NULL,
        expires_at DATETIME NULL,
        last_edited_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_posts_user_id_timestamp (user_id, timestamp DESC),
        INDEX idx_user_posts_expires (is_closed, expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await ensureUserPostsSchema();

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

async function ensureUserPostsSchema() {
  const statements = [
    `ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS is_closed TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS closed_at DATETIME NULL`,
    `ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS expires_at DATETIME NULL`,
    `ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS last_edited_at DATETIME NULL`,
    `ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
    `ALTER TABLE user_posts ADD INDEX IF NOT EXISTS idx_user_posts_expires (is_closed, expires_at)`,
  ];

  for (const statement of statements) {
    try {
      await pool.execute(statement);
    } catch (error) {
      if (
        !["ER_DUP_FIELDNAME", "ER_CANT_DROP_FIELD_OR_KEY", "ER_DUP_KEYNAME", "ER_CANT_CREATE_TABLE"].includes(
          error.code
        )
      ) {
        throw error;
      }
    }
  }
}

function getPool() {
  if (!pool) {
    throw new Error("Database has not been initialized. Call initDatabase() first.");
  }
  return pool;
}

function resolveExpiration(category, baseDate) {
  const duration = POST_EXPIRATION[category];
  if (!duration) {
    return null;
  }
  return new Date(baseDate.getTime() + duration);
}

async function saveUserPost(userId, category, message, type, messageId) {
  const content = typeof message === "string" ? message : "";
  const timestamp = new Date();
  const expiresAt = resolveExpiration(category, timestamp);
  const db = getPool();

  const insertQuery = `
    INSERT INTO user_posts (user_id, category, message, type, timestamp, message_id, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
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

  await db.execute(insertQuery, [userId, category, content, type, timestamp, messageId, expiresAt]);
  await db.execute(cleanupQuery, [userId, userId]);
  console.log(`Post saved for user ${userId}.`);
}

async function getUserPosts(userId, limit = 5) {
  const db = getPool();
  const query = `
    SELECT id, category, message, type, timestamp, message_id, is_closed, expires_at
    FROM user_posts
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  const [rows] = await db.execute(query, [userId, limit]);
  return rows.map((row) => ({
    id: Number(row.id),
    category: row.category,
    message: row.message,
    type: row.type,
    timestamp: new Date(row.timestamp),
    messageId: row.message_id,
    isClosed: Boolean(row.is_closed),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  }));
}

async function getUserActivePosts(userId) {
  const db = getPool();
  const [rows] = await db.execute(
    `
      SELECT id, category, message, type, timestamp, message_id, expires_at
      FROM user_posts
      WHERE user_id = ? AND is_closed = 0
      ORDER BY timestamp DESC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: Number(row.id),
    category: row.category,
    message: row.message,
    type: row.type,
    timestamp: new Date(row.timestamp),
    messageId: row.message_id,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  }));
}

async function getPostById(postId) {
  const db = getPool();
  const [rows] = await db.execute(
    `
      SELECT id, user_id, category, message, type, timestamp, message_id, is_closed, closed_at, expires_at
      FROM user_posts
      WHERE id = ?
      LIMIT 1
    `,
    [postId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    category: row.category,
    message: row.message,
    type: row.type,
    timestamp: new Date(row.timestamp),
    messageId: row.message_id,
    isClosed: Boolean(row.is_closed),
    closedAt: row.closed_at ? new Date(row.closed_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  };
}

async function markPostClosed(postId, closedAt, updatedMessage = null) {
  const db = getPool();
  const values = [1, closedAt, closedAt, postId];
  let query = `
    UPDATE user_posts
    SET is_closed = ?, closed_at = ?, last_edited_at = ?, updated_at = CURRENT_TIMESTAMP
  `;

  if (typeof updatedMessage === "string") {
    query += `, message = ?`;
    values.splice(3, 0, updatedMessage);
  }

  query += ` WHERE id = ?`;

  await db.execute(query, values);
}

async function updatePostContent(postId, newMessage) {
  const db = getPool();
  await db.execute(
    `
      UPDATE user_posts
      SET message = ?, last_edited_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [newMessage, new Date(), postId]
  );
}

async function listExpiredPosts(referenceDate = new Date()) {
  const db = getPool();
  const [rows] = await db.execute(
    `
      SELECT id, user_id, category, message, type, timestamp, message_id, expires_at
      FROM user_posts
      WHERE is_closed = 0
        AND expires_at IS NOT NULL
        AND expires_at <= ?
      ORDER BY expires_at ASC
    `,
    [referenceDate]
  );

  return rows.map((row) => ({
    id: Number(row.id),
    userId: Number(row.user_id),
    category: row.category,
    message: row.message,
    type: row.type,
    timestamp: new Date(row.timestamp),
    messageId: row.message_id,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  }));
}

module.exports = {
  initDatabase,
  saveUserPost,
  getUserPosts,
  getUserActivePosts,
  getPostById,
  markPostClosed,
  updatePostContent,
  listExpiredPosts,
  getPool,
};

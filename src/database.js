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
      `CREATE TABLE IF NOT EXISTS users (
        user_id BIGINT PRIMARY KEY,
        username VARCHAR(64) NULL,
        first_name VARCHAR(255) NULL,
        last_name VARCHAR(255) NULL,
        full_name VARCHAR(255) NULL,
        last_seen_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_username (username),
        INDEX idx_users_full_name (full_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS user_ratings (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        target_user_id BIGINT NOT NULL,
        rated_by_user_id BIGINT NOT NULL,
        score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
        comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_rating_pair (target_user_id, rated_by_user_id),
        INDEX idx_user_ratings_target (target_user_id),
        CONSTRAINT fk_rating_target FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT fk_rating_author FOREIGN KEY (rated_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
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

async function upsertUserProfile({ userId, username, firstName, lastName, fullName }) {
  const db = getPool();
  const now = new Date();
  await db.execute(
    `INSERT INTO users (user_id, username, first_name, last_name, full_name, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       first_name = VALUES(first_name),
       last_name = VALUES(last_name),
       full_name = VALUES(full_name),
       last_seen_at = VALUES(last_seen_at),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, username || null, firstName || null, lastName || null, fullName || null, now]
  );
}

async function searchUsersByQuery(query) {
  const db = getPool();
  const cleaned = (query || "").trim().toLowerCase();
  if (!cleaned) {
    return [];
  }

  const normalized = cleaned.startsWith("@") ? cleaned.slice(1) : cleaned;
  const usernameVariants = new Set([normalized]);

  const params = Array.from(usernameVariants);
  const usernameConditions = params.map(() => "LOWER(REPLACE(username, '@', '')) = ?");

  const [rows] = await db.execute(
    `
      SELECT user_id, username, first_name, last_name, full_name, last_seen_at
      FROM users
      WHERE (${usernameConditions.join(" OR ")})
         OR (full_name IS NOT NULL AND LOWER(full_name) LIKE ?)
      ORDER BY last_seen_at DESC
      LIMIT 10
    `,
    [...params, `%${normalized}%`]
  );

  return rows.map((row) => ({
    userId: Number(row.user_id),
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
  }));
}

async function saveUserRating(targetUserId, ratedByUserId, score, comment) {
  const db = getPool();
  await db.execute(
    `
      INSERT INTO user_ratings (target_user_id, rated_by_user_id, score, comment)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        score = VALUES(score),
        comment = VALUES(comment),
        updated_at = CURRENT_TIMESTAMP
    `,
    [targetUserId, ratedByUserId, score, comment || null]
  );
}

async function getUserRatingSummary(targetUserId) {
  const db = getPool();
  const [[summary]] = await db.execute(
    `
      SELECT
        COUNT(*) AS total_ratings,
        AVG(score) AS average_score
      FROM user_ratings
      WHERE target_user_id = ?
    `,
    [targetUserId]
  );

  const [recentRows] = await db.execute(
    `
      SELECT rated_by_user_id, score, comment, updated_at
      FROM user_ratings
      WHERE target_user_id = ?
      ORDER BY updated_at DESC
      LIMIT 5
    `,
    [targetUserId]
  );

  return {
    total: Number(summary?.total_ratings || 0),
    average: summary?.average_score ? Number(summary.average_score) : null,
    recent: recentRows.map((row) => ({
      ratedByUserId: Number(row.rated_by_user_id),
      score: Number(row.score),
      comment: row.comment || null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    })),
  };
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
  upsertUserProfile,
  searchUsersByQuery,
  saveUserRating,
  getUserRatingSummary,
  getPool,
};

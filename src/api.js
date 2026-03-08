const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { getPool } = require("./database");
const { closePost } = require("./posts");
const { getEnvValue } = require("./env");
const { getRuntimeSettings, saveRuntimeSettings } = require("./settings");

const app = express();
const API_PORT = process.env.API_PORT || 3001;
let apiBot = null;

// Middleware
app.use(cors());
app.use(express.json());

const sessionTtlHours = Number(getEnvValue("ADMIN_SESSION_TTL_HOURS", 12));
const AUTH_CONFIG = {
  ADMIN_USERNAME: getEnvValue("ADMIN_USERNAME", "admin"),
  ADMIN_PASSWORD: getEnvValue("ADMIN_PASSWORD", "admin123"),
  SESSION_TTL_MS: (Number.isFinite(sessionTtlHours) && sessionTtlHours > 0 ? sessionTtlHours : 12) * 60 * 60 * 1000,
};
const adminSessions = new Map();

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== "string") {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(token);
    }
  }
}

function createAdminSession(username) {
  cleanupExpiredSessions();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + AUTH_CONFIG.SESSION_TTL_MS;

  adminSessions.set(token, {
    username,
    expiresAt,
  });

  return { token, expiresAt };
}

function isValidAdminCredential(inputUsername, inputPassword) {
  if (typeof inputUsername !== "string" || typeof inputPassword !== "string") {
    return false;
  }

  const expectedUsername = Buffer.from(AUTH_CONFIG.ADMIN_USERNAME);
  const expectedPassword = Buffer.from(AUTH_CONFIG.ADMIN_PASSWORD);
  const providedUsername = Buffer.from(inputUsername);
  const providedPassword = Buffer.from(inputPassword);

  if (expectedUsername.length !== providedUsername.length || expectedPassword.length !== providedPassword.length) {
    return false;
  }

  return (
    crypto.timingSafeEqual(expectedUsername, providedUsername) &&
    crypto.timingSafeEqual(expectedPassword, providedPassword)
  );
}

function requireAdminAuth(req, res, next) {
  if (req.path === "/auth/login") {
    return next();
  }

  cleanupExpiredSessions();

  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
  }

  req.admin = {
    token,
    username: session.username,
    expiresAt: session.expiresAt,
  };

  return next();
}

function setApiBot(bot) {
  apiBot = bot;
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// Auth Endpoints
// ========================================

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!isValidAdminCredential(username, password)) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    const { token, expiresAt } = createAdminSession(AUTH_CONFIG.ADMIN_USERNAME);

    return res.json({
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      user: {
        username: AUTH_CONFIG.ADMIN_USERNAME,
      },
    });
  } catch (error) {
    console.error("Error login admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api", requireAdminAuth);

app.post("/api/auth/logout", (req, res) => {
  adminSessions.delete(req.admin.token);
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  res.json({
    user: {
      username: req.admin.username,
    },
    expiresAt: new Date(req.admin.expiresAt).toISOString(),
  });
});

// ========================================
// Settings Endpoints
// ========================================

app.get("/api/settings", (_req, res) => {
  const settings = getRuntimeSettings();

  res.json({
    data: settings,
  });
});

app.put("/api/settings", async (req, res) => {
  try {
    const settings = await saveRuntimeSettings(req.body || {});
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      console.error("Error updating settings:", error);
    }

    res.status(statusCode).json({
      error: statusCode === 500 ? "Internal server error" : error.message,
    });
  }
});

// ========================================
// Users Endpoints
// ========================================

app.get("/api/users", async (req, res) => {
  try {
    const db = getPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    let query = `SELECT user_id, username, first_name, last_name, full_name, last_seen_at, created_at FROM users`;
    let countQuery = `SELECT COUNT(*) as total FROM users`;
    const params = [];
    const countParams = [];

    if (search) {
      const searchCondition = ` WHERE username LIKE ? OR full_name LIKE ? OR first_name LIKE ?`;
      query += searchCondition;
      countQuery += searchCondition;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY last_seen_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/search", async (req, res) => {
  try {
    const db = getPool();
    const q = (req.query.q || "").trim().toLowerCase();
    if (!q) {
      return res.json({ data: [] });
    }

    const [rows] = await db.query(
      `SELECT user_id, username, first_name, last_name, full_name, last_seen_at
       FROM users
       WHERE LOWER(username) LIKE ? OR LOWER(full_name) LIKE ?
       ORDER BY last_seen_at DESC
       LIMIT 10`,
      [`%${q}%`, `%${q}%`]
    );

    res.json({ data: rows });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/users/:userId", async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT user_id, username, first_name, last_name, full_name, last_seen_at, created_at
       FROM users WHERE user_id = ?`,
      [req.params.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ========================================
// Posts Endpoints
// ========================================

app.get("/api/posts", async (req, res) => {
  try {
    const db = getPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category || "";
    const status = req.query.status || "";

    let query = `SELECT p.*, u.username, u.full_name as user_full_name 
                 FROM user_posts p 
                 LEFT JOIN users u ON p.user_id = u.user_id`;
    let countQuery = `SELECT COUNT(*) as total FROM user_posts p`;
    const conditions = [];
    const params = [];
    const countParams = [];

    if (category) {
      conditions.push(`p.category = ?`);
      params.push(category);
      countParams.push(category);
    }

    if (status === "active") {
      conditions.push(`p.is_closed = 0`);
    } else if (status === "closed") {
      conditions.push(`p.is_closed = 1`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
      countQuery += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY p.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/posts/:postId", async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT p.*, u.username, u.full_name as user_full_name 
       FROM user_posts p 
       LEFT JOIN users u ON p.user_id = u.user_id
       WHERE p.id = ?`,
      [req.params.postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/posts/:postId", async (req, res) => {
  try {
    const db = getPool();
    const { message, is_closed } = req.body;
    const postId = req.params.postId;

    const closeRequested = is_closed === true || is_closed === 1 || is_closed === "1";
    if (closeRequested) {
      if (!apiBot) {
        return res.status(503).json({ error: "Telegram bot is not ready yet" });
      }

      await closePost(apiBot, postId);
      return res.json({ success: true });
    }

    const updates = [];
    const params = [];

    if (message !== undefined) {
      updates.push(`message = ?`);
      params.push(message);
    }

    if (is_closed !== undefined) {
      updates.push(`is_closed = ?`);
      params.push(is_closed ? 1 : 0);
      if (is_closed) {
        updates.push(`closed_at = NOW()`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(postId);

    await db.execute(`UPDATE user_posts SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/posts/:postId", async (req, res) => {
  try {
    const db = getPool();
    await db.execute(`DELETE FROM user_posts WHERE id = ?`, [req.params.postId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ========================================
// Ratings Endpoints
// ========================================

app.get("/api/ratings", async (req, res) => {
  try {
    const db = getPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT r.*, 
              tu.username as target_username, tu.full_name as target_full_name,
              ru.username as rater_username, ru.full_name as rater_full_name
       FROM user_ratings r
       LEFT JOIN users tu ON r.target_user_id = tu.user_id
       LEFT JOIN users ru ON r.rated_by_user_id = ru.user_id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM user_ratings`);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/ratings/user/:userId", async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT r.*, ru.username as rater_username, ru.full_name as rater_full_name
       FROM user_ratings r
       LEFT JOIN users ru ON r.rated_by_user_id = ru.user_id
       WHERE r.target_user_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );

    const [[summary]] = await db.execute(
      `SELECT COUNT(*) as total_ratings, AVG(score) as average_score
       FROM user_ratings WHERE target_user_id = ?`,
      [req.params.userId]
    );

    res.json({
      data: rows,
      summary: {
        total: summary.total_ratings,
        average: summary.average_score ? parseFloat(summary.average_score).toFixed(2) : null,
      },
    });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ========================================
// Drivers Endpoints
// ========================================

app.get("/api/drivers", async (req, res) => {
  try {
    const db = getPool();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || "";

    let query = `SELECT * FROM drivers`;
    let countQuery = `SELECT COUNT(*) as total FROM drivers`;
    const params = [];
    const countParams = [];

    if (status) {
      query += ` WHERE status = ?`;
      countQuery += ` WHERE status = ?`;
      params.push(status);
      countParams.push(status);
    }

    query += ` ORDER BY joined_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/drivers/:userId", async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.execute(`SELECT * FROM drivers WHERE user_id = ?`, [req.params.userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/drivers", async (req, res) => {
  try {
    const db = getPool();
    const { user_id, username, nim, full_name, phone_number, duration_days } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }
    if (!nim) {
      return res.status(400).json({ error: "nim is required" });
    }
    if (!full_name) {
      return res.status(400).json({ error: "full_name is required" });
    }
    if (!phone_number) {
      return res.status(400).json({ error: "phone_number is required" });
    }

    const now = new Date();
    const days = parseInt(duration_days) || 30;
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await db.execute(
      `INSERT INTO drivers (user_id, username, nim, full_name, phone_number, status, joined_at, expires_at, last_payment_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         nim = VALUES(nim),
         full_name = VALUES(full_name),
         phone_number = VALUES(phone_number),
         status = 'active',
         expires_at = VALUES(expires_at),
         last_payment_at = VALUES(last_payment_at)`,
      [user_id, username || null, nim || null, full_name || null, phone_number || null, now, expiresAt, now]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/drivers/:userId", async (req, res) => {
  try {
    const db = getPool();
    const { username, nim, full_name, phone_number, status, extend_days } = req.body;
    const userId = req.params.userId;

    const updates = [];
    const params = [];

    if (username !== undefined) {
      updates.push(`username = ?`);
      params.push(username);
    }

    if (nim !== undefined) {
      updates.push(`nim = ?`);
      params.push(nim);
    }

    if (full_name !== undefined) {
      updates.push(`full_name = ?`);
      params.push(full_name);
    }

    if (phone_number !== undefined) {
      updates.push(`phone_number = ?`);
      params.push(phone_number);
    }

    if (status !== undefined) {
      updates.push(`status = ?`);
      params.push(status);
    }

    if (extend_days) {
      const days = parseInt(extend_days);
      updates.push(`expires_at = DATE_ADD(GREATEST(expires_at, NOW()), INTERVAL ? DAY)`);
      updates.push(`last_payment_at = NOW()`);
      params.push(days);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(userId);

    await db.execute(`UPDATE drivers SET ${updates.join(", ")} WHERE user_id = ?`, params);

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/drivers/:userId", async (req, res) => {
  try {
    const db = getPool();
    await db.execute(`DELETE FROM drivers WHERE user_id = ?`, [req.params.userId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ========================================
// Dashboard Stats Endpoint
// ========================================

app.get("/api/stats", async (req, res) => {
  try {
    const db = getPool();

    const [[usersCount]] = await db.execute(`SELECT COUNT(*) as count FROM users`);
    const [[postsCount]] = await db.execute(`SELECT COUNT(*) as count FROM user_posts`);
    const [[activePostsCount]] = await db.execute(`SELECT COUNT(*) as count FROM user_posts WHERE is_closed = 0`);
    const [[driversCount]] = await db.execute(`SELECT COUNT(*) as count FROM drivers`);
    const [[activeDriversCount]] = await db.execute(
      `SELECT COUNT(*) as count FROM drivers WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`
    );
    const [[ratingsCount]] = await db.execute(`SELECT COUNT(*) as count FROM user_ratings`);

    res.json({
      users: usersCount.count,
      posts: {
        total: postsCount.count,
        active: activePostsCount.count,
      },
      drivers: {
        total: driversCount.count,
        active: activeDriversCount.count,
      },
      ratings: ratingsCount.count,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start API server function
function startApiServer() {
  return new Promise((resolve) => {
    const server = app.listen(API_PORT, () => {
      console.log(`🚀 API Server running on http://localhost:${API_PORT}`);
      resolve(server);
    });
  });
}

module.exports = { startApiServer, setApiBot };

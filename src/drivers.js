const { CONFIG } = require("./config");
const { getPool } = require("./database");

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function computeExpiry(baseDate, durationDays) {
  return new Date(baseDate.getTime() + durationDays * MS_IN_DAY);
}

function normalizeUsername(username) {
  if (!username) return null;
  return username.startsWith("@") ? username : `@${username}`;
}

async function ensureDriverGroupAccess(bot, userId) {
  if (!CONFIG.DRIVER_GROUP_ID) {
    return;
  }
  try {
    await bot.unbanChatMember(CONFIG.DRIVER_GROUP_ID, userId);
  } catch (error) {
    console.error(`Failed to unban user ${userId} in driver group:`, error.message);
  }
}

async function sendDriverActivationMessage(bot, userId, driver, silentNotify) {
  if (silentNotify) {
    return;
  }

  const lines = [
    "Halo, status Anda telah diperbarui sebagai driver aktif.",
    `Masa berlaku keanggotaan sampai: ${driver.expiresAt ? driver.expiresAt.toLocaleString("id-ID") : "Tidak ditentukan"}.`,
  ];

  if (CONFIG.DRIVER_GROUP_INVITE_LINK) {
    lines.push("Silakan bergabung ke Group Driver melalui tombol di bawah ini.");
  }

  try {
    await bot.sendMessage(userId, lines.join("\n"), {
      reply_markup: CONFIG.DRIVER_GROUP_INVITE_LINK
        ? {
            inline_keyboard: [[{ text: "Gabung Group Driver", url: CONFIG.DRIVER_GROUP_INVITE_LINK }]],
          }
        : undefined,
    });
  } catch (error) {
    console.error(`Failed to send driver notification to ${userId}:`, error.message);
  }
}

async function fetchDriver(userId) {
  const db = getPool();
  const [rows] = await db.execute(
    `SELECT user_id, username, full_name, status, joined_at, expires_at, last_payment_at
     FROM drivers
     WHERE user_id = ?`,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const driver = rows[0];
  return {
    userId: Number(driver.user_id),
    username: driver.username,
    fullName: driver.full_name,
    status: driver.status,
    joinedAt: driver.joined_at ? new Date(driver.joined_at) : null,
    expiresAt: driver.expires_at ? new Date(driver.expires_at) : null,
    lastPaymentAt: driver.last_payment_at ? new Date(driver.last_payment_at) : null,
  };
}

function isExpired(driver, referenceDate = new Date()) {
  if (!driver || !driver.expiresAt) {
    return false;
  }
  return driver.expiresAt.getTime() <= referenceDate.getTime();
}

async function isDriverActive(userId, referenceDate = new Date()) {
  const driver = await fetchDriver(userId);
  if (!driver) {
    return false;
  }
  if (driver.status !== "active") {
    return false;
  }
  return !isExpired(driver, referenceDate);
}

async function upsertDriverRecord(userId, username, fullName, expiresAt, lastPaymentAt, now) {
  const db = getPool();
  const [rows] = await db.execute("SELECT status FROM drivers WHERE user_id = ?", [userId]);

  if (rows.length === 0) {
    await db.execute(
      `INSERT INTO drivers (user_id, username, full_name, status, joined_at, expires_at, last_payment_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?)`,
      [userId, username, fullName, now, expiresAt, lastPaymentAt]
    );
  } else {
    await db.execute(
      `UPDATE drivers
       SET username = ?, full_name = ?, status = 'active', expires_at = ?, last_payment_at = ?, joined_at = IF(status = 'inactive', ?, joined_at)
       WHERE user_id = ?`,
      [username, fullName, expiresAt, lastPaymentAt, now, userId]
    );
  }
}

async function registerDriver(bot, userId, options = {}) {
  const now = new Date();
  const durationDays = Number(options.durationDays || CONFIG.DRIVER_DEFAULT_ACTIVE_DAYS || 30);
  const expiresAt = options.expiresAt
    ? new Date(options.expiresAt)
    : computeExpiry(now, Number.isNaN(durationDays) || durationDays <= 0 ? 30 : durationDays);
  const lastPaymentAt = options.lastPaymentAt ? new Date(options.lastPaymentAt) : now;
  const username = normalizeUsername(options.username);
  const fullName = options.fullName || null;

  await upsertDriverRecord(userId, username, fullName, expiresAt, lastPaymentAt, now);

  const driver = await fetchDriver(userId);

  if (!options.skipGroup) {
    await ensureDriverGroupAccess(bot, userId);
  }

  await sendDriverActivationMessage(bot, userId, driver, options.silentNotify);

  return driver;
}

async function renewDriver(bot, userId, options = {}) {
  const driver = await fetchDriver(userId);
  if (!driver) {
    throw new Error("Driver tidak ditemukan.");
  }

  const now = new Date();
  const durationDays = Number(options.durationDays || CONFIG.DRIVER_DEFAULT_ACTIVE_DAYS || 30);
  const baseDate = driver.expiresAt && driver.expiresAt.getTime() > now.getTime() ? driver.expiresAt : now;
  const expiresAt = options.expiresAt
    ? new Date(options.expiresAt)
    : computeExpiry(baseDate, Number.isNaN(durationDays) || durationDays <= 0 ? 30 : durationDays);
  const lastPaymentAt = options.lastPaymentAt ? new Date(options.lastPaymentAt) : now;
  const db = getPool();

  await db.execute(
    `UPDATE drivers
     SET status = 'active', expires_at = ?, last_payment_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [expiresAt, lastPaymentAt, userId]
  );

  const updatedDriver = await fetchDriver(userId);

  if (!options.skipGroup) {
    await ensureDriverGroupAccess(bot, userId);
  }

  await sendDriverActivationMessage(bot, userId, updatedDriver, options.silentNotify);

  return updatedDriver;
}

async function removeDriver(bot, userId, options = {}) {
  const driver = await fetchDriver(userId);
  const db = getPool();
  await db.execute(`DELETE FROM drivers WHERE user_id = ?`, [userId]);

  if (CONFIG.DRIVER_GROUP_ID) {
    try {
      await bot.banChatMember(CONFIG.DRIVER_GROUP_ID, userId, { until_date: Math.floor(Date.now() / 1000) + 60 });
      await bot.unbanChatMember(CONFIG.DRIVER_GROUP_ID, userId);
    } catch (error) {
      console.error(`Failed to remove user ${userId} from driver group:`, error.message);
    }
  }

  if (!options.silentNotify && driver) {
    const reason =
      options.reason === "expired"
        ? "Masa berlaku driver Anda telah habis. Silakan hubungi admin untuk memperpanjang."
        : "Status driver Anda telah dinonaktifkan oleh admin.";

    try {
      await bot.sendMessage(userId, reason);
    } catch (error) {
      console.error(`Failed to send driver removal notice to ${userId}:`, error.message);
    }
  }

  return driver;
}

async function ensureDriverActive(bot, userId, options = {}) {
  const driver = await fetchDriver(userId);
  if (!driver) {
    return { ok: false, reason: "not_registered" };
  }

  if (driver.status !== "active") {
    return { ok: false, reason: "inactive", driver };
  }

  if (isExpired(driver, options.referenceDate)) {
    await removeDriver(bot, userId, { reason: "expired", silentNotify: true });
    return { ok: false, reason: "expired" };
  }

  return { ok: true, driver };
}

async function purgeExpiredDrivers(bot, referenceDate = new Date()) {
  const db = getPool();
  const [rows] = await db.execute(
    `SELECT user_id FROM drivers
     WHERE status = 'active'
       AND expires_at IS NOT NULL
       AND expires_at <= ?`,
    [referenceDate]
  );

  const removed = [];
  for (const row of rows) {
    await removeDriver(bot, Number(row.user_id), { reason: "expired" });
    removed.push(Number(row.user_id));
  }

  return removed;
}

module.exports = {
  fetchDriver,
  isDriverActive,
  ensureDriverActive,
  registerDriver,
  renewDriver,
  removeDriver,
  purgeExpiredDrivers,
};

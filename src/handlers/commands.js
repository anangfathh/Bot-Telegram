const { buildMainMenuKeyboard, buildMagerMenuKeyboard, buildDriverMenuKeyboard } = require("../keyboards");
const { getWelcomeMessage, getHelpMessage, getDriverMenuMessage } = require("../messages");
const { CONFIG } = require("../config");
const { sendJoinChannelMessage } = require("../telegram");
const { waitingForForward } = require("../state");
const { isUserMemberOfChannel } = require("../membership");
const { isDriverActive, registerDriver, removeDriver, renewDriver, purgeExpiredDrivers } = require("../drivers");

async function setBotCommands(bot) {
  const commands = [
    { command: "start", description: "Start the bot and start to make a post" },
    { command: "mager", description: "Post #anjem #jastip #openanjem #openjastip" },
    { command: "help", description: "Show help and tutorial" },
    { command: "driver", description: "Menu pendaftaran dan status driver" },
  ];

  try {
    await bot.setMyCommands(commands);
    console.log("✅ Bot commands menu set successfully!");
  } catch (err) {
    console.error("⚠️ Failed to set bot commands:", err.message);
  }
}

function registerCommandHandlers(bot) {
  const isDriverAdminUser = (userId) => CONFIG.DRIVER_ADMIN_IDS.includes(userId);

  const formatDateTime = (date) =>
    date
      ? date.toLocaleString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const resolveTargetUserId = (msg, explicit) => {
    if (explicit) {
      const parsed = Number(explicit);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    if (msg.reply_to_message?.from?.id) {
      return msg.reply_to_message.from.id;
    }

    return null;
  };

  const parseArgs = (input) => (input ? input.trim().split(/\s+/).filter(Boolean) : []);

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";

    const isMember = await isUserMemberOfChannel(bot, userId);
    const welcomeText = getWelcomeMessage(firstName, isMember);

    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: "HTML",
      reply_markup: buildMainMenuKeyboard(),
    });
  });

  bot.onText(/\/mager/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const isMember = await isUserMemberOfChannel(bot, userId);

    if (!isMember) {
      await sendJoinChannelMessage(bot, chatId);
      return;
    }

    await bot.sendMessage(chatId, "🚦 Select mager", {
      reply_markup: buildMagerMenuKeyboard(false),
    });
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, getHelpMessage(), {
      parse_mode: "HTML",
    });
  });

  bot.onText(/#anjem\b/i, (msg) => {
    const chatId = msg.chat.id;
    waitingForForward.set(chatId, true);
    bot.sendMessage(chatId, "Tag #anjem diterima ✅. Silakan kirim pesan yang ingin diposting ke channel.");
  });

  bot.onText(/^\/driver(?:@\w+)?$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const driverActive = await isDriverActive(userId);
    const message = getDriverMenuMessage(driverActive, CONFIG.DRIVER_CONTACT_USERNAME || "hubungi admin");

    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: buildDriverMenuKeyboard(driverActive, isDriverAdminUser(userId)),
    });
  });

  bot.onText(/^\/driver_add(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isDriverAdminUser(msg.from.id)) {
      await bot.sendMessage(chatId, "Anda tidak memiliki akses ke perintah ini.");
      return;
    }

    const args = parseArgs(match[1]);
    const targetUserId = resolveTargetUserId(msg, args[0]);
    const durationDays = args[1] ? Number(args[1]) : undefined;

    if (!targetUserId) {
      await bot.sendMessage(chatId, "Gunakan format: /driver_add <telegram_user_id> [durasi_hari]");
      return;
    }

    let chatInfo = null;
    try {
      chatInfo = await bot.getChat(targetUserId);
    } catch (error) {
      console.warn("Failed to fetch chat info for driver_add:", error.message);
    }

    const username = chatInfo?.username ? `@${chatInfo.username}` : undefined;
    const fullName = chatInfo
      ? [chatInfo.first_name, chatInfo.last_name].filter(Boolean).join(" ").trim() || undefined
      : undefined;

    try {
      const driver = await registerDriver(bot, targetUserId, {
        username,
        fullName,
        durationDays: Number.isNaN(durationDays) ? undefined : durationDays,
      });

      await bot.sendMessage(
        chatId,
        [
          "Driver berhasil ditambahkan/diaktivasi.",
          `ID: ${targetUserId}`,
          `Nama: ${driver.fullName || fullName || "-"}`,
          `Username: ${driver.username || username || "-"}`,
          `Berlaku sampai: ${formatDateTime(driver.expiresAt)}`,
        ].join("\n"),
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("driver_add failed:", error);
      await bot.sendMessage(chatId, `Gagal menambahkan driver: ${error.message}`);
    }
  });

  bot.onText(/^\/driver_remove(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isDriverAdminUser(msg.from.id)) {
      await bot.sendMessage(chatId, "Anda tidak memiliki akses ke perintah ini.");
      return;
    }

    const args = parseArgs(match[1]);
    const targetUserId = resolveTargetUserId(msg, args[0]);

    if (!targetUserId) {
      await bot.sendMessage(chatId, "Gunakan format: /driver_remove <telegram_user_id>");
      return;
    }

    try {
      const driver = await removeDriver(bot, targetUserId, { reason: "manual" });
      if (!driver) {
        await bot.sendMessage(chatId, "Driver tidak ditemukan atau sudah non-aktif.");
        return;
      }

      await bot.sendMessage(
        chatId,
        [
          "Driver berhasil dinonaktifkan.",
          `ID: ${targetUserId}`,
          `Nama: ${driver.fullName || "-"}`,
          `Username: ${driver.username || "-"}`,
        ].join("\n"),
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("driver_remove failed:", error);
      await bot.sendMessage(chatId, `Gagal menonaktifkan driver: ${error.message}`);
    }
  });

  bot.onText(/^\/driver_renew(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isDriverAdminUser(msg.from.id)) {
      await bot.sendMessage(chatId, "Anda tidak memiliki akses ke perintah ini.");
      return;
    }

    const args = parseArgs(match[1]);
    const targetUserId = resolveTargetUserId(msg, args[0]);
    const durationDays = args[1] ? Number(args[1]) : undefined;

    if (!targetUserId) {
      await bot.sendMessage(chatId, "Gunakan format: /driver_renew <telegram_user_id> [durasi_hari]");
      return;
    }

    try {
      const driver = await renewDriver(bot, targetUserId, {
        durationDays: Number.isNaN(durationDays) ? undefined : durationDays,
      });

      await bot.sendMessage(
        chatId,
        [
          "Driver berhasil diperpanjang.",
          `ID: ${targetUserId}`,
          `Berlaku sampai: ${formatDateTime(driver.expiresAt)}`,
        ].join("\n"),
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("driver_renew failed:", error);
      await bot.sendMessage(chatId, `Gagal memperpanjang driver: ${error.message}`);
    }
  });

  bot.onText(/^\/driver_purge(?:@\w+)?$/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isDriverAdminUser(msg.from.id)) {
      await bot.sendMessage(chatId, "Anda tidak memiliki akses ke perintah ini.");
      return;
    }

    try {
      const removed = await purgeExpiredDrivers(bot);
      await bot.sendMessage(
        chatId,
        removed.length === 0
          ? "Tidak ada driver yang kedaluwarsa."
          : `Driver kedaluwarsa yang dihapus: ${removed.join(", ")}`
      );
    } catch (error) {
      console.error("driver_purge failed:", error);
      await bot.sendMessage(chatId, `Gagal menjalankan purge driver: ${error.message}`);
    }
  });
}

module.exports = {
  setBotCommands,
  registerCommandHandlers,
};

const { buildMainMenuKeyboard, buildMagerMenuKeyboard, buildDriverMenuKeyboard } = require("../keyboards");
const { getWelcomeMessage, getHelpMessage, getDriverMenuMessage } = require("../messages");
const { CONFIG } = require("../config");
const { sendJoinChannelMessage } = require("../telegram");
const { waitingForForward } = require("../state");
const { isUserMemberOfChannel } = require("../membership");
const { isDriverActive, registerDriver, removeDriver, renewDriver, purgeExpiredDrivers } = require("../drivers");
const { upsertUserProfile } = require("../database");
const { getRuntimeSettings } = require("../settings");

async function setBotCommands(bot) {
  const commands = [
    { command: "start", description: "Start the bot and start to make a post" },
    { command: "go", description: "Post #anjem #jastip #openanjem #openjastip" },
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
  const getDriverContactUsernames = () => getRuntimeSettings().driverContactUsernames;

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

  const parseDriverAddInput = (input) => {
    const payload = (input || "").trim();
    if (!payload) {
      return {
        ok: false,
        message: "Gunakan format: /driver_add user_id|nim|nama_lengkap|nomor_hp|durasi_hari",
      };
    }

    const parts = payload.split("|").map((part) => part.trim());
    if (parts.length < 4) {
      return {
        ok: false,
        message: "Format tidak valid. Gunakan: user_id|nim|nama_lengkap|nomor_hp|durasi_hari",
      };
    }

    const targetUserId = Number(parts[0]);
    if (!parts[0] || Number.isNaN(targetUserId)) {
      return {
        ok: false,
        message: "User ID tidak valid. Contoh: 8375046442",
      };
    }

    const nim = parts[1];
    const fullName = parts[2];
    const phoneNumber = parts[3];

    if (!nim || !fullName || !phoneNumber) {
      return {
        ok: false,
        message: "NIM, nama lengkap, dan nomor HP wajib diisi.",
      };
    }

    let durationDays;
    if (parts[4]) {
      durationDays = Number(parts[4]);
      if (Number.isNaN(durationDays) || durationDays <= 0) {
        return {
          ok: false,
          message: "Durasi harus angka hari yang valid. Contoh: 30",
        };
      }
    }

    return {
      ok: true,
      targetUserId,
      nim,
      fullName,
      phoneNumber,
      durationDays,
    };
  };

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";

    try {
      await upsertUserProfile({
        userId,
        username: msg.from.username ? `@${msg.from.username}` : null,
        firstName: msg.from.first_name || null,
        lastName: msg.from.last_name || null,
        fullName: [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") || null,
      });
    } catch (error) {
      console.error("Failed to upsert user profile:", error);
    }

    const isMember = await isUserMemberOfChannel(bot, userId);
    const welcomeText = getWelcomeMessage(firstName, isMember);

    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: "HTML",
      reply_markup: buildMainMenuKeyboard(),
    });
  });

  bot.onText(/\/go/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const isMember = await isUserMemberOfChannel(bot, userId);

    if (!isMember) {
      await sendJoinChannelMessage(bot, chatId);
      return;
    }

    await bot.sendMessage(chatId, "🚦 Select Option", {
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
    const message = getDriverMenuMessage(driverActive, getDriverContactUsernames());

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

    const parsedInput = parseDriverAddInput(match[1]);
    if (!parsedInput.ok) {
      await bot.sendMessage(chatId, parsedInput.message);
      return;
    }

    const { targetUserId, nim, fullName, phoneNumber, durationDays } = parsedInput;

    let chatInfo = null;
    try {
      chatInfo = await bot.getChat(targetUserId);
    } catch (error) {
      console.warn("Failed to fetch chat info for driver_add:", error.message);
    }

    const username = chatInfo?.username ? `@${chatInfo.username}` : undefined;

    try {
      const driver = await registerDriver(bot, targetUserId, {
        username,
        nim,
        fullName,
        phoneNumber,
        durationDays,
      });

      await bot.sendMessage(
        chatId,
        [
          "Driver berhasil ditambahkan/diaktivasi.",
          `ID: ${targetUserId}`,
          `NIM: ${driver.nim || nim || "-"}`,
          `Nama: ${driver.fullName || fullName || "-"}`,
          `No. HP: ${driver.phoneNumber || phoneNumber || "-"}`,
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

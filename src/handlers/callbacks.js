const { CONFIG, STATES, CALLBACK_DATA, CATEGORIES } = require("../config");
const {
  buildMainMenuKeyboard,
  buildMagerMenuKeyboard,
  buildCategoryKeyboard,
  buildDriverMenuKeyboard,
} = require("../keyboards");
const {
  getWelcomeMessage,
  getCategoryInfoMessage,
  getMyMagersMessage,
  getDriverMenuMessage,
  getDriverContactMessage,
  getDriverStatusMessage,
} = require("../messages");
const { sendJoinChannelMessage } = require("../telegram");
const { setUserState, clearUserState } = require("../state");
const { isUserMemberOfChannel } = require("../membership");
const { ensureDriverActive, isDriverActive, fetchDriver } = require("../drivers");

function registerCallbackHandlers(bot) {
  const isDriverAdminUser = (userId) => CONFIG.DRIVER_ADMIN_IDS.includes(userId);
  const driverContactUsername = CONFIG.DRIVER_CONTACT_USERNAME || "hubungi admin";
  const driverContactUrl = CONFIG.DRIVER_CONTACT_USERNAME
    ? `https://t.me/${CONFIG.DRIVER_CONTACT_USERNAME.replace("@", "")}`
    : null;

  async function handleCheckMembership(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    const isMember = await isUserMemberOfChannel(bot, userId);

    if (isMember) {
      await bot.answerCallbackQuery(query.id, {
        text: "✅ Terverifikasi! Anda sudah join channel.",
        show_alert: true,
      });

      await bot.deleteMessage(chatId, messageId).catch(() => {});
      await bot.sendMessage(chatId, "🚦 Select mager", {
        reply_markup: buildMagerMenuKeyboard(true),
      });
    } else {
      await bot.answerCallbackQuery(query.id, {
        text: "❌ Anda belum join channel. Silakan join terlebih dahulu!",
        show_alert: true,
      });
    }
  }

  async function handleMenuMager(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    const isMember = await isUserMemberOfChannel(bot, userId);

    if (!isMember) {
      await bot.answerCallbackQuery(query.id);
      await bot.deleteMessage(chatId, messageId).catch(() => {});
      await sendJoinChannelMessage(bot, chatId);
      return;
    }

    await bot.editMessageText("🚦 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: buildMagerMenuKeyboard(true),
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleBackToMain(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const firstName = query.from.first_name || "User";

    const welcomeText = getWelcomeMessage(firstName, true);

    await bot.editMessageText(welcomeText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: buildMainMenuKeyboard(),
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handlePostMager(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await bot.editMessageText("🚦 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: buildCategoryKeyboard(),
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleDriverAccessDenied(query, reason) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    const alertMessage =
      reason === "expired"
        ? "Masa berlaku driver Anda telah habis. Hubungi admin untuk memperpanjang."
        : "Menu ini hanya dapat diakses oleh driver aktif.";

    await bot.answerCallbackQuery(query.id, {
      text: alertMessage,
      show_alert: true,
    });

    const isAdmin = isDriverAdminUser(query.from.id);

    await bot.editMessageText(getDriverMenuMessage(false, driverContactUsername), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: buildDriverMenuKeyboard(false, isAdmin),
    });
  }

  async function handleCategorySelection(query, category, requiresDriver = false) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    if (requiresDriver) {
      const check = await ensureDriverActive(bot, query.from.id);
      if (!check.ok) {
        await handleDriverAccessDenied(query, check.reason);
        return;
      }
    }

    setUserState(chatId, STATES.WAITING_MESSAGE, category);

    await bot.editMessageText(getCategoryInfoMessage(category), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 back", callback_data: CALLBACK_DATA.POST_MAGER }]],
      },
      parse_mode: "HTML",
    });

    await bot.answerCallbackQuery(query.id, { text: "Silakan kirim pesan Anda..." });
  }

  async function handleBackToMager(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    clearUserState(chatId);

    await bot.editMessageText("🚦 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: buildMagerMenuKeyboard(true),
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleCloseMenu(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    await bot.deleteMessage(chatId, messageId).catch(() => {});
    await bot.answerCallbackQuery(query.id, { text: "Menu ditutup" });
    clearUserState(chatId);
  }

  async function handleMyMagers(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const messageId = query.message.message_id;

    await bot.answerCallbackQuery(query.id, { text: "Memuat riwayat...", show_alert: false }).catch(() => {});

    await bot.editMessageText("⌛ Memuat riwayat posting...", {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
    });

    let myMagersText;
    try {
      myMagersText = await getMyMagersMessage(userId);
    } catch (error) {
      console.error("Failed to load My Magers history:", error);
      await bot.editMessageText("⚠️ Gagal memuat riwayat posting. Silakan coba lagi.", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: buildMagerMenuKeyboard(true),
      });
      return;
    }

    await bot.editMessageText(myMagersText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔗 Lihat di Channel", url: `https://t.me/${CONFIG.CHANNEL_USERNAME.replace("@", "")}` }],
          [{ text: "🔙 Back to Menu", callback_data: CALLBACK_DATA.BACK_TO_MAGER }],
        ],
      },
    });
  }

  async function handleDriverMenu(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;

    const isActive = await isDriverActive(userId);
    const isAdmin = isDriverAdminUser(userId);
    const message = getDriverMenuMessage(isActive, driverContactUsername);

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: buildDriverMenuKeyboard(isActive, isAdmin),
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleDriverAdd(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (!isDriverAdminUser(userId)) {
      await bot.answerCallbackQuery(query.id, {
        text: "Menu ini khusus admin driver.",
        show_alert: true,
      });
      return;
    }

    setUserState(chatId, STATES.AWAITING_DRIVER_INPUT, { action: "driver_add" });

    await bot.answerCallbackQuery(query.id, {
      text: "Silakan kirim data driver.",
      show_alert: false,
    });

    await bot.sendMessage(
      chatId,
      [
        "🧑‍✈️ <b>Tambah Driver</b>",
        "",
        "Kirim user ID dan durasi (opsional) dengan format:",
        "<code>8375046442 30</code>",
        "",
        "• Tanpa durasi → pakai default.",
        "• Ketik <b>BATAL</b> untuk membatalkan.",
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  async function handleDriverRenew(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (!isDriverAdminUser(userId)) {
      await bot.answerCallbackQuery(query.id, {
        text: "Menu ini khusus admin driver.",
        show_alert: true,
      });
      return;
    }

    setUserState(chatId, STATES.AWAITING_DRIVER_INPUT, { action: "driver_renew" });

    await bot.answerCallbackQuery(query.id, {
      text: "Masukkan ID driver yang diperpanjang.",
      show_alert: false,
    });

    await bot.sendMessage(
      chatId,
      [
        "♻️ <b>Perpanjang Driver</b>",
        "",
        "Kirim user ID dan durasi (opsional) dengan format:",
        "<code>8375046442 30</code>",
        "",
        "• Jika durasi kosong → pakai default.",
        "• Ketik <b>BATAL</b> untuk membatalkan.",
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  async function handleDriverRemove(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (!isDriverAdminUser(userId)) {
      await bot.answerCallbackQuery(query.id, {
        text: "Menu ini khusus admin driver.",
        show_alert: true,
      });
      return;
    }

    setUserState(chatId, STATES.AWAITING_DRIVER_INPUT, { action: "driver_remove" });

    await bot.answerCallbackQuery(query.id, {
      text: "Masukkan ID driver yang akan dihapus.",
      show_alert: false,
    });

    await bot.sendMessage(
      chatId,
      [
        "🗑️ <b>Hapus Driver</b>",
        "",
        "Kirim user ID driver yang akan dinonaktifkan:",
        "<code>8375046442</code>",
        "",
        "• Pastikan ID benar sebelum menghapus.",
        "• Ketik <b>BATAL</b> untuk membatalkan.",
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  async function handleDriverContact(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    const message = getDriverContactMessage(driverContactUsername);
    const inlineKeyboard = [];

    if (driverContactUrl) {
      inlineKeyboard.push([{ text: "💬 Chat Admin", url: driverContactUrl }]);
    }

    inlineKeyboard.push([{ text: "🔙 Kembali", callback_data: CALLBACK_DATA.DRIVER_MENU }]);

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: inlineKeyboard },
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleDriverStatus(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;

    const status = await ensureDriverActive(bot, userId);
    let driver = status.ok ? status.driver : await fetchDriver(userId);

    // If ensureDriverActive removed the record (expired), fetchDriver will return null.
    const message = getDriverStatusMessage(driver, driverContactUsername);

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 Kembali", callback_data: CALLBACK_DATA.DRIVER_MENU }]],
      },
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleFeatureNotAvailable(query) {
    await bot.answerCallbackQuery(query.id, {
      text: "Fitur ini belum tersedia",
      show_alert: true,
    });
  }

  bot.on("callback_query", async (query) => {
    const data = query.data;

    try {
      switch (data) {
        case CALLBACK_DATA.CHECK_MEMBERSHIP:
          await handleCheckMembership(query);
          break;

        case CALLBACK_DATA.MENU_MAGER:
          await handleMenuMager(query);
          break;

        case CALLBACK_DATA.BACK_TO_MAIN:
          await handleBackToMain(query);
          break;

        case CALLBACK_DATA.POST_MAGER:
          await handlePostMager(query);
          break;

        case CALLBACK_DATA.CATEGORY_ANJEM:
          await handleCategorySelection(query, CATEGORIES.ANJEM);
          break;

        case CALLBACK_DATA.CATEGORY_JASTIP:
          await handleCategorySelection(query, CATEGORIES.JASTIP);
          break;

        case CALLBACK_DATA.CATEGORY_OPENANJEM:
          await handleCategorySelection(query, CATEGORIES.OPENANJEM, true);
          break;

        case CALLBACK_DATA.CATEGORY_OPENJASTIP:
          await handleCategorySelection(query, CATEGORIES.OPENJASTIP, true);
          break;

        case CALLBACK_DATA.BACK_TO_MAGER:
          await handleBackToMager(query);
          break;

        case CALLBACK_DATA.CLOSE_MENU:
          await handleCloseMenu(query);
          break;

        case CALLBACK_DATA.MY_MAGERS:
          await handleMyMagers(query);
          break;

        case CALLBACK_DATA.DRIVER_MENU:
          await handleDriverMenu(query);
          break;

        case CALLBACK_DATA.DRIVER_CONTACT:
          await handleDriverContact(query);
          break;

        case CALLBACK_DATA.DRIVER_STATUS:
          await handleDriverStatus(query);
          break;
        case CALLBACK_DATA.DRIVER_ADD:
          await handleDriverAdd(query);
          break;
        case CALLBACK_DATA.DRIVER_RENEW:
          await handleDriverRenew(query);
          break;
        case CALLBACK_DATA.DRIVER_REMOVE:
          await handleDriverRemove(query);
          break;

        case CALLBACK_DATA.CLOSE_MAGER:
        case CALLBACK_DATA.EDIT_POST:
        case CALLBACK_DATA.CHECK_PRICE:
        case CALLBACK_DATA.RATING:
        case CALLBACK_DATA.CHECK_VERIFIED:
        default:
          await handleFeatureNotAvailable(query);
          break;
      }
    } catch (error) {
      console.error("Error handling callback query:", error);
      await bot.answerCallbackQuery(query.id, {
        text: "Terjadi kesalahan. Silakan coba lagi.",
        show_alert: true,
      });
    }
  });
}

module.exports = {
  registerCallbackHandlers,
};

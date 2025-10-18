const { CONFIG, STATES, CALLBACK_DATA, CATEGORIES } = require("../config");
const { buildMainMenuKeyboard, buildMagerMenuKeyboard, buildCategoryKeyboard } = require("../keyboards");
const { getWelcomeMessage, getCategoryInfoMessage, getMyMagersMessage } = require("../messages");
const { sendJoinChannelMessage } = require("../telegram");
const { setUserState, clearUserState } = require("../state");
const { isUserMemberOfChannel } = require("../membership");

function registerCallbackHandlers(bot) {
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
      await bot.sendMessage(chatId, "📌 Select mager", {
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

    await bot.editMessageText("📌 Select mager", {
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

    await bot.editMessageText("📌 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: buildCategoryKeyboard(),
    });

    await bot.answerCallbackQuery(query.id);
  }

  async function handleCategorySelection(query, category) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    setUserState(chatId, STATES.WAITING_MESSAGE, category);

    await bot.editMessageText(getCategoryInfoMessage(category), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 back", callback_data: CALLBACK_DATA.POST_MAGER }]],
      },
    });

    await bot.answerCallbackQuery(query.id, { text: "Silakan kirim pesan Anda..." });
  }

  async function handleBackToMager(query) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    clearUserState(chatId);

    await bot.editMessageText("📌 Select mager", {
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

    await bot.editMessageText("⏳ Memuat riwayat posting...", {
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
          [{ text: "📢 Lihat di Channel", url: `https://t.me/${CONFIG.CHANNEL_USERNAME.replace("@", "")}` }],
          [{ text: "🔙 Back to Menu", callback_data: CALLBACK_DATA.BACK_TO_MAGER }],
        ],
      },
    });
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
          await handleCategorySelection(query, CATEGORIES.OPENANJEM);
          break;

        case CALLBACK_DATA.CATEGORY_OPENJASTIP:
          await handleCategorySelection(query, CATEGORIES.OPENJASTIP);
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

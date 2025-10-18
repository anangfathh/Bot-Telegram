// ===============================
// Telegram Channel Forwarding Bot
// Clean Code Architecture
// ===============================

const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// ========================================
// CONFIGURATION & CONSTANTS
// ========================================

const CONFIG = {
  TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  CHANNEL_USERNAME: "@cobaanjem",
};

const STATES = {
  IDLE: "idle",
  SELECTING_CATEGORY: "selecting_category",
  WAITING_MESSAGE: "waiting_message",
};

const CALLBACK_DATA = {
  MENU_MAGER: "menu_mager",
  POST_MAGER: "post_mager",
  MY_MAGERS: "my_magers",
  CLOSE_MAGER: "close_mager",
  EDIT_POST: "edit_post",
  CHECK_PRICE: "check_price",
  RATING: "rating",
  CHECK_VERIFIED: "check_verified",
  BACK_TO_MAIN: "back_to_main",
  BACK_TO_MAGER: "back_to_mager",
  CLOSE_MENU: "close_menu",
  CHECK_MEMBERSHIP: "check_membership",
  CATEGORY_ANJEM: "category_anjem",
  CATEGORY_JASTIP: "category_jastip",
  CATEGORY_OPENANJEM: "category_openanjem",
  CATEGORY_OPENJASTIP: "category_openjastip",
};

const CATEGORIES = {
  ANJEM: "#ANJEM",
  JASTIP: "#JASTIP",
  OPENANJEM: "#OPENANJEM",
  OPENJASTIP: "#OPENJASTIP",
};

// ========================================
// INITIALIZATION
// ========================================

const bot = new TelegramBot(CONFIG.TOKEN, { polling: true });

// State Management
const userStates = new Map();
const waitingForForward = new Map();

// Startup Log
console.log("🚀 Bot started!");
console.log("Channel ID:", CONFIG.CHANNEL_ID);
console.log("Channel Username:", CONFIG.CHANNEL_USERNAME);

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Set bot commands menu
 */
async function setBotCommands() {
  const commands = [
    { command: "start", description: "Start the bot and start to make a post" },
    { command: "mager", description: "Post #anjem #jastip #openanjem #openjastip" },
    { command: "help", description: "Show help and tutorial" },
  ];

  try {
    await bot.setMyCommands(commands);
    console.log("✅ Bot commands menu set successfully!");
  } catch (err) {
    console.error("❌ Failed to set bot commands:", err.message);
  }
}

/**
 * Check if user is member of the channel
 * @param {number} userId - Telegram user ID
 * @returns {Promise<boolean>}
 */
async function isUserMemberOfChannel(userId) {
  try {
    const chatMember = await bot.getChatMember(CONFIG.CHANNEL_ID, userId);
    const validStatuses = ["creator", "administrator", "member"];
    return validStatuses.includes(chatMember.status);
  } catch (error) {
    console.error("Error checking membership:", error.message);
    return false;
  }
}

/**
 * Get user's current state
 * @param {number} chatId - Chat ID
 * @returns {Object|null}
 */
function getUserState(chatId) {
  return userStates.get(chatId) || null;
}

/**
 * Set user state
 * @param {number} chatId - Chat ID
 * @param {string} state - State name
 * @param {string} category - Category (optional)
 */
function setUserState(chatId, state, category = null) {
  const stateData = { state };
  if (category) stateData.category = category;
  userStates.set(chatId, stateData);
}

/**
 * Clear user state
 * @param {number} chatId - Chat ID
 */
function clearUserState(chatId) {
  userStates.delete(chatId);
}

// Initialize bot commands
setBotCommands();

// ========================================
// KEYBOARD BUILDERS
// ========================================

/**
 * Build main menu keyboard
 * @returns {Object}
 */
function buildMainMenuKeyboard() {
  return {
    inline_keyboard: [[{ text: "🎯 Lalala Mager 🏃", callback_data: CALLBACK_DATA.MENU_MAGER }]],
  };
}

/**
 * Build mager menu keyboard
 * @param {boolean} includeMainMenu - Include main menu button
 * @returns {Object}
 */
function buildMagerMenuKeyboard(includeMainMenu = false) {
  const buttons = [
    [{ text: "📮 Post Mager", callback_data: CALLBACK_DATA.POST_MAGER }],
    [{ text: "📋 My Magers", callback_data: CALLBACK_DATA.MY_MAGERS }],
    [{ text: "📦 Close Mager", callback_data: CALLBACK_DATA.CLOSE_MAGER }],
    [{ text: "📝 Edit Post", callback_data: CALLBACK_DATA.EDIT_POST }],
    [{ text: "💰 Check Price", callback_data: CALLBACK_DATA.CHECK_PRICE }],
    [{ text: "⭐ Rating", callback_data: CALLBACK_DATA.RATING }],
    [{ text: "✅ Check Verified", callback_data: CALLBACK_DATA.CHECK_VERIFIED }],
  ];

  if (includeMainMenu) {
    buttons.push([{ text: "🏠 Main Menu", callback_data: CALLBACK_DATA.BACK_TO_MAIN }]);
  }

  buttons.push([{ text: "❌ Close", callback_data: CALLBACK_DATA.CLOSE_MENU }]);

  return { inline_keyboard: buttons };
}

/**
 * Build category selection keyboard
 * @returns {Object}
 */
function buildCategoryKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "#ANJEM 🚗", callback_data: CALLBACK_DATA.CATEGORY_ANJEM },
        { text: "#JASTIP 🛍️", callback_data: CALLBACK_DATA.CATEGORY_JASTIP },
      ],
      [
        { text: "#OPENANJEM 🚗", callback_data: CALLBACK_DATA.CATEGORY_OPENANJEM },
        { text: "#OPENJASTIP 🛍️", callback_data: CALLBACK_DATA.CATEGORY_OPENJASTIP },
      ],
      [{ text: "📖 Read Rules", url: "https://t.me/+AcwluKqZkCtiYTc1" }],
      [{ text: "🔙 back", callback_data: CALLBACK_DATA.BACK_TO_MAGER }],
    ],
  };
}

/**
 * Build join channel keyboard
 * @returns {Object}
 */
function buildJoinChannelKeyboard() {
  return {
    inline_keyboard: [[{ text: "📢 Join Channel", url: `https://t.me/${CONFIG.CHANNEL_USERNAME.replace("@", "")}` }], [{ text: "✅ Saya Sudah Join", callback_data: CALLBACK_DATA.CHECK_MEMBERSHIP }]],
  };
}

// ========================================
// MESSAGE TEMPLATES
// ========================================

/**
 * Get welcome message text
 * @param {string} firstName - User's first name
 * @param {boolean} isMember - Is user a channel member
 * @returns {string}
 */
function getWelcomeMessage(firstName, isMember) {
  const membershipWarning = !isMember ? "\n⚠️ <i>Harap join channel terlebih dahulu untuk mengakses fitur Mager</i>\n" : "";

  return `Hai ${firstName}! 👋

Selamat datang di <b>Kampusku Bot</b> 🎓

Gunakan bot ini untuk:
• 🎯 <b>Lalala Mager</b> - Cari & posting tumpangan
${membershipWarning}
Ketik /help untuk panduan lengkap.`;
}

/**
 * Get join channel required message
 * @returns {string}
 */
function getJoinChannelMessage() {
  return `⚠️ <b>Akses Ditolak</b>

Untuk menggunakan fitur Mager, Anda harus join channel terlebih dahulu:

📢 Channel: ${CONFIG.CHANNEL_USERNAME}

Setelah join, klik tombol "Saya Sudah Join" untuk verifikasi.`;
}

/**
 * Get help message text
 * @returns {string}
 */
function getHelpMessage() {
  return `📖 <b>Panduan Kampusku Bot</b>

🎯 <b>Lalala MAGER</b>
Cari atau posting tumpangan ke kampus/tempat lain
• /mager - Buka menu mager
• #ANJEM - Cari tumpangan
• #JASTIP - Jastip barang
• #OPENANJEM - Buka jasa antar
• #OPENJASTIP - Buka jasa titip

📌 <b>CARA POSTING</b>
1. Ketik command /mager
2. Pilih "Post Mager"
3. Pilih kategori (#ANJEM, #JASTIP, dll)
4. Kirim pesanmu
5. Selesai! Postingan terkirim ke channel

⚠️ <b>ATURAN PENTING</b>
• Dilarang posting konten negatif
• Dilarang spam atau iklan berlebihan
• Hormati privasi dan kesopanan
• Pelanggaran = banned

💡 Butuh bantuan? Hubungi admin grup!`;
}

/**
 * Get category info message
 * @param {string} category - Category name
 * @returns {string}
 */
function getCategoryInfoMessage(category) {
  return `» ${category} 🚗

Input your message to post:
• post type: text, photo, video
• 1 post max 1 photo
• people can answer: driver and youself
• cost: 0 quota (FREE)

» This post will be sent to: https://t.me/+AcwluKqZkCtiYTc1
» Please read T&C in /help to not post agains the rules and you won't be banned

📝 Silakan kirim pesan Anda sekarang...`;
}

// ========================================
// MESSAGE SENDERS
// ========================================

/**
 * Send join channel requirement message
 * @param {number} chatId - Chat ID
 */
async function sendJoinChannelMessage(chatId) {
  await bot.sendMessage(chatId, getJoinChannelMessage(), {
    parse_mode: "HTML",
    reply_markup: buildJoinChannelKeyboard(),
  });
}

/**
 * Send message to channel
 * @param {string} message - Message text
 * @returns {Promise<void>}
 */
async function sendToChannel(message) {
  await bot.sendMessage(CONFIG.CHANNEL_ID, message);
}

// ========================================
// COMMAND HANDLERS
// ========================================

/**
 * Handle /start command
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || "User";

  const isMember = await isUserMemberOfChannel(userId);
  const welcomeText = getWelcomeMessage(firstName, isMember);

  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: "HTML",
    reply_markup: buildMainMenuKeyboard(),
  });
});

/**
 * Handle /mager command
 */
bot.onText(/\/mager/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const isMember = await isUserMemberOfChannel(userId);

  if (!isMember) {
    await sendJoinChannelMessage(chatId);
    return;
  }

  await bot.sendMessage(chatId, "� Select mager", {
    reply_markup: buildMagerMenuKeyboard(false),
  });
});

/**
 * Handle /help command
 */
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(chatId, getHelpMessage(), {
    parse_mode: "HTML",
  });
});

/**
 * Handle #anjem tag (backward compatibility)
 */
bot.onText(/#anjem\b/i, (msg) => {
  const chatId = msg.chat.id;
  waitingForForward.set(chatId, true);
  bot.sendMessage(chatId, "Tag #anjem diterima ✅. Silakan kirim pesan yang ingin diposting ke channel.");
});

// ========================================
// CALLBACK QUERY HANDLERS
// ========================================

/**
 * Handle membership verification
 */
async function handleCheckMembership(query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;

  const isMember = await isUserMemberOfChannel(userId);

  if (isMember) {
    await bot.answerCallbackQuery(query.id, {
      text: "✅ Terverifikasi! Anda sudah join channel.",
      show_alert: true,
    });

    await bot.deleteMessage(chatId, messageId);

    await bot.sendMessage(chatId, "👉 Select mager", {
      reply_markup: buildMagerMenuKeyboard(true),
    });
  } else {
    await bot.answerCallbackQuery(query.id, {
      text: "❌ Anda belum join channel. Silakan join terlebih dahulu!",
      show_alert: true,
    });
  }
}

/**
 * Handle menu mager callback
 */
async function handleMenuMager(query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;

  const isMember = await isUserMemberOfChannel(userId);

  if (!isMember) {
    await bot.answerCallbackQuery(query.id);
    await bot.deleteMessage(chatId, messageId);
    await sendJoinChannelMessage(chatId);
    return;
  }

  await bot.editMessageText("👉 Select mager", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: buildMagerMenuKeyboard(true),
  });

  await bot.answerCallbackQuery(query.id);
}

/**
 * Handle back to main menu
 */
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

/**
 * Handle post mager callback
 */
async function handlePostMager(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  await bot.editMessageText("👉 Select mager", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: buildCategoryKeyboard(),
  });

  await bot.answerCallbackQuery(query.id);
}

/**
 * Handle category selection
 */
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

/**
 * Handle back to mager menu
 */
async function handleBackToMager(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  clearUserState(chatId);

  await bot.editMessageText("👉 Select mager", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: buildMagerMenuKeyboard(true),
  });

  await bot.answerCallbackQuery(query.id);
}

/**
 * Handle close menu
 */
async function handleCloseMenu(query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  await bot.deleteMessage(chatId, messageId);
  await bot.answerCallbackQuery(query.id, { text: "Menu ditutup" });
  clearUserState(chatId);
}

/**
 * Handle feature not available
 */
async function handleFeatureNotAvailable(query) {
  await bot.answerCallbackQuery(query.id, {
    text: "Fitur ini belum tersedia",
    show_alert: true,
  });
}

/**
 * Main callback query handler
 */
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
      case CALLBACK_DATA.CATEGORY_OPENANJEM:
      case CALLBACK_DATA.CATEGORY_OPENJASTIP:
        await bot.answerCallbackQuery(query.id, {
          text: "Fitur kategori ini sedang dalam pengembangan",
          show_alert: true,
        });
        break;

      case CALLBACK_DATA.BACK_TO_MAGER:
        await handleBackToMager(query);
        break;

      case CALLBACK_DATA.CLOSE_MENU:
        await handleCloseMenu(query);
        break;

      case CALLBACK_DATA.MY_MAGERS:
      case CALLBACK_DATA.CLOSE_MAGER:
      case CALLBACK_DATA.EDIT_POST:
      case CALLBACK_DATA.CHECK_PRICE:
      case CALLBACK_DATA.RATING:
      case CALLBACK_DATA.CHECK_VERIFIED:
        await handleFeatureNotAvailable(query);
        break;

      default:
        await handleFeatureNotAvailable(query);
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    await bot.answerCallbackQuery(query.id, {
      text: "Terjadi kesalahan. Silakan coba lagi.",
      show_alert: true,
    });
  }
});

// ========================================
// MESSAGE HANDLERS
// ========================================

/**
 * Handle user message posting to channel
 */
async function handleMessagePosting(msg) {
  const chatId = msg.chat.id;
  const userState = getUserState(chatId);

  if (!userState || userState.state !== STATES.WAITING_MESSAGE) {
    return false;
  }

  console.log(`📤 Mengirim pesan dari ${chatId} ke channel ${CONFIG.CHANNEL_ID}`);
  console.log(`📌 Kategori: ${userState.category}`);

  try {
    const messageToSend = `${userState.category}\n\n${msg.text}`;
    await sendToChannel(messageToSend);

    await bot.sendMessage(chatId, `✅ Pesan berhasil dikirim ke channel dengan kategori ${userState.category}!\n\nPesan Anda:\n${msg.text}`);
    console.log("✅ Pesan berhasil dikirim ke channel!");

    clearUserState(chatId);
    return true;
  } catch (err) {
    console.error("❌ Gagal mengirim ke channel:", err.message);
    console.error("Detail:", err.response?.body);
    await bot.sendMessage(chatId, `⚠️ Gagal mengirim ke channel: ${err.message}`);
    return true;
  }
}

/**
 * Handle legacy #anjem tag posting
 */
async function handleLegacyPosting(msg) {
  const chatId = msg.chat.id;

  if (!waitingForForward.get(chatId)) {
    return false;
  }

  console.log(`📤 Mengirim pesan dari ${chatId} ke channel ${CONFIG.CHANNEL_ID}`);

  try {
    await sendToChannel(msg.text);
    await bot.sendMessage(chatId, "✅ Pesan berhasil dikirim ke channel dan dapat dikomentari oleh subscriber.");
    console.log("✅ Pesan berhasil dikirim ke channel!");
  } catch (err) {
    console.error("❌ Gagal mengirim ke channel:", err.message);
    console.error("Detail:", err.response?.body);
    await bot.sendMessage(chatId, `⚠️ Gagal mengirim ke channel: ${err.message}`);
  }

  waitingForForward.delete(chatId);
  return true;
}

/**
 * Main message handler
 */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Ignore commands
  if (msg.text && msg.text.startsWith("/")) return;

  // Ignore #anjem tags (handled by onText)
  if (msg.text && /#anjem\b/i.test(msg.text)) return;

  // Handle message posting to channel
  const isPosted = await handleMessagePosting(msg);
  if (isPosted) return;

  // Handle legacy posting method
  await handleLegacyPosting(msg);
});

// ========================================
// ERROR HANDLING
// ========================================

/**
 * Handle polling errors
 */
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

/**
 * Handle webhook errors
 */
bot.on("webhook_error", (error) => {
  console.error("Webhook error:", error);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down bot gracefully...");
  bot.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down bot gracefully...");
  bot.stopPolling();
  process.exit(0);
});

// ===============================
// Telegram Channel Forwarding Bot
// ===============================

const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// === Konfigurasi ===
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // contoh: -1001234567890

const bot = new TelegramBot(TOKEN, { polling: true });

// Map untuk menyimpan state user yang menunggu input
const waitingForForward = new Map();

// State management untuk tracking posisi user di menu
const userStates = new Map();
const STATES = {
  IDLE: "idle",
  SELECTING_CATEGORY: "selecting_category",
  WAITING_MESSAGE: "waiting_message",
};

// Debug startup
console.log("🚀 Bot started!");
console.log("Channel ID:", CHANNEL_ID);

// === Set Bot Commands Menu ===
// Menambahkan command list yang muncul di menu bot
bot
  .setMyCommands([
    { command: "start", description: "Start the bot and start to make a post" },
    { command: "menfess", description: "Post MENFESS to Fess Channel" },
    { command: "mager", description: "Post #anjem #jastip #openanjem #openjastip" },
    { command: "shop", description: "Shop and sell items in campus" },
    { command: "friend", description: "Find new friends in campus" },
    { command: "help", description: "Show help and tutorial" },
  ])
  .then(() => {
    console.log("✅ Bot commands menu set successfully!");
  })
  .catch((err) => {
    console.error("❌ Failed to set bot commands:", err.message);
  });

// === Command: /start ===
// Menampilkan menu utama bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "User";

  const keyboard = {
    inline_keyboard: [
      [{ text: "🎯 Lalala Mager 🏃", callback_data: "menu_mager" }],
      [{ text: "💬 Lalala Fess 🎙️", callback_data: "menu_menfess" }],
      [{ text: "🛍️ Lalala Shop 🛒", callback_data: "menu_shop" }],
      [{ text: "👥 Lalala Friend 👫", callback_data: "menu_friend" }],
    ],
  };

  const welcomeText = `Hai ${firstName}! 👋

Selamat datang di <b>Kampusku Bot</b> 🎓

Pilih menu yang kamu butuhkan:
• 🎯 <b>Lalala Mager</b> - Cari & posting tumpangan
• 💬 <b>Lalala Fess</b> - Posting menfess anonim
• 🛍️ <b>Lalala Shop</b> - Jual beli kampus
• 👥 <b>Lalala Friend</b> - Cari teman baru

Ketik /help untuk panduan lengkap.`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
});

// === Command: /mager ===
// Menampilkan menu utama mager
bot.onText(/\/mager/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [
      [{ text: "📮 Post Mager", callback_data: "post_mager" }],
      [{ text: "📋 My Magers", callback_data: "my_magers" }],
      [{ text: "📦 Close Mager", callback_data: "close_mager" }],
      [{ text: "📝 Edit Post", callback_data: "edit_post" }],
      [{ text: "💰 Check Price", callback_data: "check_price" }],
      [{ text: "⭐ Rating", callback_data: "rating" }],
      [{ text: "✅ Check Verified", callback_data: "check_verified" }],
      [{ text: "❌ Close", callback_data: "close_menu" }],
    ],
  };

  bot.sendMessage(chatId, "👉 Select mager", {
    reply_markup: keyboard,
  });
});

// === Command: /menfess ===
// Menampilkan menu utama menfess
bot.onText(/\/menfess/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [[{ text: "📝 Post Menfess", callback_data: "post_menfess" }], [{ text: "📋 My Menfess", callback_data: "my_menfess" }], [{ text: "❌ Close", callback_data: "close_menu" }]],
  };

  bot.sendMessage(chatId, "💬 Select menfess option", {
    reply_markup: keyboard,
  });
});

// === Command: /shop ===
// Menampilkan menu shop (coming soon)
bot.onText(/\/shop/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🛍️ Lalala Shop\n\nFitur ini sedang dalam pengembangan. Stay tuned! 🚧");
});

// === Command: /friend ===
// Menampilkan menu friend (coming soon)
bot.onText(/\/friend/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "👥 Lalala Friend\n\nFitur ini sedang dalam pengembangan. Stay tuned! 🚧");
});

// === Command: /help ===
// Menampilkan panduan penggunaan bot
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpText = `📖 <b>Panduan Kampusku Bot</b>

🎯 <b>Lalala MAGER</b>
Cari atau posting tumpangan ke kampus/tempat lain
• /mager - Buka menu mager
• #ANJEM - Cari tumpangan
• #JASTIP - Jastip barang
• #OPENANJEM - Buka jasa antar
• #OPENJASTIP - Buka jasa titip

💬 <b>Lalala FESS</b>
Posting menfess anonim ke channel
• /menfess - Buka menu menfess
• Postingan bersifat anonim

🛍️ <b>Lalala SHOP</b>
Jual beli barang di kampus (Coming Soon)

👥 <b>Lalala FRIEND</b>
Cari teman baru di kampus (Coming Soon)

📌 <b>CARA POSTING</b>
1. Ketik command (misal /mager)
2. Pilih kategori posting
3. Kirim pesanmu
4. Selesai! Postingan terkirim

⚠️ <b>ATURAN PENTING</b>
• Dilarang posting konten negatif
• Dilarang spam atau iklan berlebihan
• Hormati privasi dan kesopanan
• Pelanggaran = banned

💡 Butuh bantuan? Hubungi admin grup!`;

  bot.sendMessage(chatId, helpText, {
    parse_mode: "HTML",
  });
});

// === Handler Callback Query ===
// Menangani klik tombol inline keyboard
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  // Handler untuk menu utama dari /start
  if (data === "menu_mager") {
    const keyboard = {
      inline_keyboard: [
        [{ text: "📮 Post Mager", callback_data: "post_mager" }],
        [{ text: "📋 My Magers", callback_data: "my_magers" }],
        [{ text: "📦 Close Mager", callback_data: "close_mager" }],
        [{ text: "📝 Edit Post", callback_data: "edit_post" }],
        [{ text: "💰 Check Price", callback_data: "check_price" }],
        [{ text: "⭐ Rating", callback_data: "rating" }],
        [{ text: "✅ Check Verified", callback_data: "check_verified" }],
        [{ text: "🏠 Main Menu", callback_data: "back_to_main" }],
        [{ text: "❌ Close", callback_data: "close_menu" }],
      ],
    };

    await bot.editMessageText("👉 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
    });

    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === "menu_menfess") {
    const keyboard = {
      inline_keyboard: [
        [{ text: "📝 Post Menfess", callback_data: "post_menfess" }],
        [{ text: "📋 My Menfess", callback_data: "my_menfess" }],
        [{ text: "🏠 Main Menu", callback_data: "back_to_main" }],
        [{ text: "❌ Close", callback_data: "close_menu" }],
      ],
    };

    await bot.editMessageText("💬 Select menfess option", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
    });

    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === "menu_shop" || data === "menu_friend") {
    await bot.answerCallbackQuery(query.id, {
      text: "Fitur ini sedang dalam pengembangan 🚧",
      show_alert: true,
    });
    return;
  }

  // Handler untuk back ke main menu
  if (data === "back_to_main") {
    const firstName = query.from.first_name || "User";
    const keyboard = {
      inline_keyboard: [
        [{ text: "🎯 Lalala Mager 🏃", callback_data: "menu_mager" }],
        [{ text: "💬 Lalala Fess 🎙️", callback_data: "menu_menfess" }],
        [{ text: "🛍️ Lalala Shop 🛒", callback_data: "menu_shop" }],
        [{ text: "👥 Lalala Friend 👫", callback_data: "menu_friend" }],
      ],
    };

    const welcomeText = `Hai ${firstName}! 👋

Selamat datang di <b>Kampusku Bot</b> 🎓

Pilih menu yang kamu butuhkan:
• 🎯 <b>Lalala Mager</b> - Cari & posting tumpangan
• 💬 <b>Lalala Fess</b> - Posting menfess anonim
• 🛍️ <b>Lalala Shop</b> - Jual beli kampus
• 👥 <b>Lalala Friend</b> - Cari teman baru

Ketik /help untuk panduan lengkap.`;

    await bot.editMessageText(welcomeText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });

    await bot.answerCallbackQuery(query.id);
    return;
  }

  // Handler untuk Post Mager
  if (data === "post_mager") {
    const keyboard = {
      inline_keyboard: [
        [
          { text: "#ANJEM 🚗", callback_data: "category_anjem" },
          { text: "#JASTIP 🛍️", callback_data: "category_jastip" },
        ],
        [
          { text: "#OPENANJEM 🚗", callback_data: "category_openanjem" },
          { text: "#OPENJASTIP 🛍️", callback_data: "category_openjastip" },
        ],
        [{ text: "📖 Read Rules", url: "https://t.me/+AcwluKqZkCtiYTc1" }],
        [{ text: "🔙 back", callback_data: "back_to_mager" }],
      ],
    };

    await bot.editMessageText("👉 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
    });

    await bot.answerCallbackQuery(query.id);
    return;
  }

  // Handler untuk memilih kategori #ANJEM
  if (data === "category_anjem") {
    // Set state user ke WAITING_MESSAGE
    userStates.set(chatId, {
      state: STATES.WAITING_MESSAGE,
      category: "#ANJEM",
    });

    const infoText = `» #ANJEM 🚗

Input your message to post:
• post type: text, photo, video
• 1 post max 1 photo
• people can answer: driver and youself
• cost: 0 quota (FREE)

» This post will be sent to: https://t.me/+AcwluKqZkCtiYTc1
» Please read T&C in /help to not post agains the rules and you won't be banned

📝 Silakan kirim pesan Anda sekarang...`;

    await bot.editMessageText(infoText, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 back", callback_data: "post_mager" }]],
      },
    });

    await bot.answerCallbackQuery(query.id, { text: "Silakan kirim pesan Anda..." });
    return;
  }

  // Handler untuk kategori lainnya (placeholder)
  if (data === "category_jastip" || data === "category_openanjem" || data === "category_openjastip") {
    await bot.answerCallbackQuery(query.id, {
      text: "Fitur kategori ini sedang dalam pengembangan",
      show_alert: true,
    });
    return;
  }

  // Handler untuk back ke menu mager
  if (data === "back_to_mager") {
    // Reset state
    userStates.delete(chatId);

    const keyboard = {
      inline_keyboard: [
        [{ text: "📮 Post Mager", callback_data: "post_mager" }],
        [{ text: "📋 My Magers", callback_data: "my_magers" }],
        [{ text: "📦 Close Mager", callback_data: "close_mager" }],
        [{ text: "📝 Edit Post", callback_data: "edit_post" }],
        [{ text: "💰 Check Price", callback_data: "check_price" }],
        [{ text: "⭐ Rating", callback_data: "rating" }],
        [{ text: "✅ Check Verified", callback_data: "check_verified" }],
        [{ text: "🏠 Main Menu", callback_data: "back_to_main" }],
        [{ text: "❌ Close", callback_data: "close_menu" }],
      ],
    };

    await bot.editMessageText("👉 Select mager", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
    });

    await bot.answerCallbackQuery(query.id);
    return;
  }

  // Handler untuk close menu
  if (data === "close_menu") {
    await bot.deleteMessage(chatId, messageId);
    await bot.answerCallbackQuery(query.id, { text: "Menu ditutup" });
    userStates.delete(chatId);
    return;
  }

  // Handler sementara untuk tombol lain
  await bot.answerCallbackQuery(query.id, {
    text: "Fitur ini belum tersedia",
    show_alert: true,
  });
});

// === Command: #anjem (backward compatibility) ===
// Saat user mengetik #anjem, bot akan menunggu pesan berikutnya untuk dikirim ke channel
bot.onText(/#anjem\b/i, (msg) => {
  const chatId = msg.chat.id;
  waitingForForward.set(chatId, true);
  bot.sendMessage(chatId, "Tag #anjem diterima ✅. Silakan kirim pesan yang ingin diposting ke channel.");
});

// === Event: Menerima pesan teks ===
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Abaikan jika pesan adalah command atau callback
  if (msg.text && msg.text.startsWith("/")) return;

  // Cek apakah user sedang dalam state WAITING_MESSAGE (dari menu mager)
  const userState = userStates.get(chatId);

  if (userState && userState.state === STATES.WAITING_MESSAGE) {
    console.log(`📤 Mengirim pesan dari ${chatId} ke channel ${CHANNEL_ID}`);
    console.log(`📌 Kategori: ${userState.category}`);

    try {
      // Format pesan dengan kategori
      const messageToSend = `${userState.category}\n\n${msg.text}`;

      // Kirim pesan ke channel
      await bot.sendMessage(CHANNEL_ID, messageToSend);

      // Balas user dengan konfirmasi
      await bot.sendMessage(chatId, `✅ Pesan berhasil dikirim ke channel dengan kategori ${userState.category}!\n\nPesan Anda:\n${msg.text}`);
      console.log("✅ Pesan berhasil dikirim ke channel!");

      // Reset state user
      userStates.delete(chatId);
    } catch (err) {
      console.error("❌ Gagal mengirim ke channel:", err.message);
      console.error("Detail:", err.response?.body);
      await bot.sendMessage(chatId, `⚠️ Gagal mengirim ke channel: ${err.message}`);
    }

    return;
  }

  // Handler untuk #anjem manual (backward compatibility)
  if (msg.text && /#anjem\b/i.test(msg.text)) {
    return; // Sudah dihandle di onText handler
  }

  // Jika user sedang menunggu untuk mengirim ke channel (cara lama dengan #anjem)
  if (waitingForForward.get(chatId)) {
    console.log(`📤 Mengirim pesan dari ${chatId} ke channel ${CHANNEL_ID}`);

    try {
      // Kirim pesan ke channel
      await bot.sendMessage(CHANNEL_ID, msg.text);

      // Balas user
      await bot.sendMessage(chatId, "✅ Pesan berhasil dikirim ke channel dan dapat dikomentari oleh subscriber.");
      console.log("✅ Pesan berhasil dikirim ke channel!");
    } catch (err) {
      console.error("❌ Gagal mengirim ke channel:", err.message);
      console.error("Detail:", err.response?.body);
      await bot.sendMessage(chatId, `⚠️ Gagal mengirim ke channel: ${err.message}`);
    }

    // Hapus state setelah kirim
    waitingForForward.delete(chatId);
  }
});

// === Optional: Respon tambahan ===
bot.onText(/^!haloo$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Hai 👋! Ketik #anjem untuk mengirim pesan ke channel.");
});

// === Debug sticker ===
bot.on("sticker", (msg) => {
  bot.sendMessage(msg.chat.id, msg.sticker.emoji || "👍");
});

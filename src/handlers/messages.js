const { CONFIG, STATES, CATEGORIES, CALLBACK_DATA } = require("../config");
const { sendToChannel } = require("../telegram");
const {
  saveUserPost,
  getPostById,
  searchUsersByQuery,
  saveUserRating,
  getUserRatingSummary,
  upsertUserProfile,
} = require("../database");
const { getUserState, setUserState, clearUserState, waitingForForward } = require("../state");
const {
  ensureDriverActive,
  registerDriver,
  renewDriver,
  removeDriver,
  isDriverActive,
  searchDriversByQuery,
} = require("../drivers");
const {
  getDriverMenuMessage,
  getPriceWeatherPromptMessage,
  getDriverLookupPromptMessage,
  getDriverLookupResultMessage,
  getRatingTargetPromptMessage,
  getRatingAmbiguousMessage,
  getRatingScorePromptMessage,
  getRatingCommentPromptMessage,
  getRatingThankYouMessage,
  getRatingLookupPromptMessage,
  getRatingLookupResultMessage,
} = require("../messages");
const { buildDriverMenuKeyboard } = require("../keyboards");
const { editPost } = require("../posts");
const RATING_SCORE_PREFIX = "rating_score:";
const formatUsername = (username) => {
  if (!username) {
    return "-";
  }
  return username.startsWith("@") ? username : `@${username}`;
};

function registerMessageHandlers(bot) {
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

  async function handlePriceInput(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.AWAITING_PRICE_INPUT) {
      return false;
    }

    const stage = userState.stage || "distance";

    if (!msg.text) {
      await bot.sendMessage(chatId, "Masukkan jarak dalam meter, contoh: 1500. Ketik BATAL untuk membatalkan.");
      return true;
    }

    const text = msg.text.trim();
    if (text.toLowerCase() === "batal") {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Perhitungan harga dibatalkan.");
      return true;
    }

    if (stage === "weather") {
      await bot.sendMessage(chatId, "Silakan pilih kondisi hujan melalui tombol yang tersedia atau ketik BATAL.");
      return true;
    }

    const digits = text.replace(/[^\d]/g, "");
    const distance = Number(digits);

    if (!digits || Number.isNaN(distance) || distance <= 0) {
      await bot.sendMessage(chatId, "Format jarak tidak valid. Masukkan angka dalam meter, misalnya 1500.");
      return true;
    }

    setUserState(chatId, STATES.AWAITING_PRICE_INPUT, { stage: "weather", distance });

    await bot.sendMessage(chatId, getPriceWeatherPromptMessage(distance), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🌧️ Ya, hujan", callback_data: CALLBACK_DATA.PRICE_RAIN_YES },
            { text: "🌤️ Tidak hujan", callback_data: CALLBACK_DATA.PRICE_RAIN_NO },
          ],
        ],
      },
    });

    return true;
  }

  async function handleRatingInput(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || ![STATES.AWAITING_RATING_TARGET, STATES.AWAITING_RATING_SCORE, STATES.AWAITING_RATING_COMMENT].includes(userState.state)) {
      return false;
    }

    if (userState.state === STATES.AWAITING_RATING_SCORE) {
      await bot.sendMessage(chatId, "Silakan pilih skor 1-5 melalui tombol rating, atau ketik BATAL.");
      return true;
    }

    if (!msg.text) {
      await bot.sendMessage(chatId, "Kirim username atau nama yang valid, atau ketik BATAL.");
      return true;
    }

    const text = msg.text.trim();

    if (!text) {
      await bot.sendMessage(chatId, "Format tidak valid. Silakan kirim ulang atau ketik BATAL.");
      return true;
    }

    if (text.toLowerCase() === "batal") {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Proses rating dibatalkan.");
      return true;
    }

    if (userState.state === STATES.AWAITING_RATING_TARGET) {
      let matches = [];
      try {
        matches = await searchUsersByQuery(text);
        const uniqueUsers = new Map();
        for (const user of matches) {
          if (!uniqueUsers.has(user.userId)) {
            uniqueUsers.set(user.userId, user);
          }
        }
        matches = Array.from(uniqueUsers.values());
      } catch (error) {
        console.error("Failed to search users for rating:", error);
        await bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mencari pengguna. Silakan coba lagi.");
        return true;
      }

      const containsSelf = matches.some((user) => user.userId === msg.from.id);
      matches = matches.filter((user) => user.userId !== msg.from.id);

      if (matches.length === 0) {
        if (containsSelf) {
          await bot.sendMessage(chatId, "Anda tidak dapat memberi rating untuk diri sendiri.");
        } else {
          await bot.sendMessage(chatId, "Pengguna tidak ditemukan. Pastikan mereka sudah pernah menggunakan bot ini.");
        }
        return true;
      }

      if (matches.length > 1) {
        await bot.sendMessage(chatId, getRatingAmbiguousMessage(matches.slice(0, 5)), {
          parse_mode: "HTML",
        });
        return true;
      }

      const target = matches[0];
      const usernameDisplay = formatUsername(target.username);
      const targetDisplay = target.fullName ? `${target.fullName} (${usernameDisplay})` : usernameDisplay;

      setUserState(chatId, STATES.AWAITING_RATING_SCORE, {
        targetUserId: target.userId,
        targetDisplay,
      });

      await bot.sendMessage(chatId, getRatingScorePromptMessage(targetDisplay), {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "1", callback_data: `${RATING_SCORE_PREFIX}1` },
              { text: "2", callback_data: `${RATING_SCORE_PREFIX}2` },
              { text: "3", callback_data: `${RATING_SCORE_PREFIX}3` },
              { text: "4", callback_data: `${RATING_SCORE_PREFIX}4` },
              { text: "5", callback_data: `${RATING_SCORE_PREFIX}5` },
            ],
          ],
        },
      });

      return true;
    }

    if (userState.state === STATES.AWAITING_RATING_COMMENT) {
      const targetUserId = userState.targetUserId;
      const targetDisplay = userState.targetDisplay;
      const score = userState.score;

      if (!targetUserId || !score) {
        clearUserState(chatId);
        await bot.sendMessage(chatId, "Sesi rating tidak valid. Silakan mulai ulang.");
        return true;
      }

      const comment = text === "-" ? null : text;

      if (comment && comment.length > 500) {
        await bot.sendMessage(chatId, "Komentar maksimal 500 karakter. Silakan ringkas ulasan Anda.");
        return true;
      }

      try {
        await saveUserRating(targetUserId, msg.from.id, score, comment);
      } catch (error) {
        console.error("Failed to save user rating:", error);
        await bot.sendMessage(chatId, "⚠️ Gagal menyimpan rating. Silakan coba lagi.");
        return true;
      }

      clearUserState(chatId);

      let summary = null;
      try {
        summary = await getUserRatingSummary(targetUserId);
      } catch (error) {
        console.error("Failed to load rating summary:", error);
      }

      await bot.sendMessage(chatId, getRatingThankYouMessage(targetDisplay, summary), {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Kembali", callback_data: CALLBACK_DATA.RATING }]],
        },
      });

      return true;
    }

    return false;
  }

  async function handleRatingLookupInput(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.AWAITING_RATING_LOOKUP) {
      return false;
    }

    if (!msg.text) {
      await bot.sendMessage(chatId, "Masukkan username atau nama pengguna, atau ketik BATAL.");
      return true;
    }

    const text = msg.text.trim();

    if (!text) {
      await bot.sendMessage(chatId, "Format tidak valid. Silakan kirim ulang atau ketik BATAL.");
      return true;
    }

    if (text.toLowerCase() === "batal") {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Pencarian rating dibatalkan.");
      return true;
    }

    let matches = [];
    try {
      matches = await searchUsersByQuery(text);
      const uniqueUsers = new Map();
      for (const user of matches) {
        if (!uniqueUsers.has(user.userId)) {
          uniqueUsers.set(user.userId, user);
        }
      }
      matches = Array.from(uniqueUsers.values());
    } catch (error) {
      console.error("Failed to search users:", error);
      await bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mencari pengguna. Silakan coba lagi.");
      return true;
    }

    if (matches.length === 0) {
      clearUserState(chatId);
      await bot.sendMessage(
        chatId,
        getRatingLookupResultMessage(text, null, null, CONFIG.DRIVER_CONTACT_USERNAME || "hubungi admin"),
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[{ text: "🔙 Kembali", callback_data: CALLBACK_DATA.RATING }]],
          },
        }
      );
      return true;
    }

    if (matches.length > 1) {
      await bot.sendMessage(chatId, getRatingAmbiguousMessage(matches.slice(0, 5)), {
        parse_mode: "HTML",
      });
      return true;
    }

    const target = matches[0];
    let summary = null;
    try {
      summary = await getUserRatingSummary(target.userId);
    } catch (error) {
      console.error("Failed to load rating summary:", error);
    }

    clearUserState(chatId);

    await bot.sendMessage(
      chatId,
      getRatingLookupResultMessage(text, target, summary, CONFIG.DRIVER_CONTACT_USERNAME || "hubungi admin"),
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Kembali", callback_data: CALLBACK_DATA.RATING }]],
        },
      }
    );

    return true;
  }

  async function handleDriverLookupInput(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.AWAITING_DRIVER_LOOKUP) {
      return false;
    }

    if (!msg.text) {
      await bot.sendMessage(chatId, "Masukkan username atau nama driver yang ingin dicek, atau ketik BATAL.");
      return true;
    }

    const text = msg.text.trim();

    if (!text) {
      await bot.sendMessage(chatId, "Format pencarian tidak valid. Coba masukkan lagi, atau ketik BATAL.");
      return true;
    }

    if (text.toLowerCase() === "batal") {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Pencarian driver dibatalkan.");
      return true;
    }

    let matches = [];
    try {
      const results = await searchDriversByQuery(text);
      const now = Date.now();
      matches = results.filter(
        (driver) =>
          driver.status === "active" && (!driver.expiresAt || driver.expiresAt.getTime() > now)
      );
      const uniqueDrivers = new Map();
      for (const driver of matches) {
        if (!uniqueDrivers.has(driver.userId)) {
          uniqueDrivers.set(driver.userId, driver);
        }
      }
      matches = Array.from(uniqueDrivers.values());
    } catch (error) {
      console.error("Failed to search drivers:", error);
      await bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat mencari driver. Silakan coba lagi.");
      return true;
    }

    let enhancedMatches = matches;
    try {
      enhancedMatches = await Promise.all(
        matches.map(async (driver) => {
          const summary = await getUserRatingSummary(driver.userId);
          return { ...driver, ratingSummary: summary };
        })
      );
    } catch (error) {
      console.error("Failed to load driver rating summaries:", error);
    }

    clearUserState(chatId);

    const message = getDriverLookupResultMessage(
      text,
      enhancedMatches,
      CONFIG.DRIVER_CONTACT_USERNAME || "hubungi admin"
    );

    await bot.sendMessage(chatId, message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 Kembali", callback_data: CALLBACK_DATA.BACK_TO_MAGER }]],
      },
    });

    return true;
  }

  async function handleEditInput(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.AWAITING_EDIT_MESSAGE) {
      return false;
    }

    const postId = Number(userState.postId);
    if (!postId) {
      clearUserState(chatId);
      return false;
    }

    if (!msg.text) {
      await bot.sendMessage(chatId, "Kirim teks baru untuk memperbarui posting atau ketik BATAL.");
      return true;
    }

    const newContent = msg.text.trim();
    if (!newContent.length) {
      await bot.sendMessage(chatId, "Konten tidak boleh kosong. Silakan kirim ulang atau ketik BATAL.");
      return true;
    }

    if (newContent.toLowerCase() === "batal") {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Edit posting dibatalkan.");
      return true;
    }

    const post = await getPostById(postId);
    if (!post || post.userId !== msg.from.id) {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Posting tidak ditemukan atau bukan milik Anda.");
      return true;
    }

    if (post.type !== "text" && newContent.length > 1024) {
      await bot.sendMessage(chatId, "Caption untuk media maksimal 1024 karakter. Silakan kurangi isi pesan.");
      return true;
    }

    if (post.type === "text" && newContent.length > 4096) {
      await bot.sendMessage(chatId, "Pesan teks maksimal 4096 karakter. Silakan kurangi isi pesan.");
      return true;
    }

    try {
      await editPost(bot, postId, newContent);
      clearUserState(chatId);
      await bot.sendMessage(chatId, "✅ Post berhasil diperbarui di channel.");
    } catch (error) {
      console.error("Failed to edit post:", error);
      await bot.sendMessage(chatId, `⚠️ Gagal memperbarui post: ${error.message}`);
    }

    return true;
  }

  async function handleDriverInput(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.AWAITING_DRIVER_INPUT) {
      return false;
    }

    const action = userState.action;
    if (!["driver_add", "driver_renew", "driver_remove"].includes(action)) {
      clearUserState(chatId);
      return false;
    }

    if (!isDriverAdminUser(msg.from.id)) {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Sesi dibatalkan karena Anda bukan admin driver.");
      return true;
    }

    if (!msg.text) {
      await bot.sendMessage(
        chatId,
        action === "driver_remove"
          ? "Kirim user ID driver yang akan dinonaktifkan. Contoh: 8375046442"
          : "Kirim user ID dan durasi (opsional) dalam format teks. Contoh: 8375046442 30"
      );
      return true;
    }

    const trimmed = msg.text.trim();
    if (!trimmed) {
      await bot.sendMessage(chatId, "Format tidak valid. Silakan kirim ulang atau ketik BATAL.");
      return true;
    }

    if (trimmed.toLowerCase() === "batal") {
      clearUserState(chatId);
      await bot.sendMessage(chatId, "Aksi dibatalkan.");
      return true;
    }

    const parts = trimmed.split(/\s+/);
    const targetUserId = Number(parts[0]);

    if (!parts[0] || Number.isNaN(targetUserId)) {
      await bot.sendMessage(chatId, "ID pengguna tidak valid. Contoh yang benar: 8375046442");
      return true;
    }

    if (action === "driver_remove" && parts.length > 1) {
      await bot.sendMessage(chatId, "Untuk menghapus driver cukup kirim 1 ID saja. Contoh: 8375046442");
      return true;
    }

    let durationDays = undefined;
    if (parts[1]) {
      durationDays = Number(parts[1]);
      if (Number.isNaN(durationDays) || durationDays <= 0) {
        await bot.sendMessage(chatId, "Durasi harus berupa angka hari yang valid. Contoh: 30");
        return true;
      }
    }

    try {
      let resultMessage = "";

      if (action === "driver_add") {
        let chatInfo = null;
        try {
          chatInfo = await bot.getChat(targetUserId);
        } catch (error) {
          console.warn("Failed to fetch chat info for driver_add (menu):", error.message);
        }

        const username = chatInfo?.username ? `@${chatInfo.username}` : undefined;
        const fullName = chatInfo
          ? [chatInfo.first_name, chatInfo.last_name].filter(Boolean).join(" ").trim() || undefined
          : undefined;

        const driver = await registerDriver(bot, targetUserId, {
          username,
          fullName,
          durationDays,
        });

        const expiresLine = driver?.expiresAt ? formatDateTime(driver.expiresAt) : "-";
        resultMessage = [
          "✅ Driver berhasil ditambahkan/diaktivasi via menu.",
          `ID: ${targetUserId}`,
          `Nama: ${driver?.fullName || fullName || "-"}`,
          `Username: ${driver?.username || username || "-"}`,
          `Berlaku sampai: ${expiresLine}`,
        ].join("\n");
      } else if (action === "driver_renew") {
        const driver = await renewDriver(bot, targetUserId, {
          durationDays,
        });

        const expiresLine = driver?.expiresAt ? formatDateTime(driver.expiresAt) : "-";
        resultMessage = [
          "✅ Driver berhasil diperpanjang.",
          `ID: ${targetUserId}`,
          `Berlaku sampai: ${expiresLine}`,
        ].join("\n");
      } else if (action === "driver_remove") {
        const driver = await removeDriver(bot, targetUserId, { reason: "manual" });

        if (!driver) {
          await bot.sendMessage(chatId, "Driver tidak ditemukan atau sudah non-aktif. Masukkan ID lain atau ketik BATAL.");
          return true;
        }

        resultMessage = [
          "✅ Driver berhasil dinonaktifkan.",
          `ID: ${targetUserId}`,
          `Nama: ${driver.fullName || "-"}`,
          `Username: ${driver.username || "-"}`,
        ].join("\n");
      }

      clearUserState(chatId);

      const adminIsDriver = await isDriverActive(msg.from.id);

      await bot.sendMessage(chatId, resultMessage, {
        parse_mode: "HTML",
        reply_markup: buildDriverMenuKeyboard(adminIsDriver, true),
      });
    } catch (error) {
      console.error(`${action} (menu) failed:`, error);
      await bot.sendMessage(chatId, `Gagal memproses driver: ${error.message}`);
    }

    return true;
  }

  async function handleMessagePosting(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.WAITING_MESSAGE) {
      return false;
    }

    const userId = msg.from.id;
    const requiresDriver =
      userState.category === CATEGORIES.OPENANJEM || userState.category === CATEGORIES.OPENJASTIP;

    if (requiresDriver) {
      const check = await ensureDriverActive(bot, userId);
      if (!check.ok) {
        const notice =
          check.reason === "expired"
            ? "Masa berlaku driver Anda telah habis. Hubungi admin untuk memperpanjang."
            : "Kategori ini hanya bisa digunakan oleh driver yang terdaftar.";

        clearUserState(chatId);

        await bot.sendMessage(
          chatId,
          `${notice}\n\n${getDriverMenuMessage(false, CONFIG.DRIVER_CONTACT_USERNAME || "hubungi admin")}`,
          {
            parse_mode: "HTML",
            reply_markup: buildDriverMenuKeyboard(false, isDriverAdminUser(userId)),
          }
        );

        return true;
      }
    }

    console.log(`🚀 Mengirim pesan dari ${chatId} ke channel ${CONFIG.CHANNEL_ID}`);
    console.log(`📌 Kategori: ${userState.category}`);

    try {
      const caption = msg.caption || msg.text || "";
      const messageText = `${userState.category}\n\n${caption}`;
      let sentMessage;
      let messageType;

      if (msg.photo) {
        const photoId = msg.photo[msg.photo.length - 1].file_id;
        sentMessage = await bot.sendPhoto(CONFIG.CHANNEL_ID, photoId, { caption: messageText });
        messageType = "photo";
        await bot.sendMessage(chatId, `✅ Foto berhasil dikirim ke channel dengan kategori ${userState.category}!`);
      } else if (msg.video) {
        sentMessage = await bot.sendVideo(CONFIG.CHANNEL_ID, msg.video.file_id, { caption: messageText });
        messageType = "video";
        await bot.sendMessage(chatId, `✅ Video berhasil dikirim ke channel dengan kategori ${userState.category}!`);
      } else if (msg.document) {
        sentMessage = await bot.sendDocument(CONFIG.CHANNEL_ID, msg.document.file_id, { caption: messageText });
        messageType = "document";
        await bot.sendMessage(chatId, `✅ Dokumen berhasil dikirim ke channel dengan kategori ${userState.category}!`);
      } else if (msg.text) {
        sentMessage = await sendToChannel(bot, messageText);
        messageType = "text";
        await bot.sendMessage(
          chatId,
          `✅ Pesan berhasil dikirim ke channel dengan kategori ${userState.category}!\n\nPesan Anda:\n${msg.text}`
        );
      } else {
        await bot.sendMessage(
          chatId,
          "⚠️ Tipe pesan ini tidak didukung. Silakan kirim teks, foto, video, atau dokumen."
        );
        return true;
      }

      try {
        await saveUserPost(userId, userState.category, caption, messageType, sentMessage.message_id);
      } catch (error) {
        console.error("Failed to persist post history:", error.message);
      }

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

  async function handleLegacyPosting(msg) {
    const chatId = msg.chat.id;

    if (!waitingForForward.get(chatId)) {
      return false;
    }

    console.log(`🚀 Mengirim pesan dari ${chatId} ke channel ${CONFIG.CHANNEL_ID}`);

    try {
      await sendToChannel(bot, msg.text);
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

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    try {
      await upsertUserProfile({
        userId: msg.from.id,
        username: msg.from.username ? `@${msg.from.username}` : null,
        firstName: msg.from.first_name || null,
        lastName: msg.from.last_name || null,
        fullName: [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") || null,
      });
    } catch (error) {
      console.error("Failed to update user profile:", error);
    }

    if (msg.text && msg.text.startsWith("/")) return;
    if (msg.text && /#anjem\b/i.test(msg.text)) return;

    const handledRating = await handleRatingInput(msg);
    if (handledRating) return;

    const handledRatingLookup = await handleRatingLookupInput(msg);
    if (handledRatingLookup) return;

    const handledDriverLookup = await handleDriverLookupInput(msg);
    if (handledDriverLookup) return;

    const handledPrice = await handlePriceInput(msg);
    if (handledPrice) return;

    const handledEdit = await handleEditInput(msg);
    if (handledEdit) return;

    const handledDriver = await handleDriverInput(msg);
    if (handledDriver) return;

    const isPosted = await handleMessagePosting(msg);
    if (isPosted) return;

    await handleLegacyPosting(msg);
  });
}

module.exports = {
  registerMessageHandlers,
};

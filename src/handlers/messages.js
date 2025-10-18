const { CONFIG, STATES } = require("../config");
const { sendToChannel } = require("../telegram");
const { saveUserPost } = require("../database");
const { getUserState, clearUserState, waitingForForward } = require("../state");

function registerMessageHandlers(bot) {
  async function handleMessagePosting(msg) {
    const chatId = msg.chat.id;
    const userState = getUserState(chatId);

    if (!userState || userState.state !== STATES.WAITING_MESSAGE) {
      return false;
    }

    console.log(`📤 Mengirim pesan dari ${chatId} ke channel ${CONFIG.CHANNEL_ID}`);
    console.log(`📎 Kategori: ${userState.category}`);

    try {
      const caption = msg.caption || msg.text || "";
      const messageText = `${userState.category}\n\n${caption}`;
      const userId = msg.from.id;
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
        await bot.sendMessage(chatId, "⚠️ Tipe pesan ini tidak didukung. Silakan kirim teks, foto, video, atau dokumen.");
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

    console.log(`📤 Mengirim pesan dari ${chatId} ke channel ${CONFIG.CHANNEL_ID}`);

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

    if (msg.text && msg.text.startsWith("/")) return;
    if (msg.text && /#anjem\b/i.test(msg.text)) return;

    const isPosted = await handleMessagePosting(msg);
    if (isPosted) return;

    await handleLegacyPosting(msg);
  });
}

module.exports = {
  registerMessageHandlers,
};

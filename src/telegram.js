const { CONFIG } = require("./config");
const { buildJoinChannelKeyboard } = require("./keyboards");
const { getJoinChannelMessage } = require("./messages");

async function sendJoinChannelMessage(bot, chatId) {
  await bot.sendMessage(chatId, getJoinChannelMessage(), {
    parse_mode: "HTML",
    reply_markup: buildJoinChannelKeyboard(),
  });
}

async function sendToChannel(bot, message) {
  return bot.sendMessage(CONFIG.CHANNEL_ID, message);
}

module.exports = {
  sendJoinChannelMessage,
  sendToChannel,
};

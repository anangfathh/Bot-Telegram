const TelegramBot = require("node-telegram-bot-api");
const { CONFIG } = require("./config");

function createBot() {
  if (!CONFIG.TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set. Please check your environment configuration.");
  }
  return new TelegramBot(CONFIG.TOKEN, { polling: true });
}

module.exports = {
  createBot,
};

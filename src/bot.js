const TelegramBot = require("node-telegram-bot-api");
const { CONFIG } = require("./config");

function createBot() {
  if (!CONFIG.TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set. Please check your environment configuration.");
  }

  // Create bot without polling initially
  const bot = new TelegramBot(CONFIG.TOKEN, { polling: false });

  // Delete webhook to ensure no conflicts with polling
  bot
    .deleteWebHook()
    .then(() => {
      console.log("✅ Webhook deleted (if any)");
      // Start polling after webhook is cleared
      bot.startPolling({
        interval: 300,
        params: { timeout: 20 },
      });
      console.log("✅ Polling started");
    })
    .catch((err) => {
      console.warn("⚠️ deleteWebHook warning:", err.message || err);
      // Start polling anyway
      bot.startPolling({
        interval: 300,
        params: { timeout: 20 },
      });
    });

  // Handle polling errors
  bot.on("polling_error", (error) => {
    console.error("❌ Polling error:", error && error.message ? error.message : error);

    // Check for 409 Conflict (multiple instances)
    if (error && error.response && error.response.statusCode === 409) {
      console.error("🚨 409 Conflict: Multiple bot instances detected!");
      console.error("   Stopping this instance to prevent conflicts...");

      try {
        bot.stopPolling();
      } catch (e) {
        console.error("   Error stopping polling:", e.message);
      }

      process.exit(1);
    }
  });

  // Handle webhook errors
  bot.on("webhook_error", (err) => {
    console.error("❌ Webhook error:", err && err.message ? err.message : err);
  });

  return bot;
}

module.exports = {
  createBot,
};

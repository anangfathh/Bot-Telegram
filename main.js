// ===============================
// Telegram Channel Forwarding Bot
// Modular Architecture Bootstrap
// ===============================

require("dotenv").config();

const { CONFIG } = require("./src/config");
const { initDatabase } = require("./src/database");
const { createBot } = require("./src/bot");
const { setBotCommands, registerCommandHandlers } = require("./src/handlers/commands");
const { registerCallbackHandlers } = require("./src/handlers/callbacks");
const { registerMessageHandlers } = require("./src/handlers/messages");
const { registerSystemHandlers } = require("./src/handlers/system");
const { startPostScheduler } = require("./src/scheduler");

let bot;

(async () => {
  try {
    await initDatabase();

    bot = createBot();

    console.log("🎉 Bot started!");
    console.log("Channel ID:", CONFIG.CHANNEL_ID);
    console.log("Channel Username:", CONFIG.CHANNEL_USERNAME);

    await setBotCommands(bot);
    registerCommandHandlers(bot);
    registerCallbackHandlers(bot);
    registerMessageHandlers(bot);
    registerSystemHandlers(bot);
    startPostScheduler(bot);

    // Graceful shutdown handlers
    process.once("SIGINT", async () => {
      console.log("\n🛑 SIGINT received, shutting down gracefully...");
      await gracefulShutdown();
    });

    process.once("SIGTERM", async () => {
      console.log("\n🛑 SIGTERM received, shutting down gracefully...");
      await gracefulShutdown();
    });
  } catch (error) {
    console.error("❌ Failed to bootstrap application:", error);

    // If 409 Conflict, retry after delay
    if (error.message && error.message.includes("409 Conflict")) {
      console.log("⚠️ Detected 409 Conflict. Waiting 5 seconds before retry...");
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    } else {
      process.exit(1);
    }
  }
})();

async function gracefulShutdown() {
  try {
    if (bot) {
      console.log("⏳ Stopping bot polling...");
      await bot.stopPolling();
      console.log("✅ Bot polling stopped");
    }

    console.log("✅ Cleanup completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

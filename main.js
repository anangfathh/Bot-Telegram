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

initDatabase();

const bot = createBot();

console.log("🎉 Bot started!");
console.log("Channel ID:", CONFIG.CHANNEL_ID);
console.log("Channel Username:", CONFIG.CHANNEL_USERNAME);

setBotCommands(bot);
registerCommandHandlers(bot);
registerCallbackHandlers(bot);
registerMessageHandlers(bot);
registerSystemHandlers(bot);

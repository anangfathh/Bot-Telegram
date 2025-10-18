function registerSystemHandlers(bot) {
  bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
  });

  bot.on("webhook_error", (error) => {
    console.error("Webhook error:", error);
  });

  const shutdown = () => {
    console.log("\n📴 Shutting down bot gracefully...");
    bot.stopPolling();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

module.exports = {
  registerSystemHandlers,
};

const { closeExpiredPosts } = require("./posts");

const DEFAULT_INTERVAL_MS = Number(process.env.POST_AUTO_CLOSE_INTERVAL_MS || 60 * 1000);

function startPostScheduler(bot, intervalMs = DEFAULT_INTERVAL_MS) {
  const effectiveInterval = Number(intervalMs) > 0 ? Number(intervalMs) : DEFAULT_INTERVAL_MS;

  setInterval(async () => {
    try {
      const closed = await closeExpiredPosts(bot);
      if (closed.length > 0) {
        console.log(`Auto-closed ${closed.length} post(s).`);
      }
    } catch (error) {
      console.error("Failed to auto-close posts:", error.message);
    }
  }, effectiveInterval).unref();
}

module.exports = {
  startPostScheduler,
};

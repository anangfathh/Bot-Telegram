const { CONFIG } = require("./config");

async function isUserMemberOfChannel(bot, userId) {
  try {
    const chatMember = await bot.getChatMember(CONFIG.CHANNEL_ID, userId);
    const validStatuses = ["creator", "administrator", "member"];
    return validStatuses.includes(chatMember.status);
  } catch (error) {
    console.error("Error checking membership:", error.message);
    return false;
  }
}

module.exports = {
  isUserMemberOfChannel,
};

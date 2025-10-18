const { buildMainMenuKeyboard, buildMagerMenuKeyboard } = require("../keyboards");
const { getWelcomeMessage, getHelpMessage } = require("../messages");
const { sendJoinChannelMessage } = require("../telegram");
const { waitingForForward } = require("../state");
const { isUserMemberOfChannel } = require("../membership");

async function setBotCommands(bot) {
  const commands = [
    { command: "start", description: "Start the bot and start to make a post" },
    { command: "mager", description: "Post #anjem #jastip #openanjem #openjastip" },
    { command: "help", description: "Show help and tutorial" },
  ];

  try {
    await bot.setMyCommands(commands);
    console.log("✅ Bot commands menu set successfully!");
  } catch (err) {
    console.error("❌ Failed to set bot commands:", err.message);
  }
}

function registerCommandHandlers(bot) {
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";

    const isMember = await isUserMemberOfChannel(bot, userId);
    const welcomeText = getWelcomeMessage(firstName, isMember);

    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: "HTML",
      reply_markup: buildMainMenuKeyboard(),
    });
  });

  bot.onText(/\/mager/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const isMember = await isUserMemberOfChannel(bot, userId);

    if (!isMember) {
      await sendJoinChannelMessage(bot, chatId);
      return;
    }

    await bot.sendMessage(chatId, "📌 Select mager", {
      reply_markup: buildMagerMenuKeyboard(false),
    });
  });

  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, getHelpMessage(), {
      parse_mode: "HTML",
    });
  });

  bot.onText(/#anjem\b/i, (msg) => {
    const chatId = msg.chat.id;
    waitingForForward.set(chatId, true);
    bot.sendMessage(chatId, "Tag #anjem diterima ✅. Silakan kirim pesan yang ingin diposting ke channel.");
  });
}

module.exports = {
  setBotCommands,
  registerCommandHandlers,
};

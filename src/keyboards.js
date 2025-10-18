const { CONFIG, CALLBACK_DATA } = require("./config");

function buildMainMenuKeyboard() {
  return {
    inline_keyboard: [[{ text: "🎯 Lalala Mager 🏃", callback_data: CALLBACK_DATA.MENU_MAGER }]],
  };
}

function buildMagerMenuKeyboard(includeMainMenu = false) {
  const buttons = [
    [
      { text: "📮 Post Mager", callback_data: CALLBACK_DATA.POST_MAGER },
      { text: "📋 My Magers", callback_data: CALLBACK_DATA.MY_MAGERS },
    ],
    [
      { text: "📦 Close Mager", callback_data: CALLBACK_DATA.CLOSE_MAGER },
      { text: "📝 Edit Post", callback_data: CALLBACK_DATA.EDIT_POST },
    ],
    [
      { text: "💰 Check Price", callback_data: CALLBACK_DATA.CHECK_PRICE },
      { text: "⭐ Rating", callback_data: CALLBACK_DATA.RATING },
      { text: "✅ Check Verified", callback_data: CALLBACK_DATA.CHECK_VERIFIED },
    ],
  ];

  if (includeMainMenu) {
    buttons.push([{ text: "🏠 Main Menu", callback_data: CALLBACK_DATA.BACK_TO_MAIN }]);
  }

  buttons.push([{ text: "❌ Close", callback_data: CALLBACK_DATA.CLOSE_MENU }]);

  return { inline_keyboard: buttons };
}

function buildCategoryKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "#ANJEM 🚗", callback_data: CALLBACK_DATA.CATEGORY_ANJEM },
        { text: "#JASTIP 🛍️", callback_data: CALLBACK_DATA.CATEGORY_JASTIP },
      ],
      [
        { text: "#OPENANJEM 🚗", callback_data: CALLBACK_DATA.CATEGORY_OPENANJEM },
        { text: "#OPENJASTIP 🛍️", callback_data: CALLBACK_DATA.CATEGORY_OPENJASTIP },
      ],
      [{ text: "📖 Read Rules", url: "https://t.me/+AcwluKqZkCtiYTc1" }],
      [{ text: "🔙 back", callback_data: CALLBACK_DATA.BACK_TO_MAGER }],
    ],
  };
}

function buildJoinChannelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "📢 Join Channel", url: `https://t.me/${CONFIG.CHANNEL_USERNAME.replace("@", "")}` }],
      [{ text: "✅ Saya Sudah Join", callback_data: CALLBACK_DATA.CHECK_MEMBERSHIP }],
    ],
  };
}

module.exports = {
  buildMainMenuKeyboard,
  buildMagerMenuKeyboard,
  buildCategoryKeyboard,
  buildJoinChannelKeyboard,
};

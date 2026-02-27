const { CONFIG, CALLBACK_DATA } = require("./config");

function buildMainMenuKeyboard() {
  return {
    inline_keyboard: [[{ text: "Go Now", callback_data: CALLBACK_DATA.MENU_MAGER }], [{ text: "Daftar Driver", callback_data: CALLBACK_DATA.DRIVER_MENU }]],
  };
}

function buildMagerMenuKeyboard(includeMainMenu = false) {
  const buttons = [
    [
      { text: "📬 Post GO", callback_data: CALLBACK_DATA.POST_MAGER },
      { text: "⏱️ History", callback_data: CALLBACK_DATA.MY_MAGERS },
    ],
    [
      { text: "⛔ Close GO", callback_data: CALLBACK_DATA.CLOSE_MAGER },
      { text: "✏️ Edit Post", callback_data: CALLBACK_DATA.EDIT_POST },
    ],
    [
      { text: "🔍 Tarif Check", callback_data: CALLBACK_DATA.CHECK_PRICE },
      { text: "⭐ Rating", callback_data: CALLBACK_DATA.RATING },
      { text: "✅ Driver Status", callback_data: CALLBACK_DATA.CHECK_DRIVER },
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
        { text: "#ANJEM 🏍️", callback_data: CALLBACK_DATA.CATEGORY_ANJEM },
        { text: "#JASTIP 🚚", callback_data: CALLBACK_DATA.CATEGORY_JASTIP },
      ],
      [
        { text: "#OPENANJEM 🏍️", callback_data: CALLBACK_DATA.CATEGORY_OPENANJEM },
        { text: "#OPENJASTIP 🚚", callback_data: CALLBACK_DATA.CATEGORY_OPENJASTIP },
      ],
      [{ text: "📜 Read Rules", url: "https://t.me/+AcwluKqZkCtiYTc1" }],
      [{ text: "🔙 Back", callback_data: CALLBACK_DATA.BACK_TO_MAGER }],
    ],
  };
}

function buildJoinChannelKeyboard() {
  return {
    inline_keyboard: [[{ text: "🤝 Join Channel", url: `https://t.me/${CONFIG.CHANNEL_USERNAME.replace("@", "")}` }], [{ text: "✅ Saya Sudah Join", callback_data: CALLBACK_DATA.CHECK_MEMBERSHIP }]],
  };
}

function buildDriverMenuKeyboard(isDriver, isAdmin = false) {
  const keyboard = [[{ text: "Hubungi Admin Driver", callback_data: CALLBACK_DATA.DRIVER_CONTACT }]];

  if (isDriver && CONFIG.DRIVER_GROUP_INVITE_LINK) {
    keyboard.push([{ text: "Link Group Driver", url: CONFIG.DRIVER_GROUP_INVITE_LINK }]);
  }

  keyboard.push([{ text: "Status Driver Saya", callback_data: CALLBACK_DATA.DRIVER_STATUS }]);

  if (isAdmin) {
    keyboard.push([
      { text: "Tambah Driver", callback_data: CALLBACK_DATA.DRIVER_ADD },
      { text: "Perpanjang Driver", callback_data: CALLBACK_DATA.DRIVER_RENEW },
    ]);
    keyboard.push([{ text: "Hapus Driver", callback_data: CALLBACK_DATA.DRIVER_REMOVE }]);
  }

  keyboard.push([{ text: "🏠 Main Menu", callback_data: CALLBACK_DATA.BACK_TO_MAIN }]);

  return { inline_keyboard: keyboard };
}

module.exports = {
  buildMainMenuKeyboard,
  buildMagerMenuKeyboard,
  buildCategoryKeyboard,
  buildJoinChannelKeyboard,
  buildDriverMenuKeyboard,
};

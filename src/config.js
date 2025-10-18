const CONFIG = {
  TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  CHANNEL_USERNAME: "@cobaanjem",
};

const STATES = {
  IDLE: "idle",
  SELECTING_CATEGORY: "selecting_category",
  WAITING_MESSAGE: "waiting_message",
};

const CALLBACK_DATA = {
  MENU_MAGER: "menu_mager",
  POST_MAGER: "post_mager",
  MY_MAGERS: "my_magers",
  CLOSE_MAGER: "close_mager",
  EDIT_POST: "edit_post",
  CHECK_PRICE: "check_price",
  RATING: "rating",
  CHECK_VERIFIED: "check_verified",
  BACK_TO_MAIN: "back_to_main",
  BACK_TO_MAGER: "back_to_mager",
  CLOSE_MENU: "close_menu",
  CHECK_MEMBERSHIP: "check_membership",
  CATEGORY_ANJEM: "category_anjem",
  CATEGORY_JASTIP: "category_jastip",
  CATEGORY_OPENANJEM: "category_openanjem",
  CATEGORY_OPENJASTIP: "category_openjastip",
};

const CATEGORIES = {
  ANJEM: "#ANJEM",
  JASTIP: "#JASTIP",
  OPENANJEM: "#OPENANJEM",
  OPENJASTIP: "#OPENJASTIP",
};

module.exports = {
  CONFIG,
  STATES,
  CALLBACK_DATA,
  CATEGORIES,
};

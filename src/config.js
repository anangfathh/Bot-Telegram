const CONFIG = {
  TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  CHANNEL_USERNAME: process.env.TELEGRAM_CHANNEL_USERNAME || "@cobaanjem",
  DRIVER_CONTACT_USERNAME: process.env.DRIVER_CONTACT_USERNAME || "@youradmin",
  DRIVER_GROUP_ID: process.env.DRIVER_GROUP_ID || null,
  DRIVER_GROUP_INVITE_LINK: process.env.DRIVER_GROUP_INVITE_LINK || null,
  DRIVER_DEFAULT_ACTIVE_DAYS: Number(process.env.DRIVER_DEFAULT_ACTIVE_DAYS || 30),
  DRIVER_ADMIN_IDS: (process.env.DRIVER_ADMIN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value)),
};

const STATES = {
  IDLE: "idle",
  SELECTING_CATEGORY: "selecting_category",
  WAITING_MESSAGE: "waiting_message",
  AWAITING_DRIVER_INPUT: "awaiting_driver_input",
  AWAITING_EDIT_MESSAGE: "awaiting_edit_message",
  AWAITING_PRICE_INPUT: "awaiting_price_input",
};

const DATABASE = {
  HOST: process.env.DB_HOST || "localhost",
  PORT: Number(process.env.DB_PORT || 3306),
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "",
  NAME: process.env.DB_NAME || "mager_bot",
  CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

const CALLBACK_DATA = {
  MENU_MAGER: "menu_mager",
  POST_MAGER: "post_mager",
  MY_MAGERS: "my_magers",
  CLOSE_MAGER: "close_mager",
  EDIT_POST: "edit_post",
  CHECK_PRICE: "check_price",
  RATING: "rating",
  CHECK_DRIVER: "check_driver",
  PRICE_RAIN_YES: "price_rain_yes",
  PRICE_RAIN_NO: "price_rain_no",
  BACK_TO_MAIN: "back_to_main",
  BACK_TO_MAGER: "back_to_mager",
  CLOSE_MENU: "close_menu",
  CHECK_MEMBERSHIP: "check_membership",
  DRIVER_MENU: "driver_menu",
  DRIVER_CONTACT: "driver_contact",
  DRIVER_STATUS: "driver_status",
  DRIVER_ADD: "driver_add",
  DRIVER_RENEW: "driver_renew",
  DRIVER_REMOVE: "driver_remove",
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

const POST_EXPIRATION = {
  [CATEGORIES.ANJEM]: 60 * 60 * 1000,
  [CATEGORIES.JASTIP]: 5 * 60 * 60 * 1000,
  [CATEGORIES.OPENANJEM]: 24 * 60 * 60 * 1000,
  [CATEGORIES.OPENJASTIP]: 24 * 60 * 60 * 1000,
};

module.exports = {
  CONFIG,
  STATES,
  CALLBACK_DATA,
  CATEGORIES,
  DATABASE,
  POST_EXPIRATION,
};

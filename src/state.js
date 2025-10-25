const userStates = new Map();
const waitingForForward = new Map();

function getUserState(chatId) {
  return userStates.get(chatId) || null;
}

function setUserState(chatId, state, data = null) {
  const stateData = { state };

  if (data !== null && data !== undefined) {
    if (typeof data === "object" && !Array.isArray(data)) {
      Object.assign(stateData, data);
    } else {
      stateData.category = data;
    }
  }

  userStates.set(chatId, stateData);
}

function clearUserState(chatId) {
  userStates.delete(chatId);
}

module.exports = {
  getUserState,
  setUserState,
  clearUserState,
  waitingForForward,
};

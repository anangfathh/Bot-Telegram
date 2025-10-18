const userStates = new Map();
const waitingForForward = new Map();

function getUserState(chatId) {
  return userStates.get(chatId) || null;
}

function setUserState(chatId, state, category = null) {
  const stateData = { state };
  if (category) {
    stateData.category = category;
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

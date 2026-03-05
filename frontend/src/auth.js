const ADMIN_TOKEN_KEY = "admin_auth_token";
const ADMIN_USER_KEY = "admin_auth_user";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function getAuthToken() {
  const storage = getStorage();
  return storage ? storage.getItem(ADMIN_TOKEN_KEY) : null;
}

export function getAuthUser() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(ADMIN_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }) {
  const storage = getStorage();
  if (!storage || !token) {
    return;
  }

  storage.setItem(ADMIN_TOKEN_KEY, token);
  if (user) {
    storage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(ADMIN_TOKEN_KEY);
  storage.removeItem(ADMIN_USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

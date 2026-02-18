/**
 * Authentication module for Pawpal
 * Manages user authentication state and JWT tokens
 */

const AUTH_TOKEN_KEY = "pawpal_token";
const AUTH_USER_KEY = "pawpal_user";

/**
 * Get stored auth token
 * @returns {string|null} JWT token or null
 */
function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get stored user info
 * @returns {Object|null} User object or null
 */
function getAuthUser() {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
function isAuthenticated() {
  return getAuthToken() !== null;
}

/**
 * Store auth token and user info
 * @param {string} token - JWT token
 * @param {Object} user - User object
 */
function setAuth(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth token and user info
 */
function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Require authentication - redirect to login if not authenticated
 * @param {string} redirectUrl - URL to redirect to after login
 */
function requireAuth(redirectUrl = window.location.href) {
  if (!isAuthenticated()) {
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
    return false;
  }
  return true;
}

export {
  getAuthToken,
  getAuthUser,
  isAuthenticated,
  setAuth,
  clearAuth,
  requireAuth,
};



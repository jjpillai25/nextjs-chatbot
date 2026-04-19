/**
 * Authentication and user data management utilities
 * Handles localStorage operations for auth tokens and user information
 */

/**
 * Save authentication data after successful login
 */
export function saveAuthData(accessToken, userEmail, userId) {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("user_email", userEmail);
  localStorage.setItem("user_id", userId);
}

/**
 * Clear all authentication data on logout
 */
export function clearAuthData() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_id");
}

/**
 * Get authentication token
 */
export function getAccessToken() {
  return localStorage.getItem("access_token");
}

/**
 * Get current user email
 */
export function getUserEmail() {
  return localStorage.getItem("user_email") || "";
}

/**
 * Get current user ID
 */
export function getUserId() {
  return localStorage.getItem("user_id") || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Get user initials from email for avatar
 */
export function getUserInitials() {
  const email = getUserEmail();
  return email.split("@")[0].slice(0, 2).toUpperCase() || "U";
}

// Custom error class for backend unavailability
export class BackendUnavailableError extends Error {
  constructor(message = "Backend service unavailable") {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

const API_BASE_URL = "https://techpals-chatbot.onrender.com";

/**
 * Wrapper for API fetch requests with error handling
 */
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    // Handle network errors or 500+ status codes
    if (!response.ok) {
      if (response.status >= 500) {
        throw new BackendUnavailableError(`Server error: ${response.status}`);
      }
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (error) {
    // If it's a network error or already a BackendUnavailableError, re-throw
    if (error instanceof BackendUnavailableError) {
      throw error;
    }
    if (error instanceof TypeError) {
      // Network errors throw TypeError
      throw new BackendUnavailableError("Unable to connect to backend service");
    }
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(userId, initialMessage) {
  return apiFetch("/conversations", {
    method: "POST",
    body: JSON.stringify({ user_id: parseInt(userId), first_message: initialMessage }),
  });
}

/**
 * Get all conversations for a user
 */
export async function getConversations(userId) {
  return apiFetch(`/conversations/${parseInt(userId)}`);
}

/**
 * Get messages for a specific conversation
 */
export async function getChatMessages(conversationId, userId) {
  return apiFetch(`/chat/${parseInt(conversationId)}?user_id=${parseInt(userId)}`);
}

/**
 * Send a chat message
 */
export async function sendChatMessage(conversationId, userId, message) {
  return apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId || null,
      user_id: parseInt(userId),
      message: message,
    }),
  });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId, userId) {
  return apiFetch(`/conversations/${parseInt(conversationId)}`, {
    method: "DELETE",
    body: JSON.stringify({ user_id: parseInt(userId) }),
  });
}

/**
 * Reset chat history
 */
export async function resetChat(userId, conversationId) {
  return apiFetch("/reset", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId || 0,
      user_id: parseInt(userId),
      message: "",
    }),
  });
}

/**
 * User signup
 */
export async function signUp(email, password) {
  return apiFetch("/users/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * User login
 */
export async function login(email, password) {
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

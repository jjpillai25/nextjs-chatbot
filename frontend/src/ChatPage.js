import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import ReactMarkdown from "react-markdown";
import ServiceUnavailable from "./ServiceUnavailable";
import { getConversations, getChatMessages, sendChatMessage, deleteConversation, resetChat, BackendUnavailableError } from "./api";
import { getUserId, getUserEmail, getUserInitials, clearAuthData } from "./auth";

function ChatPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [backendDown, setBackendDown] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const userEmail = getUserEmail();
  const userId = getUserId();
  const userInitials = getUserInitials();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Fetch conversations - memoized to prevent infinite loops
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getConversations(userId);
      setConversations(data);
      setBackendDown(false);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
      } else {
        console.error("Failed to load conversations:", err);
      }
    }
  }, [userId]);

  // Load all conversations on startup
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleLogout = () => {
    clearAuthData();
    setConversations([]);
    setChat([]);
    setConversationId(null);
    navigate("/login");
  };

  // Load messages for a conversation when clicked
  const loadConversation = async (convId) => {
    try {
      const data = await getChatMessages(convId, userId);
      const formatted = data.map((msg) => ({
        sender: msg.role,
        text: msg.context,
      }));
      setChat(formatted);
      setConversationId(convId);
      setBackendDown(false);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
      } else {
        console.error("Failed to load messages:", err);
      }
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!message.trim() && !attachment) || !userId) return;
    const newChat = [...chat, { sender: "user", text: message, attachment: attachment ? { name: attachment.name, type: attachment.type, data: URL.createObjectURL(attachment) } : null }];
    setChat(newChat);
    setMessage("");
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true);

    try {
      let currentConversationId = conversationId;

      /*if (!currentConversationId) {
        const convData = await createConversation(userId, message);
        currentConversationId = convData.id;
        setConversationId(currentConversationId);
        fetchConversations();
      }*/

      const data = await sendChatMessage(currentConversationId, userId, message);

      if (!currentConversationId) {
        setConversationId(data.currentConversationId);
        fetchConversations();
      }
      
      setChat([...newChat, { sender: "bot", text: data.response }]);
      setBackendDown(false);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
        setChat([...newChat, { sender: "bot", text: "Sorry, the service is temporarily unavailable. Please try again later." }]);
      } else {
        setChat([...newChat, { sender: "bot", text: "Sorry, something went wrong. Please try again." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = async () => {
    if (!userId) return;
    try {
      await resetChat(userId, conversationId);
      setBackendDown(false);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
      } else {
        console.error("Failed to reset chat:", err);
      }
    }
    setChat([]);
    setConversationId(null);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!userId || !convId) return;
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await deleteConversation(convId, userId);
      // If we're deleting the current conversation, reset chat
      if (convId === conversationId) {
        setChat([]);
        setConversationId(null);
      }
      // Refresh conversations list
      fetchConversations();
      setBackendDown(false);
    } catch (err) {
      if (err instanceof BackendUnavailableError) {
        setBackendDown(true);
      } else {
        console.error("Failed to delete conversation:", err);
        alert("Error deleting conversation");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const handleRetry = () => {
    setBackendDown(false);
    fetchConversations();
  };
  // Filter conversations based on search query
  const filteredConversations = searchQuery.trim() === ""
    ? conversations
    : conversations.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  if (backendDown) {
    return <ServiceUnavailable onRetry={handleRetry} message="Service Temporarily Unavailable - Unable to connect to backend" />;
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarExpanded ? "sidebar--expanded" : "sidebar--collapsed"}`}>
        <div className="sidebar__top">
          <button
            className="sidebar__toggle"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            title="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="6" y1="1" x2="6" y2="17" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {sidebarExpanded && (
            <>
              <button className="sidebar__action" onClick={handleResetChat}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 2H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>New chat</span>
              </button>

              <div className="sidebar__search-container">
                <button className="sidebar__action" onClick={() => setSearchOpen(!searchOpen)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>Search chats</span>
                </button>
                {searchOpen && (
                  <input
                    type="text"
                    className="sidebar__search-input"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus
                  />
                )}
              </div>

              {/* Conversation history */}
              <div className="sidebar__history">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`sidebar__conversation-wrapper ${conv.id === conversationId ? "sidebar__conversation-wrapper--active" : ""}`}
                    >
                      <button
                        className={`sidebar__conversation ${conv.id === conversationId ? "sidebar__conversation--active" : ""}`}
                        onClick={() => loadConversation(conv.id)}
                      >
                        <span className="sidebar__conversation-title">{conv.title}</span>
                      </button>
                      <button
                        className="sidebar__conversation-delete"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        title="Delete conversation"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                          <circle cx="13" cy="8" r="1.5" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : searchQuery.trim() !== "" ? (
                  <div className="sidebar__no-results">No results found</div>
                ) : null}
              </div>
            </>
          )}

          {!sidebarExpanded && (
            <>
              <button className="sidebar__icon-btn" onClick={handleResetChat} title="New chat">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 2H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button className="sidebar__icon-btn" title="Search">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="sidebar__footer">
          <div className="user-bubble-container">
            <button
              className="user-bubble"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title={userEmail}
            >
              {userInitials}
            </button>
            {showUserDropdown && (
              <div className="user-dropdown">
                <div className="user-dropdown__email">{userEmail}</div>
                <button
                  className="user-dropdown__logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar__brand">
            <div className="topbar__logo">
              <svg width="48" height="38" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="1" width="44" height="30" rx="4" stroke="#1a1a1a" strokeWidth="2.4" fill="white"/>
                <path d="M9.5 13.5 Q12 10 14.5 13.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M11.2 15.5 Q12 14.2 12.8 15.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M26.5 13.5 Q29 10 31.5 13.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M28.2 15.5 Q29 14.2 29.8 15.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M14 21 Q21 27 34 21" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <rect x="0" y="33" width="48" height="4" rx="2" fill="#1a1a1a"/>
              </svg>
            </div>
            <span className="topbar__name">TechPals</span>
          </div>
          <span className="topbar__model">GPT OSS 120B</span>
        </header>

        <div className="chat-area">
          <div className="chat-messages">
            {chat.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble--${msg.sender}`}>
                {msg.sender === "bot" && (
                  <div className="chat-bubble__avatar chat-bubble__avatar--bot">TP</div>
                )}
                <div className={`chat-bubble__content chat-bubble__content--${msg.sender}`}>
                  {msg.attachment && (
                    <div className="chat-attachment">
                      {msg.attachment.type && msg.attachment.type.startsWith("image/") ? (
                        <div className="chat-attachment__image-container">
                          <img src={msg.attachment.data} alt="Attachment" className="chat-attachment__image" />
                        </div>
                      ) : (
                        <div className="chat-attachment__file-badge">
                          📄 {msg.attachment.name}
                        </div>
                      )}
                    </div>
                  )}
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.sender === "user" && (
                  <div className="chat-bubble__avatar chat-bubble__avatar--user">{userInitials}</div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble chat-bubble--bot">
                <div className="chat-bubble__avatar chat-bubble__avatar--bot">TP</div>
                <div className="chat-bubble__content chat-bubble__content--bot">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/gif,.pdf,.doc,.docx"
              style={{ display: "none" }}
            />
            {attachment && (
              <div className="attachment-preview">
                {attachment.type && attachment.type.startsWith("image/") ? (
                  <div className="attachment-preview__image">
                    <img src={URL.createObjectURL(attachment)} alt="Preview" />
                    <button className="attachment-preview__remove" onClick={removeAttachment}>×</button>
                  </div>
                ) : (
                  <div className="attachment-preview__file">
                    <div className="attachment-preview__file-info">
                      📄 {attachment.name}
                    </div>
                    <button className="attachment-preview__remove" onClick={removeAttachment}>×</button>
                  </div>
                )}
              </div>
            )}
            <div className="chat-input-wrapper">
              <button
                className="attachment-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
              >
                📎
              </button>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                onKeyDown={handleKeyDown}
                className="chat-input"
              />
              <button onClick={sendMessage} disabled={isLoading} className="send-btn">
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ChatPage;

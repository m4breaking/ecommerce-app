import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId] = useState(() => localStorage.getItem('chatSessionId') || Date.now().toString());
  const [lastReadTime, setLastReadTime] = useState(() => localStorage.getItem('lastReadTime') || null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    localStorage.setItem('chatSessionId', sessionId);
    loadMessages();
  }, [sessionId]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/chat/${sessionId}`);
      const data = await response.json();
      setMessages(data);
      
      // Count unread admin messages (messages after last read time)
      if (lastReadTime) {
        const unreadAdminMessages = data.filter(
          msg => msg.sender === 'admin' && new Date(msg.created_at) > new Date(lastReadTime)
        );
        setUnreadCount(unreadAdminMessages.length);
      } else {
        // If no last read time, count all admin messages as unread
        const adminMessages = data.filter(msg => msg.sender === 'admin');
        setUnreadCount(adminMessages.length);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
    setLastReadTime(new Date().toISOString());
    localStorage.setItem('lastReadTime', new Date().toISOString());
  };

  return (
    <ChatContext.Provider value={{ unreadCount, resetUnreadCount, sessionId }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

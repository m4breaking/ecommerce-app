import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId] = useState(() => localStorage.getItem('chatSessionId') || Date.now().toString());
  const [lastMessageCount, setLastMessageCount] = useState(0);
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
      
      // Check for new admin messages
      if (data.length > lastMessageCount) {
        const newMessages = data.slice(lastMessageCount);
        const adminMessages = newMessages.filter(msg => msg.sender === 'admin');
        setUnreadCount(prev => prev + adminMessages.length);
      }
      setLastMessageCount(data.length);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
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

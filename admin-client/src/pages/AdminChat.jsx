import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE } from '../config';

const AdminChat = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessageCounts, setLastMessageCounts] = useState({});
  const chatEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const sessionsPollingRef = useRef(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    loadSessions();
    
    // Poll for sessions every 5 seconds
    sessionsPollingRef.current = setInterval(() => {
      loadSessions();
    }, 5000);

    return () => {
      if (sessionsPollingRef.current) {
        clearInterval(sessionsPollingRef.current);
      }
    };
  }, [admin, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for new messages in sessions and update unread counts
  useEffect(() => {
    sessions.forEach(session => {
      const lastCount = lastMessageCounts[session.session_id] || 0;
      if (session.message_count > lastCount && selectedSession !== session.session_id) {
        const newCount = session.message_count - lastCount;
        setUnreadCounts(prev => ({
          ...prev,
          [session.session_id]: (prev[session.session_id] || 0) + newCount
        }));
        
        // Show browser notification for new customer messages
        if (newCount > 0 && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${session.username || 'Customer'}`, {
            body: session.last_message,
            icon: '/favicon.ico'
          });
        }
      }
      setLastMessageCounts(prev => ({
        ...prev,
        [session.session_id]: session.message_count
      }));
    });
  }, [sessions, lastMessageCounts, selectedSession]);

  // Reset unread count when session is selected
  useEffect(() => {
    if (selectedSession) {
      setUnreadCounts(prev => ({
        ...prev,
        [selectedSession]: 0
      }));
    }
  }, [selectedSession]);

  // Auto-refresh messages when a session is selected
  useEffect(() => {
    if (selectedSession) {
      // Load messages immediately
      loadMessages(selectedSession);
      
      // Set up polling every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        loadMessages(selectedSession);
      }, 3000);
    } else {
      // Clear polling when no session is selected
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }

    // Cleanup on unmount or when session changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedSession]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/chat/admin/sessions`);
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE}/chat/${sessionId}`);
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSessionSelect = (sessionId) => {
    setSelectedSession(sessionId);
    loadMessages(sessionId);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedSession) return;

    try {
      await fetch(`${API_BASE}/chat/admin/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession,
          message: replyMessage.trim()
        })
      });
      
      setReplyMessage('');
      loadMessages(selectedSession);
      // Don't reload sessions - polling will handle it
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-white/10 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/home"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Analytics
              </Link>
              <Link
                to="/orders"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Orders
              </Link>
              <Link
                to="/users"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Users
              </Link>
              <button
                onClick={handleLogoutClick}
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Logout
              </button>
              <a
                href="https://ecommerce-app-eosin-omega.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                View Store
              </a>
            </div>
          </div>
        </div>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 max-w-sm w-full mx-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Confirm Logout</h3>
            <p className="text-purple-200 mb-4">Are you sure you want to logout?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Live Chat Management</h1>
          <button
            onClick={loadSessions}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1 bg-white/10 backdrop-blur-md rounded-lg shadow-md border border-white/20">
            <h2 className="text-lg font-semibold text-white p-4 border-b border-white/20">Chat Sessions</h2>
            <div className="max-h-[600px] overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="p-4 text-purple-200 text-center">No active sessions</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.session_id}
                    onClick={() => handleSessionSelect(session.session_id)}
                    className={`p-4 cursor-pointer hover:bg-white/10 relative ${
                      selectedSession === session.session_id ? 'bg-indigo-500/20' : ''
                    }`}
                  >
                    {unreadCounts[session.session_id] > 0 && (
                      <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCounts[session.session_id] > 9 ? '9+' : unreadCounts[session.session_id]}
                      </span>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">
                          {session.username ? session.username : `Session ${session.session_id.slice(-6)}`}
                          {session.user_id && <span className="text-xs text-purple-200 ml-2">(ID: {session.user_id})</span>}
                        </p>
                        <p className="text-xs text-purple-200 mt-1">
                          {new Date(session.last_message_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-purple-200 mt-2 truncate">
                      {session.last_message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-lg shadow-md border border-white/20 flex flex-col">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-white/20">
                  <h2 className="text-lg font-semibold text-white">
                    {sessions.find(s => s.session_id === selectedSession)?.username || `Session ${selectedSession.slice(-6)}`}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                  {messages.length === 0 ? (
                    <p className="text-purple-200 text-center py-8">No messages yet</p>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender === 'customer'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendReply} className="p-4 border-t border-white/20">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 border border-white/20 rounded-md px-3 py-2 bg-white/10 text-white placeholder-purple-200"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-purple-200">Select a session to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;

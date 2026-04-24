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
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    loadSessions();
  }, [admin, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      loadSessions();
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {admin?.name}</span>
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
              >
                Analytics
              </Link>
              <Link
                to="/orders"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
              >
                Orders
              </Link>
              <Link
                to="/users"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
              >
                Users
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
              >
                Logout
              </button>
              <a
                href="http://localhost:3000"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium"
              >
                View Store
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Chat Management</h1>
          <button
            onClick={loadSessions}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Active Chats ({sessions.length})</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {sessions.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">No active chats</div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.session_id}
                      onClick={() => handleSessionSelect(session.session_id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedSession === session.session_id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">Session {session.session_id.slice(-6)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(session.last_message_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 truncate">
                        {session.last_message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {!selectedSession ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>Select a chat to view messages</p>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender === 'customer'
                              ? 'bg-gray-200 text-gray-900'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {msg.sender === 'customer' ? 'Customer' : 'You'}
                          </p>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Reply Input */}
                  <form onSubmit={sendReply} className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2"
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;

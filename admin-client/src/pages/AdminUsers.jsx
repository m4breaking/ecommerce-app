import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE } from '../config';

const AdminUsers = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    loadUsers();
    loadStats();
  }, [admin, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
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
                to="/chat"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Live Chat
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
        <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-200">Total Users</p>
                  <p className="text-2xl font-semibold text-white">{stats.total_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-200">Active Users</p>
                  <p className="text-2xl font-semibold text-white">{stats.active_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/20 text-yellow-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-200">New This Month</p>
                  <p className="text-2xl font-semibold text-white">{stats.new_users}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md overflow-hidden border border-white/20">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-white/20">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.role || 'user'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

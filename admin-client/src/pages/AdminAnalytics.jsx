import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE } from '../config';

const AdminAnalytics = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    loadAnalytics();
  }, [admin, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/orders/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h1>

        {!analytics ? (
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-8 border border-white/20 text-center">
            <p className="text-purple-200">No analytics data available</p>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
                <h3 className="text-sm font-medium text-purple-200 mb-2">Total Orders</h3>
                <p className="text-3xl font-bold text-white">{analytics.overview?.total_orders || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
                <h3 className="text-sm font-medium text-purple-200 mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold text-white">৳{(analytics.overview?.total_revenue || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
                <h3 className="text-sm font-medium text-purple-200 mb-2">Avg Order Value</h3>
                <p className="text-3xl font-bold text-white">৳{(analytics.overview?.avg_order_value || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20">
                <h3 className="text-sm font-medium text-purple-200 mb-2">Pending Orders</h3>
                <p className="text-3xl font-bold text-white">{analytics.overview?.pending_orders || 0}</p>
              </div>
            </div>

            {/* Orders by Status */}
            {analytics.by_status && analytics.by_status.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md p-6 border border-white/20 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Orders by Status</h2>
                <div className="space-y-4">
                  {analytics.by_status.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-48 bg-white/20 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${(item.count / (analytics.overview?.total_orders || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-medium">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {analytics.recent_orders && analytics.recent_orders.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md border border-white/20">
                <h2 className="text-xl font-semibold text-white p-6 border-b border-white/20">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/10 divide-y divide-white/20">
                      {analytics.recent_orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">#{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{order.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">৳{order.total_amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-200">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;

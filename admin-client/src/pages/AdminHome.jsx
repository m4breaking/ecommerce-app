import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminHome = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const stats = [
    { title: 'Products', link: '/dashboard', icon: '📦', color: 'bg-blue-500' },
    { title: 'Orders', link: '/orders', icon: '📋', color: 'bg-green-500' },
    { title: 'Users', link: '/users', icon: '👥', color: 'bg-purple-500' },
    { title: 'Analytics', link: '/analytics', icon: '📊', color: 'bg-orange-500' },
    { title: 'Live Chat', link: '/chat', icon: '💬', color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-white/10 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome Back, {admin?.name}! 👋
          </h1>
          <p className="text-xl text-purple-200">
            Manage your e-commerce store from one central dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer border border-white/20"
            >
              <div className="flex items-center space-x-4">
                <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl`}>
                  {stat.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{stat.title}</h3>
                  <p className="text-purple-200 text-sm">Manage {stat.title.toLowerCase()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors p-3 rounded-lg hover:bg-white/10"
            >
              <span className="text-2xl">➕</span>
              <span>Add New Product</span>
            </Link>
            <Link
              to="/orders"
              className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors p-3 rounded-lg hover:bg-white/10"
            >
              <span className="text-2xl">📦</span>
              <span>View Recent Orders</span>
            </Link>
            <Link
              to="/chat"
              className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors p-3 rounded-lg hover:bg-white/10"
            >
              <span className="text-2xl">💬</span>
              <span>Check Customer Messages</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center space-x-3 text-white hover:text-purple-200 transition-colors p-3 rounded-lg hover:bg-white/10"
            >
              <span className="text-2xl">📊</span>
              <span>View Sales Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE } from '../config';

const AdminOrders = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [admin, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadOrders();
      setShowModal(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
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
                to="/analytics"
                className="text-white hover:text-purple-200 px-3 py-2 rounded-md font-medium"
              >
                Analytics
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
              />
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
        <h1 className="text-3xl font-bold text-white mb-8">Order Management</h1>

        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-md overflow-hidden border border-white/20">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-white/20">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.id}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-medium">{selectedOrder.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{selectedOrder.payment_method.toUpperCase()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium">{selectedOrder.address}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Order Status</p>
                  <div className="flex space-x-2">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          selectedOrder.status === status
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Order Items</p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{item.product_name}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right">৳{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-xl font-bold text-gray-900">
                    Total: ৳{selectedOrder.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

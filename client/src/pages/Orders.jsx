import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/orders/user/${user.id}`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    if (status === 'cancelled') return -1;
    return steps.indexOf(status);
  };

  const OrderTimeline = ({ status }) => {
    const steps = [
      { key: 'pending', label: 'Pending', icon: '📋' },
      { key: 'processing', label: 'Processing', icon: '⚙️' },
      { key: 'shipped', label: 'Shipped', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '✅' }
    ];

    const currentStep = getStatusStep(status);

    if (status === 'cancelled') {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-4 py-2 rounded-full font-medium">
            ❌ Order Cancelled
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between py-4 relative">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 ${
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-300'
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 h-0.5 -translate-x-1/2 w-full ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  style={{ width: 'calc(100% - 1rem)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const downloadInvoice = (order) => {
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .info { margin-bottom: 30px; }
    .info p { margin: 5px 0; }
    .items { margin-bottom: 30px; }
    .items table { width: 100%; border-collapse: collapse; }
    .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    .items th { background-color: #f5f5f5; }
    .total { text-align: right; font-size: 18px; font-weight: bold; }
    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Order #${order.id}</p>
    <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
  </div>
  
  <div class="info">
    <p><strong>Customer:</strong> ${order.name}</p>
    <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
    <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
    <p><strong>Shipping Address:</strong> ${order.address}</p>
    <p><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
  </div>
  
  <div class="items">
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>${item.product_name}</td>
            <td>${item.quantity}</td>
            <td>৳${item.price.toFixed(2)}</td>
            <td>৳${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="total">
    <p>Total: ৳${order.total_amount.toFixed(2)}</p>
  </div>
  
  <div class="footer">
    <p>Thank you for your order!</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't placed any orders yet.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Placed on {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>

              {/* Order Status Timeline */}
              <div className="mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <OrderTimeline status={order.status} />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.product_name} x {item.quantity}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        ৳{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Shipping to: {order.address}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Payment: {order.payment_method.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      Total: ৳{order.total_amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => downloadInvoice(order)}
                      className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

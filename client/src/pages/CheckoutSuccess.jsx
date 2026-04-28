import { useNavigate, useLocation } from 'react-router-dom';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, orderData } = location.state || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-2">Thank you for your purchase. Your order has been received and is being processed.</p>
        {orderId && (
          <p className="text-lg font-semibold text-indigo-600 mb-8">Order ID: #{orderId}</p>
        )}
        <div className="space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 font-semibold"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-gray-200 text-gray-800 px-8 py-3 rounded-md hover:bg-gray-300 font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;

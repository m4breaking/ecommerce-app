import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';

const Cart = () => {
  const navigate = useNavigate();
  const { sessionId, removeFromCart, updateCartItem, clearCart } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, [sessionId]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/cart/${sessionId}`);
      const data = await response.json();
      setCartItems(data);
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(itemId, newQuantity);
    setCartItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemove = (itemId) => {
    removeFromCart(itemId);
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const handleClear = () => {
    clearCart();
    setCartItems([]);
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center p-4 border-b border-gray-200 dark:border-slate-700 last:border-b-0 gap-4">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/100'}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <Link to={`/product/${item.product_id}`} className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                      {item.name}
                    </Link>
                    <p className="text-gray-600 dark:text-gray-300">৳{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className={`w-8 h-8 rounded ${
                        item.quantity >= item.stock
                          ? 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">৳{(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleClear}
              className="mt-4 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              Clear Cart
            </button>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Order Summary</h2>
              <div className="space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-semibold"
              >
                Checkout
              </button>
              <Link
                to="/"
                className="block w-full mt-3 text-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

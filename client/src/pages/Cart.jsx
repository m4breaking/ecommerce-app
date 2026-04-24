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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center p-4 border-b last:border-b-0">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/100'}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1 ml-4">
                    <Link to={`/product/${item.product_id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                      {item.name}
                    </Link>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className={`w-8 h-8 rounded ${
                        item.quantity >= item.stock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-lg font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleClear}
              className="mt-4 text-red-600 hover:text-red-800"
            >
              Clear Cart
            </button>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
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
                className="block w-full mt-3 text-center text-indigo-600 hover:text-indigo-800"
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

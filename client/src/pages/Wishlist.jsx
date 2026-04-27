import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadWishlist();
  }, [user, navigate]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/wishlist/user/${user.id}`);
      const data = await response.json();
      setWishlist(data);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      await fetch(`${API_BASE}/wishlist/${wishlistId}`, { method: 'DELETE' });
      loadWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      alert('Failed to remove from wishlist');
    }
  };

  const moveToCart = async (product) => {
    try {
      await addToCart(product.product_id, product.name, product.price, 1);
      await removeFromWishlist(product.id);
    } catch (err) {
      console.error('Error moving to cart:', err);
      alert('Failed to add to cart');
    }
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your wishlist is empty.</p>
          <Link
            to="/"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <img
                src={item.image_url || 'https://via.placeholder.com/400'}
                alt={item.name}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2 flex-1">{item.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">৳{item.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Stock: {item.stock}</span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => moveToCart(item)}
                    disabled={item.stock === 0}
                    className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="w-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

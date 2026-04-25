import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../api/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { addToCart, removeFromCart, sessionId } = useCart();

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getById(id);
      setProduct(data);
    } catch (err) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const checkIfInCart = () => {
    fetch(`${API_BASE}/cart/${sessionId}`)
      .then(res => res.json())
      .then(items => {
        const cartItem = items.find(item => item.product_id === parseInt(id));
        if (cartItem) {
          setInCart(true);
          setCartItemId(cartItem.id);
        } else {
          setInCart(false);
          setCartItemId(null);
        }
      })
      .catch(err => console.error('Error checking cart:', err));
  };

  const loadReviews = async () => {
    try {
      const [reviewsRes, avgRes] = await Promise.all([
        fetch(`${API_BASE}/reviews/product/${id}`),
        fetch(`${API_BASE}/reviews/product/${id}/average`)
      ]);
      const reviewsData = await reviewsRes.json();
      const avgData = await avgRes.json();
      setReviews(reviewsData);
      setAverageRating(avgData.average_rating);
      setReviewCount(avgData.review_count);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const checkUserReview = async () => {
    if (user) {
      try {
        const res = await fetch(`${API_BASE}/reviews/check?user_id=${user.id}&product_id=${id}`);
        const data = await res.json();
        if (data.hasReviewed) {
          setUserReview(data.review);
        }
      } catch (err) {
        console.error('Error checking user review:', err);
      }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          product_id: parseInt(id),
          rating,
          comment
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      loadReviews();
      checkUserReview();
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    }
  };

  useEffect(() => {
    loadProduct();
    loadReviews();
    checkUserReview();
  }, [id, user]);

  useEffect(() => {
    if (sessionId && product) {
      checkIfInCart();
    }
  }, [sessionId, product]);

  const handleAddToCart = () => {
    if (product && quantity > 0 && quantity <= product.stock) {
      addToCart(product.id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 500);
      setTimeout(() => checkIfInCart(), 600);
    }
  };

  const handleRemoveFromCart = () => {
    if (cartItemId) {
      removeFromCart(cartItemId);
      setInCart(false);
      setCartItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 py-8">
        {error || 'Product not found'}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4 inline-block">
        ← Back to Products
      </Link>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
        <div className="md:flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <img
              src={product.image_url || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
            />
          </div>
          <div className="md:w-1/2 p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">{product.description}</p>
            <div className="mb-6">
              <span className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">৳{product.price.toFixed(2)}</span>
            </div>
            <div className="mb-6">
              <span className={`text-sm ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>
            {product.category && (
              <div className="mb-6">
                <span className="inline-block bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                  {product.category}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-gray-700 dark:text-gray-300">Quantity:</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, product.stock))}
                className="w-20 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                disabled={product.stock === 0}
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addedToCart}
                className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : product.stock > 0
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {addedToCart ? '✓ Added' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              {inCart && (
                <button
                  onClick={handleRemoveFromCart}
                  className="flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-colors bg-red-600 text-white hover:bg-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <Link
              to="/cart"
              className="block w-full mt-3 py-2 px-4 rounded-md font-semibold text-sm text-center transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-400">({reviewCount} reviews)</span>
          </div>
        </div>

        {user && !userReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mb-6 bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Write a Review</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 rounded-full ${star <= rating ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-slate-600'}`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Submit Review
            </button>
          </form>
        )}

        {userReview && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">You have already reviewed this product.</p>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= userReview.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{userReview.comment}</span>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mr-2">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                        {review.user_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{review.user_name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

import { createContext, useContext, useState, useEffect } from 'react';
import { generateSessionId } from '../utils/session';

const API_BASE = 'https://ecommerce-app-8nbo.onrender.com/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const id = localStorage.getItem('sessionId') || generateSessionId();
    localStorage.setItem('sessionId', id);
    setSessionId(id);
  }, []);

  const updateCartCount = () => {
    fetch(`${API_BASE}/cart/${sessionId}`)
      .then(res => res.json())
      .then(items => {
        const safeItems = Array.isArray(items) ? items : [];
        const count = safeItems.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(count);
      })
      .catch(err => console.error('Error fetching cart:', err));
  };

  const addToCart = (productId, quantity = 1) => {
    fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, product_id: productId, quantity })
    })
      .then(res => res.json())
      .then(() => updateCartCount())
      .catch(err => console.error('Error adding to cart:', err));
  };

  const removeFromCart = (itemId) => {
    fetch(`${API_BASE}/cart/${itemId}`, { method: 'DELETE' })
      .then(() => updateCartCount())
      .catch(err => console.error('Error removing from cart:', err));
  };

  const updateCartItem = (itemId, quantity) => {
    fetch(`${API_BASE}/cart/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    })
      .then(() => updateCartCount())
      .catch(err => console.error('Error updating cart:', err));
  };

  const clearCart = () => {
    fetch(`${API_BASE}/cart/session/${sessionId}`, { method: 'DELETE' })
      .then(() => updateCartCount())
      .catch(err => console.error('Error clearing cart:', err));
  };

  useEffect(() => {
    if (sessionId) {
      updateCartCount();
    }
  }, [sessionId]);

  return (
    <CartContext.Provider value={{ 
      sessionId, 
      cartCount, 
      addToCart, 
      removeFromCart, 
      updateCartItem, 
      clearCart,
      updateCartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

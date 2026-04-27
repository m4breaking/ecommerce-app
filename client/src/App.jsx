import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LiveChat from './components/LiveChat';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Contact from './pages/Contact';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import FAQ from './pages/FAQ';
import ReturnPolicy from './pages/ReturnPolicy';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
                <Navbar isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/checkout-success" element={<CheckoutSuccess />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/return-policy" element={<ReturnPolicy />} />
                  </Routes>
                </main>
                <Footer />
                <LiveChat isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
              </div>
            </Router>
          </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

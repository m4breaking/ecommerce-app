import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { sessionId, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    paymentMethod: 'cod',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    bkashNumber: '',
    bankAccount: '',
    bankRouting: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/cart/${sessionId}`)
      .then(res => res.json())
      .then(data => setCartItems(data))
      .catch(err => console.error('Error loading cart:', err));
  }, [sessionId]);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = Math.max(0, total - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, total })
      });
      const data = await response.json();

      if (!response.ok) {
        setCouponError(data.error || 'Invalid coupon');
        setAppliedCoupon(null);
        setDiscount(0);
      } else {
        setAppliedCoupon(data);
        setDiscount(data.discount);
        setCouponError('');
        setCouponCode('');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
    // Payment method specific validation
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!formData.cardExpiry.trim()) newErrors.cardExpiry = 'Expiry date is required';
      if (!formData.cardCvc.trim()) newErrors.cardCvc = 'CVC is required';
    } else if (formData.paymentMethod === 'bkash') {
      if (!formData.bkashNumber.trim()) newErrors.bkashNumber = 'bKash number is required';
    } else if (formData.paymentMethod === 'bank') {
      if (!formData.bankAccount.trim()) newErrors.bankAccount = 'Bank account is required';
      if (!formData.bankRouting.trim()) newErrors.bankRouting = 'Routing number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const orderData = {
        user_id: user?.id || null,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        email: formData.email || null,
        payment_method: formData.paymentMethod,
        total_amount: finalTotal,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Record coupon usage if coupon was applied
      if (appliedCoupon) {
        await fetch(`/api/coupons/${appliedCoupon.id}/use`, { method: 'POST' });
      }

      clearCart();
      navigate('/checkout-success');
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/')}
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              
              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method *</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Cash on Delivery
                    </span>
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={formData.paymentMethod === 'bkash'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      bKash
                    </span>
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Credit/Debit Card
                    </span>
                  </label>
                  <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === 'bank'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Bank Transfer
                    </span>
                  </label>
                </div>
              </div>

              {/* Credit Card Form */}
              {formData.paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                      {errors.cardExpiry && <p className="text-red-600 text-sm mt-1">{errors.cardExpiry}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
                      <input
                        type="text"
                        name="cardCvc"
                        value={formData.cardCvc}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                      {errors.cardCvc && <p className="text-red-600 text-sm mt-1">{errors.cardCvc}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* bKash Form */}
              {formData.paymentMethod === 'bkash' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">bKash Number *</label>
                    <input
                      type="text"
                      name="bkashNumber"
                      value={formData.bkashNumber}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors.bkashNumber && <p className="text-red-600 text-sm mt-1">{errors.bkashNumber}</p>}
                  </div>
                  <p className="text-sm text-gray-500">You will receive a payment request on your bKash account.</p>
                </div>
              )}

              {/* Bank Transfer Form */}
              {formData.paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      name="bankAccount"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      placeholder="Account number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors.bankAccount && <p className="text-red-600 text-sm mt-1">{errors.bankAccount}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number *</label>
                    <input
                      type="text"
                      name="bankRouting"
                      value={formData.bankRouting}
                      onChange={handleChange}
                      placeholder="Routing number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors.bankRouting && <p className="text-red-600 text-sm mt-1">{errors.bankRouting}</p>}
                  </div>
                  <p className="text-sm text-gray-500">Your order will be processed once the transfer is confirmed.</p>
                </div>
              )}

              {/* Cash on Delivery */}
              {formData.paymentMethod === 'cod' && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Pay with cash when your order is delivered. Additional fees may apply for cash on delivery.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.discount_type === 'percentage' ? appliedCoupon.discount_value + '%' : '$' + appliedCoupon.discount_value})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="mt-4 pt-4 border-t">
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {couponError && (
                    <p className="text-red-600 text-xs">{couponError}</p>
                  )}
                  <button
                    onClick={applyCoupon}
                    className="w-full bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700"
                  >
                    Apply Coupon
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-green-800">Coupon Applied!</p>
                    <p className="text-xs text-green-600">{appliedCoupon.code}</p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

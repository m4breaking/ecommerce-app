import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE } from '../config';

const AdminCoupons = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    if (!admin) {
      navigate('/login');
      return;
    }
    loadCoupons();
  }, [admin, navigate]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/coupons`);
      const data = await response.json();
      setCoupons(data);
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCoupon ? `${API_BASE}/coupons/${editingCoupon.id}` : `${API_BASE}/coupons`;
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : 0,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      loadCoupons();
      setShowModal(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: '',
        max_discount: '',
        usage_limit: '',
        valid_until: '',
        is_active: true
      });
    } catch (err) {
      alert(err.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await fetch(`${API_BASE}/coupons/${id}`, { method: 'DELETE' });
      loadCoupons();
    } catch (err) {
      alert('Failed to delete coupon');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {admin?.name}</span>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">Dashboard</Link>
              <Link to="/analytics" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">Analytics</Link>
              <Link to="/orders" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">Orders</Link>
              <Link to="/users" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">Users</Link>
              <Link to="/chat" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">Live Chat</Link>
              <button onClick={handleLogout} className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">Logout</button>
              <a href="https://ecommerce-app-eosin-omega.vercel.app" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md font-medium">View Store</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setFormData({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                min_purchase: '',
                max_discount: '',
                usage_limit: '',
                valid_until: '',
                is_active: true
              });
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Coupon
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No coupons yet</td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coupon.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{coupon.discount_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '$' + coupon.discount_value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coupon.used_count} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(coupon)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                      <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase</label>
                  <input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({...formData, min_purchase: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <label className="ml-2 text-sm text-gray-700">Active</label>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                    {editingCoupon ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;

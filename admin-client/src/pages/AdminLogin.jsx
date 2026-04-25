import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, admin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if already logged in
    if (admin) {
      navigate('/home');
      return;
    }

    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem('adminEmail');
    const savedPassword = localStorage.getItem('adminPassword');
    const savedRemember = localStorage.getItem('adminRemember');
    
    if (savedRemember === 'true' && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, [admin, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    // Save credentials if remember me is checked
    if (rememberMe) {
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminPassword', password);
      localStorage.setItem('adminRemember', 'true');
    } else {
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminPassword');
      localStorage.removeItem('adminRemember');
    }

    const result = login(email, password);
    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 space-y-8 border border-white/20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
            <p className="mt-2 text-purple-200">
              Secure access to management dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border-l-4 border-red-500 text-red-200 p-4 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-purple-200 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/10 text-white placeholder-purple-200"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-purple-200 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/10 text-white placeholder-purple-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-white/20 rounded bg-white/10"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-purple-200">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="https://ecommerce-app-eosin-omega.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-purple-200 transition-colors text-sm"
          >
            ← Back to Store
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminChat from './pages/AdminChat';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import AdminAnalytics from './pages/AdminAnalytics';
import { AdminAuthProvider } from './context/AdminAuthContext';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/chat" element={<AdminChat />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;

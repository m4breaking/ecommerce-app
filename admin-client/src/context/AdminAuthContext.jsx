import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    // Initialize from localStorage immediately
    const storedAdmin = localStorage.getItem('admin');
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = (email, password) => {
    // Mock admin authentication - in production, this would call an API
    // For demo: m4breaking1@gmail.com / billaless00
    if (email === 'm4breaking1@gmail.com' && password === 'billaless00') {
      const mockAdmin = {
        id: 1,
        email: email,
        name: 'Admin',
        role: 'admin'
      };
      setAdmin(mockAdmin);
      localStorage.setItem('admin', JSON.stringify(mockAdmin));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

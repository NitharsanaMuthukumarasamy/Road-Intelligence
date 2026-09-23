import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('road_auth_token');
      const savedUser = localStorage.getItem('road_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Refresh user data in background
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('road_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogout = () => logout();
    window.addEventListener('auth_logout', handleLogout);
    return () => window.removeEventListener('auth_logout', handleLogout);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('road_auth_token', access_token);
      localStorage.setItem('road_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please verify your credentials.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await authAPI.register(userData);
      const { access_token, user: newUser } = res.data;
      localStorage.setItem('road_auth_token', access_token);
      localStorage.setItem('road_user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check form inputs.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('road_auth_token');
    localStorage.removeItem('road_user');
    setUser(null);
  };

  const isCitizen = user?.role === 'Citizen';
  const isOfficer = user?.role === 'Government Officer' || user?.role === 'Admin Officer';
  const isAdmin = user?.role === 'Admin Officer';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isCitizen,
        isOfficer,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

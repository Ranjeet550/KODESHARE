import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setLoading(false);
          return;
        }

        // Set auth token header
        axios.defaults.headers.common['x-auth-token'] = token;

        // Get user data
        const res = await axios.get('/auth/me');

        setUser(res.data);
        setIsAuthenticated(true);
        setLoading(false);
      } catch (err) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      setError(null);
      const res = await axios.post('/auth/register', formData);

      // Save token to localStorage
      localStorage.setItem('token', res.data.token);

      // Set auth token header
      axios.defaults.headers.common['x-auth-token'] = res.data.token;

      setUser(res.data.user);
      setIsAuthenticated(true);

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      setError(null);
      const res = await axios.post('/auth/login', formData);

      // Save token to localStorage
      localStorage.setItem('token', res.data.token);

      // Set auth token header
      axios.defaults.headers.common['x-auth-token'] = res.data.token;

      setUser(res.data.user);
      setIsAuthenticated(true);

      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');

    // Remove auth header
    delete axios.defaults.headers.common['x-auth-token'];

    setUser(null);
    setIsAuthenticated(false);
  };

  // Request password reset (send OTP)
  const forgotPassword = async (email) => {
    try {
      setError(null);
      const res = await axios.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
      throw err;
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      setError(null);
      const res = await axios.post('/auth/verify-otp', { email, otp });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (resetToken, newPassword) => {
    try {
      setError(null);
      const res = await axios.post('/auth/reset-password', { resetToken, newPassword });
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        forgotPassword,
        verifyOTP,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

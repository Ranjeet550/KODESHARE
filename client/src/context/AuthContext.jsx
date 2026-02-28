import { createContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { getApiUrl } from '../config/apiConfig';

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

        // Get user data
        const res = await apiClient.get(getApiUrl('/auth/me'));

        setUser(res.data);
        setIsAuthenticated(true);
        setLoading(false);
      } catch (err) {
        localStorage.removeItem('token');
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
      const res = await apiClient.post(getApiUrl('/auth/register'), formData);

      // Save token to localStorage
      localStorage.setItem('token', res.data.token);

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
      const res = await apiClient.post(getApiUrl('/auth/login'), formData);

      // Save token to localStorage
      localStorage.setItem('token', res.data.token);

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

    setUser(null);
    setIsAuthenticated(false);
  };

  // Request password reset (send OTP)
  const forgotPassword = async (email) => {
    try {
      setError(null);
      console.log('[AuthContext] forgotPassword called with email:', email);
      console.log('[AuthContext] API URL:', getApiUrl('/auth/forgot-password'));
      
      const res = await apiClient.post(getApiUrl('/auth/forgot-password'), { email });
      
      console.log('[AuthContext] forgotPassword response:', res.data);
      return res.data;
    } catch (err) {
      console.error('[AuthContext] forgotPassword error:', err);
      console.error('[AuthContext] Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      setError(err.response?.data?.message || 'Failed to send reset email');
      throw err;
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      setError(null);
      const res = await apiClient.post(getApiUrl('/auth/verify-otp'), { email, otp });
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
      const res = await apiClient.post(getApiUrl('/auth/reset-password'), { resetToken, newPassword });
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

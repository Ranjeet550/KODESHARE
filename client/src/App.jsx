import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CodeEditor from './pages/CodeEditor';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

// Context
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Set base URL for API requests
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Navbar />
            <main className={`${window.location.pathname === '/' ? '' : 'container mx-auto px-4 py-8 mt-14'}`}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/code/:id" element={<CodeEditor />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                } />
                {/* Custom slug route - will be handled by Home component */}
                <Route path="/:slug" element={<Home />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Private route component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default App;

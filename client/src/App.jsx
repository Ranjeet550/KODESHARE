import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config/apiConfig';
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
// Uses the VITE_API_URL environment variable
axios.defaults.baseURL = API_BASE_URL;

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          {/* use min-h-screen instead of fixed h-screen so page can grow naturally
                and scrolling occurs on window (needed for GSAP ScrollTrigger) */}
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Navbar />
            {/* main no longer needs its own overflow; the document will scroll normally */}
            <main className="flex-1">
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
                {/* Custom slug route - redirect to /code/:slug */}
                <Route path="/:slug" element={<CustomSlugRedirect />} />
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

// Custom slug redirect component
const CustomSlugRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate slug format (alphanumeric, underscore, hyphen, 1-50 chars)
    if (slug && /^[a-zA-Z0-9_-]{1,50}$/.test(slug)) {
      navigate(`/code/${slug}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [slug, navigate]);

  return null;
};

export default App;

import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const { forgotPassword, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setFormError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setFormError('');
      
      console.log('[ForgotPassword] Submitting email:', email);

      // Call forgotPassword from context
      const response = await forgotPassword(email);
      
      console.log('[ForgotPassword] Success:', response);
      
      // Set success message
      setSuccess(true);
      
      // Store email in session storage for the next step
      sessionStorage.setItem('resetEmail', email);
      
      // Redirect to OTP verification page after 2 seconds
      setTimeout(() => {
        navigate('/verify-otp');
      }, 2000);
    } catch (err) {
      console.error('[ForgotPassword] Error:', err);
      console.error('[ForgotPassword] Error response:', err.response);
      console.error('[ForgotPassword] Error message:', err.message);
      setFormError(err.response?.data?.message || err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-dark-700 border border-gray-300 dark:border-dark-500 rounded-lg shadow-md">

      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
        Forgot Password
      </h1>

      {success ? (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">OTP has been sent to your email address. Redirecting to verification page...</span>
        </div>
      ) : (
        <>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>

          {formError && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-dark-600 leading-tight focus:outline-none focus:shadow-outline focus:border-green-500 dark:focus:border-green-500"
                placeholder="Enter your email"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300">
              Back to Login
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;

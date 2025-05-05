import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  const { verifyOTP, forgotPassword, error } = useContext(AuthContext);
  const navigate = useNavigate();

  // Get email from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (!storedEmail) {
      // Redirect to forgot password if email is not found
      navigate('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate OTP
    if (!otp) {
      setFormError('Please enter the OTP sent to your email');
      return;
    }

    try {
      setLoading(true);
      setFormError('');

      // Call verifyOTP from context
      const response = await verifyOTP(email, otp);
      
      // Store reset token in session storage
      sessionStorage.setItem('resetToken', response.resetToken);
      
      // Set success message
      setSuccess(true);
      
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        navigate('/reset-password');
      }, 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setFormError('');

      // Call forgotPassword from context
      await forgotPassword(email);
      
      // Reset timer
      setTimeLeft(900);
      
      // Show success message
      setFormError('');
      alert('New OTP has been sent to your email');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-dark-700 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
        Verify OTP
      </h1>

      {success ? (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">OTP verified successfully. Redirecting to reset password page...</span>
        </div>
      ) : (
        <>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Enter the 6-digit OTP sent to your email address: <strong>{email}</strong>
          </p>

          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              OTP expires in: <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-green-500'}`}>{formatTime(timeLeft)}</span>
            </span>
          </div>

          {formError && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="otp" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-dark-600 leading-tight focus:outline-none focus:shadow-outline focus:border-green-500 dark:focus:border-green-500 text-center tracking-widest text-xl"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>

          <div className="text-center mt-4 flex flex-col space-y-2">
            <button 
              onClick={handleResendOTP} 
              disabled={loading || timeLeft > 840} // Allow resend after 1 minute
              className={`text-sm text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 ${(loading || timeLeft > 840) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Resend OTP
            </button>
            <Link to="/forgot-password" className="text-sm text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300">
              Change Email
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default VerifyOTP;

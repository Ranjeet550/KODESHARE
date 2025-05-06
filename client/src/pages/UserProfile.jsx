import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUserCodeShares } from '../utils/api';
import KodeshareIcon from '../components/KodeshareIcon';

const UserProfile = () => {
  const { user } = useContext(AuthContext);
  const [codeShares, setCodeShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user's code shares
        const data = await getUserCodeShares();
        setCodeShares(data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-700 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-xl shadow-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold text-lg mb-1">Error Loading Profile</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header with Banner */}
      <div className="bg-gradient-to-r from-primary-700 to-secondary-700 dark:from-primary-700 dark:to-secondary-700 rounded-t-xl h-40 relative overflow-hidden">
      
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <div className="flex items-center">
            <KodeshareIcon className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Kodeshare</h2>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-dark-700 rounded-b-xl shadow-xl relative">
        {/* Avatar */}
        <div className="absolute -top-16 left-8">
          <div className="bg-white dark:bg-dark-700 p-2 rounded-full shadow-lg">
            <div className="bg-gradient-to-br from-accent-700 to-primary-700 rounded-full w-28 h-28 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{user?.username}</h1>
              <p className="text-gray-600 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user?.email}
              </p>
              {user?.createdAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Member since {formatDate(user.createdAt)}
                </p>
              )}
            </div>

           
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-dark-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="bg-neutral-700/50 dark:bg-secondary-700/20 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700 dark:text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Code Shares</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{codeShares.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="bg-accent-700/30 dark:bg-accent-700/20 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-700 dark:text-accent-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Latest Activity</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {codeShares.length > 0
                      ? formatDate(codeShares[0].createdAt)
                      : 'No activity yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-dark-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="bg-secondary-700/30 dark:bg-secondary-700/20 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-700 dark:text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account Type</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">Developer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-gray-50 dark:bg-dark-600 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-700 dark:text-secondary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-dark-700 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Username</p>
                <p className="text-gray-800 dark:text-white font-medium">{user?.username}</p>
              </div>
              <div className="bg-white dark:bg-dark-700 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-gray-800 dark:text-white font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

     

    

    </div>
  );
};

export default UserProfile;

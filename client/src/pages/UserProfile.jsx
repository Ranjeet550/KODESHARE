import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getUserCodeShares } from '../utils/api';
import CodeGharLogo from '../components/CodeGharLogo';

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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#03A791] mb-4"></div>
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
      <div className="bg-gradient-to-r from-[#03A791] to-[#81E7AF] dark:from-[#03A791] dark:to-[#81E7AF] rounded-t-xl h-40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
            <path d="M10 10L90 10L90 90L10 90Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <path d="M30 10L30 90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
            <path d="M50 10L50 90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
            <path d="M70 10L70 90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
            <path d="M10 30L90 30" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
            <path d="M10 50L90 50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
            <path d="M10 70L90 70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <div className="flex items-center">
            <CodeGharLogo className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Coder Ghar</h2>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-dark-700 rounded-b-xl shadow-xl relative">
        {/* Avatar */}
        <div className="absolute -top-16 left-8">
          <div className="bg-white dark:bg-dark-700 p-2 rounded-full shadow-lg">
            <div className="bg-gradient-to-br from-[#F1BA88] to-[#03A791] rounded-full w-28 h-28 flex items-center justify-center text-white">
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

            <div className="mt-4 md:mt-0">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 bg-[#03A791] hover:bg-[#03A791]/80 text-white rounded-lg transition-colors duration-200 shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Code Share
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-dark-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="bg-[#E9F5BE]/50 dark:bg-[#81E7AF]/20 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="bg-[#F1BA88]/30 dark:bg-[#F1BA88]/20 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#F1BA88] dark:text-[#F1BA88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="bg-[#81E7AF]/30 dark:bg-[#81E7AF]/20 p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#81E7AF] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Code Shares Section */}
      <div className="bg-white dark:bg-dark-700 rounded-xl shadow-xl p-8 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Your Code Shares
          </h2>

          <Link
            to="/"
            className="text-[#03A791] hover:text-[#03A791]/80 dark:text-[#81E7AF] dark:hover:text-[#81E7AF]/80 text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort by newest
          </Link>
        </div>

        {codeShares.length === 0 ? (
          <div className="bg-gray-50 dark:bg-dark-600 rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-dark-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Code Shares Yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">You haven't created any code shares yet. Start sharing your code with others by creating your first code share.</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-[#03A791] hover:bg-[#03A791]/80 text-white rounded-lg transition-colors duration-200 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Code Share
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {codeShares.map((codeShare) => (
              <div
                key={codeShare._id}
                className="bg-gray-50 dark:bg-dark-600 border border-gray-200 dark:border-dark-500 rounded-xl p-5 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start">
                  <div className="bg-white dark:bg-dark-700 p-3 rounded-lg mr-4 text-[#03A791] dark:text-[#81E7AF] shadow-sm">
                    {codeShare.language === 'javascript' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h18v18H3V3zm16.525 13.707c-.131-.821-.666-1.511-2.252-2.155-.552-.259-1.165-.438-1.349-.854-.068-.248-.078-.382-.034-.529.113-.484.687-.629 1.137-.495.293.09.563.315.732.676.775-.507.775-.507 1.316-.844-.203-.314-.304-.451-.439-.586-.473-.528-1.103-.798-2.126-.775l-.528.067c-.507.124-.991.395-1.283.754-.855.968-.608 2.655.427 3.354 1.023.765 2.521.933 2.712 1.653.18.878-.652 1.159-1.475 1.058-.607-.136-.945-.439-1.316-1.002l-1.372.788c.157.359.337.517.607.832 1.305 1.316 4.568 1.249 5.153-.754.021-.067.18-.528.056-1.237l.034.049zm-6.737-5.434h-1.686c0 1.453-.007 2.898-.007 4.354 0 .924.047 1.772-.104 2.033-.247.517-.886.451-1.175.359-.297-.146-.448-.349-.623-.641-.047-.078-.082-.146-.095-.146l-1.368.844c.229.473.563.879.994 1.137.641.383 1.502.507 2.404.305.588-.17 1.095-.519 1.358-1.059.384-.697.302-1.553.299-2.509.008-1.541 0-3.083 0-4.635l.003-.042z" />
                      </svg>
                    )}
                    {codeShare.language === 'python' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                      </svg>
                    )}
                    {codeShare.language !== 'javascript' && codeShare.language !== 'python' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-800 dark:text-white text-lg mb-1 group-hover:text-[#03A791] dark:group-hover:text-[#81E7AF] transition-colors duration-200">
                        {codeShare.title || 'Untitled Code'}
                      </h3>
                      <span className="bg-[#E9F5BE]/50 dark:bg-[#81E7AF]/20 text-[#03A791] dark:text-[#81E7AF] text-xs px-2 py-1 rounded-full">
                        {codeShare.language}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created: {formatDate(codeShare.createdAt)}
                    </div>
                    <div className="flex justify-between items-center">
                      {codeShare.customId && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Custom URL: {codeShare.customId}
                        </div>
                      )}
                      <Link
                        to={`/code/${codeShare.customId || codeShare._id}`}
                        className="bg-[#03A791] hover:bg-[#03A791]/80 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors duration-200 shadow-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {codeShares.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-dark-600 text-[#03A791] dark:text-[#81E7AF] border border-[#03A791] dark:border-[#81E7AF] font-medium rounded-lg hover:bg-[#E9F5BE]/20 dark:hover:bg-[#81E7AF]/20 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Code Share
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm pb-8">
        <p>Need help? <Link to="/" className="text-[#03A791] dark:text-[#81E7AF] hover:underline">Contact Support</Link></p>
        <p className="mt-2 flex items-center justify-center">
          <CodeGharLogo className="h-4 w-4 mr-1" />
          <span>Coder Ghar © {new Date().getFullYear()}</span>
        </p>
      </div>
    </div>
  );
};

export default UserProfile;

import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { getUserCodeShares, createCodeShare, deleteCodeShare } from '../utils/api';
import CodeGharLogo from '../components/CodeGharLogo';

const Dashboard = () => {
  const [codeShares, setCodeShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({
    totalShares: 0,
    totalViews: 0,
    publicShares: 0
  });

  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Fetch user's code shares
  useEffect(() => {
    const fetchCodeShares = async () => {
      try {
        setLoading(true);
        const data = await getUserCodeShares();
        setCodeShares(data);

        // Calculate stats
        if (data && data.length > 0) {
          const totalViews = data.reduce((sum, share) => sum + (share.accessCount || 0), 0);
          const publicShares = data.filter(share => share.isPublic).length;

          setStats({
            totalShares: data.length,
            totalViews,
            publicShares
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch your code shares');
      } finally {
        setLoading(false);
      }
    };

    fetchCodeShares();
  }, []);

  // Create a new code share
  const handleCreateNewCodeShare = async () => {
    try {
      setCreating(true);

      // Create a new code share with default values
      const response = await createCodeShare({
        title: 'Untitled Code',
        language: 'javascript',
        code: '// Start coding here...',
        isPublic: true,
        expiresIn: 24 // 24 hours
      });

      // Navigate to the code editor with the new code share ID
      navigate(`/code/${response.codeShare.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create new code share');
    } finally {
      setCreating(false);
    }
  };

  // Delete a code share
  const handleDeleteCodeShare = async (id) => {
    if (window.confirm('Are you sure you want to delete this code share?')) {
      try {
        await deleteCodeShare(id);
        // Update the list
        setCodeShares(codeShares.filter(share => share._id !== id));
      } catch (err) {
        setError(err.message || 'Failed to delete code share');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-br from-[#03A791] to-[#81E7AF] dark:from-[#03A791] dark:to-[#81E7AF]/80 rounded-2xl mb-10 shadow-xl overflow-hidden relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#F1BA88]/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#E9F5BE]/10 rounded-full blur-2xl"></div>

          {/* Grid Pattern */}
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
        </div>

        <div className="px-8 py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              {/* Badge */}
              <div className="inline-block mb-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white/90 text-sm font-medium">
                <span className="inline-block w-2 h-2 bg-[#F1BA88] rounded-full mr-2 animate-pulse"></span>
                Dashboard
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">
                My Code Shares
              </h1>
              <p className="text-white/90 text-lg">
                Manage and organize all your code snippets in one place
              </p>
            </div>

            <button
              onClick={handleCreateNewCodeShare}
              disabled={creating}
              className="mt-6 md:mt-0 bg-[#F1BA88] hover:bg-[#F1BA88]/90 text-[#03A791] font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {creating ? 'Creating...' : 'Create New Share'}
            </button>
          </div>

          {/* Stats Cards */}
          {codeShares.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="bg-[#E9F5BE]/30 p-4 rounded-lg mr-4 transform transition-all duration-300 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">Total Code Shares</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-white">{stats.totalShares}</p>
                      <span className="ml-2 text-xs text-white/60 font-medium">snippets</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-0 h-1 bg-[#E9F5BE]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="bg-[#F1BA88]/30 p-4 rounded-lg mr-4 transform transition-all duration-300 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">Total Views</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
                      <span className="ml-2 text-xs text-white/60 font-medium">views</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-0 h-1 bg-[#F1BA88]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                <div className="flex items-center">
                  <div className="bg-[#81E7AF]/30 p-4 rounded-lg mr-4 transform transition-all duration-300 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">Public Shares</p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-white">{stats.publicShares}</p>
                      <span className="ml-2 text-xs text-white/60 font-medium">public</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-0 h-1 bg-[#81E7AF]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-5 rounded-xl mb-8 shadow-md">
          <div className="flex items-center">
            <div className="bg-red-200 dark:bg-red-800/30 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-300 mb-1">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 bg-white dark:bg-dark-700 rounded-xl shadow-xl border border-gray-100 dark:border-dark-600">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#E9F5BE]/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#03A791] animate-spin"></div>
          </div>
          <p className="text-xl font-medium text-gray-600 dark:text-gray-300">Loading your code shares...</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait a moment</p>
        </div>
      ) : codeShares.length === 0 ? (
        <div className="bg-white dark:bg-dark-700 rounded-xl shadow-xl p-16 text-center border border-gray-100 dark:border-dark-600 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 0 10 L 40 10 M 10 0 L 10 40 M 0 20 L 40 20 M 20 0 L 20 40 M 0 30 L 40 30 M 30 0 L 30 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-24 h-24 bg-[#E9F5BE]/50 dark:bg-[#03A791]/20 rounded-full flex items-center justify-center mx-auto mb-8 transform transition-all duration-500 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">No Code Shares Yet</h2>

            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto text-lg">
              You don't have any code shares yet. Create your first one to start sharing code with others and collaborate in real-time.
            </p>

            <button
              onClick={handleCreateNewCodeShare}
              className="bg-gradient-to-r from-[#03A791] to-[#81E7AF] hover:from-[#03A791]/90 hover:to-[#81E7AF]/90 text-white font-bold py-4 px-10 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Your First Code Share
              </div>
            </button>

            <p className="mt-6 text-gray-500 dark:text-gray-500 text-sm">
              Start sharing your code snippets with the world
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {codeShares.map((codeShare) => (
            <div
              key={codeShare._id}
              className="bg-white dark:bg-dark-700 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 dark:border-dark-600 hover:translate-y-[-5px] group"
            >
              {/* Language Badge */}
              <div className="border-b border-gray-100 dark:border-dark-600 px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-dark-800">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#E9F5BE]/50 dark:bg-[#03A791]/20 rounded-lg flex items-center justify-center mr-3 transform transition-all duration-300 group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {codeShare.language}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(codeShare.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${codeShare.isPublic
                  ? 'bg-[#81E7AF]/20 text-[#03A791] dark:bg-[#81E7AF]/20 dark:text-[#81E7AF]'
                  : 'bg-[#F1BA88]/20 text-[#F1BA88] dark:bg-[#F1BA88]/20 dark:text-[#F1BA88]'}`}>
                  {codeShare.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 truncate group-hover:text-[#03A791] dark:group-hover:text-[#81E7AF] transition-colors duration-300">
                  {codeShare.title}
                </h2>

                <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
                      <div className="font-medium">{formatDate(codeShare.createdAt)}</div>
                    </div>
                  </div>

                  {codeShare.expiresAt && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F1BA88] dark:text-[#F1BA88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Expires</div>
                        <div className="font-medium">{formatDate(codeShare.expiresAt)}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-dark-600 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#81E7AF] dark:text-[#E9F5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Views</div>
                      <div className="font-medium">{codeShare.accessCount || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Link
                    to={`/code/${codeShare._id}`}
                    className="inline-flex items-center bg-[#03A791] hover:bg-[#03A791]/90 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-300 hover:shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </Link>

                  <button
                    onClick={() => handleDeleteCodeShare(codeShare._id)}
                    className="inline-flex items-center bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium py-2.5 px-5 rounded-lg transition-all duration-300 hover:shadow-md dark:bg-dark-600 dark:hover:bg-red-900/30 dark:border-red-900/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

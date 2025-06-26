import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { getUserCodeShares, createCodeShare, deleteCodeShare } from '../utils/api';
import KodeshareIcon from '../components/KodeshareIcon';
import { gsap } from 'gsap';

const Dashboard = () => {
  const [codeShares, setCodeShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'public', 'private'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'views'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'card'
  const [stats, setStats] = useState({
    totalShares: 0,
    totalViews: 0,
    publicShares: 0,
    privateShares: 0,
    recentActivity: 0
  });

  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Refs for animations
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const contentRef = useRef(null);

  // Animation effect
  useEffect(() => {
    if (!loading) {
      // Animate header
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );

      // Animate stats
      gsap.fromTo(
        statsRef.current?.children || [],
        { opacity: 0, y: 20, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.7)',
          delay: 0.3
        }
      );

      // Animate content
      gsap.fromTo(
        contentRef.current?.children || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.5
        }
      );
    }
  }, [loading]);

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
          const privateShares = data.length - publicShares;

          // Calculate recent activity (shares created in the last 7 days)
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const recentActivity = data.filter(share =>
            new Date(share.createdAt) > oneWeekAgo
          ).length;

          setStats({
            totalShares: data.length,
            totalViews,
            publicShares,
            privateShares,
            recentActivity
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
      // For logged-in users, don't set expiration
      const response = await createCodeShare({
        title: 'Untitled Code',
        language: 'javascript',
        code: '// Start coding here...',
        isPublic: true
        // No expiresIn for logged-in users - their codeshares never expire
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

        // Update stats
        setStats(prev => ({
          ...prev,
          totalShares: prev.totalShares - 1,
          publicShares: codeShares.find(share => share._id === id)?.isPublic
            ? prev.publicShares - 1
            : prev.publicShares,
          privateShares: !codeShares.find(share => share._id === id)?.isPublic
            ? prev.privateShares - 1
            : prev.privateShares
        }));
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

  // Filter code shares
  const getFilteredCodeShares = () => {
    let filtered = [...codeShares];

    // Apply filter
    if (filterType === 'public') {
      filtered = filtered.filter(share => share.isPublic);
    } else if (filterType === 'private') {
      filtered = filtered.filter(share => !share.isPublic);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
    }

    return filtered;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Professional Header Section */}
        <div ref={headerRef} className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-pink-600/10 rounded-3xl blur-3xl transform rotate-1"></div>
          <div className="relative backdrop-blur-sm bg-white/90 dark:bg-dark-800/90 shadow-2xl border border-white/20 dark:border-dark-700/50 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
            
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                {/* Header Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3m16 8H5m14 4H3" />
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Dashboard
                        </span>
                        <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                            {user?.username || 'User'}
                          </span>
                        </div>
                      </div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                        Code Collection Hub
                      </h1>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    Streamline your development workflow with our advanced code management platform. 
                    Create, organize, and collaborate on code snippets with real-time synchronization.
                  </p>
                </div>
                
               
              </div>

              {/* Enhanced Stats Cards */}
              {codeShares.length > 0 && (
                <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {/* Total Snippets */}
                  <div className="group relative overflow-hidden bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-dark-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalShares}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Snippets</p>
                        </div>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  </div>

                  {/* Total Views */}
                  <div className="group relative overflow-hidden bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-dark-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Views</p>
                        </div>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  </div>

                  {/* Public Shares */}
                  <div className="group relative overflow-hidden bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-dark-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.publicShares}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Public Shares</p>
                        </div>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  </div>

                  {/* Private Shares */}
                  <div className="group relative overflow-hidden bg-white/80 dark:bg-dark-700/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-dark-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.privateShares}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Private Shares</p>
                        </div>
                      </div>
                      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Filters & Controls */}
        {codeShares.length > 0 && (
          <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50 dark:border-dark-700/50 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Filter Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter by Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full pl-4 pr-10 py-2.5 text-base border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-xl shadow-sm transition-all duration-200"
                  >
                    <option value="all">All Snippets</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-4 pr-10 py-2.5 text-base border border-gray-300 dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-white rounded-xl shadow-sm transition-all duration-200"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>
              </div>

              {/* View Toggle & Results Count */}
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-dark-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Grid View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'card'
                        ? 'bg-white dark:bg-dark-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Card View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3m16 8H5m14 4H3" />
                    </svg>
                  </button>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 px-4 py-2 rounded-xl">
                  <span className="font-medium">{getFilteredCodeShares().length}</span> of <span className="font-medium">{codeShares.length}</span> snippets
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="relative bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-dark-700/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative z-10 text-center py-20 px-8">
            <div className="relative mx-auto w-20 h-20 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading Your Code Collection</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Please wait while we fetch your code snippets and prepare your dashboard...
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      ) : codeShares.length === 0 ? (
        <div className="relative bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-dark-700/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="professional-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 0 12.5 L 50 12.5 M 12.5 0 L 12.5 50 M 0 25 L 50 25 M 25 0 L 25 50 M 0 37.5 L 50 37.5 M 37.5 0 L 37.5 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#professional-grid)" />
            </svg>
          </div>

          <div className="relative z-10 text-center py-20 px-8">
            <div className="relative mx-auto mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 hover:scale-110">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-4">
              Welcome to Your Code Hub
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Your coding journey starts here! Create your first code snippet to begin building your professional portfolio and collaborate with developers worldwide.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Syntax Highlighting</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 6.632a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0-9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="text-sm font-medium">Real-time Sharing</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Privacy Controls</span>
              </div>
            </div>

            <button
              onClick={handleCreateNewCodeShare}
              disabled={creating}
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                {creating ? (
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:rotate-90 duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-lg">{creating ? "Creating Your First Snippet..." : "Create Your First Code Share"}</span>
              </div>
            </button>

            <p className="mt-6 text-gray-500 dark:text-gray-400 text-sm">
              Join thousands of developers sharing and collaborating on code
            </p>
          </div>
        </div>
      ) : (
        <div ref={contentRef} className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
          {getFilteredCodeShares().map((codeShare) => (
            <div
              key={codeShare._id}
              className={`group relative bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200/50 dark:border-dark-700/50 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                viewMode === 'card' ? 'flex flex-col sm:flex-row' : ''
              }`}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
              
{viewMode === 'grid' ? (
                /* Grid View Layout */
                <>
                  {/* Header with Language & Status */}
                  <div className="relative p-6 pb-4 border-b border-gray-100/50 dark:border-dark-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white capitalize">
                            {codeShare.language}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(codeShare.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold ${
                          codeShare.isPublic
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 ${codeShare.isPublic ? 'bg-green-500' : 'bg-orange-500'} rounded-full mr-1.5`}></span>
                          {codeShare.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 truncate">
                      {codeShare.title}
                    </h3>
                  </div>

                  {/* Content Area with Stats */}
                  <div className="relative p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{codeShare.accessCount || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Views</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {Math.ceil((new Date() - new Date(codeShare.createdAt)) / (1000 * 60 * 60 * 24))}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Days Old</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        to={`/code/${codeShare._id}`}
                        className="flex-1 group/btn relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Open</span>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleDeleteCodeShare(codeShare._id)}
                        className="group/del p-3 bg-white dark:bg-dark-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                        title="Delete code share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/del:scale-110 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Expiry Warning */}
                    {codeShare.expiresAt && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Expires: {formatDate(codeShare.expiresAt)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Card View Layout - Horizontal */
                <>
                  {/* Left Section - Icon & Info */}
                  <div className="flex-shrink-0 p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:w-80">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize text-lg">
                          {codeShare.language}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                          codeShare.isPublic
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                        }`}>
                          <span className={`w-1 h-1 ${codeShare.isPublic ? 'bg-green-500' : 'bg-orange-500'} rounded-full mr-1`}></span>
                          {codeShare.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 mb-2">
                        {codeShare.title}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {new Date(codeShare.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Stats & Actions */}
                  <div className="flex-1 p-6 border-t sm:border-t-0 sm:border-l border-gray-100/50 dark:border-dark-600/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-full gap-4">
                      {/* Stats */}
                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{codeShare.accessCount || 0}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.ceil((new Date() - new Date(codeShare.createdAt)) / (1000 * 60 * 60 * 24))}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Days Old</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 flex-shrink-0">
                        <Link
                          to={`/code/${codeShare._id}`}
                          className="group/btn relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/25"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Open</span>
                          </div>
                        </Link>

                        <button
                          onClick={() => handleDeleteCodeShare(codeShare._id)}
                          className="group/del p-2.5 bg-white dark:bg-dark-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                          title="Delete code share"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/del:scale-110 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expiry Warning */}
                    {codeShare.expiresAt && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Expires: {formatDate(codeShare.expiresAt)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;

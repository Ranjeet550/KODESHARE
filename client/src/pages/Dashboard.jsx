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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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
      const requestData = {
        title: 'Untitled Code',
        language: 'javascript',
        code: '// Start coding here...',
        isPublic: false // Set to private by default for logged-in users
        // No expiresIn for logged-in users - their codeshares never expire
      };

      console.log('Creating code share with data:', requestData);
      const response = await createCodeShare(requestData);
      console.log('Code share created successfully:', response);

      // Navigate to the code editor with the new code share ID
      navigate(`/code/${response.codeShare.id}`);
    } catch (err) {
      console.error('Error creating code share:', err);
      setError(err.message || 'Failed to create new code share');
    } finally {
      setCreating(false);
    }
  };

  // Delete a code share
  const handleDeleteCodeShare = (id) => {
    setItemToDelete(id);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteCodeShare(itemToDelete);
        // Update the list
        setCodeShares(codeShares.filter(share => share._id !== itemToDelete));

        // Update stats
        setStats(prev => ({
          ...prev,
          totalShares: prev.totalShares - 1,
          publicShares: codeShares.find(share => share._id === itemToDelete)?.isPublic
            ? prev.publicShares - 1
            : prev.publicShares,
          privateShares: !codeShares.find(share => share._id === itemToDelete)?.isPublic
            ? prev.privateShares - 1
            : prev.privateShares
        }));
      } catch (err) {
        setError(err.message || 'Failed to delete code share');
      }
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setItemToDelete(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/20 relative">
      {/* Subtle background pattern for light theme */}
      
      
      {/* Modern Navigation Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <KodeshareIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-xs text-slate-500 dark:text-gray-400">Welcome back, {user?.username}</p>
              </div>
            </div>
            
            <button
              onClick={handleCreateNewCodeShare}
              disabled={creating}
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Code</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Modern Stats Overview */}
        {codeShares.length > 0 && (
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Code Shares */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200/60 dark:hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Codes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalShares}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Active
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Views */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-200/60 dark:hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Total Views</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalViews.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Trending
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Public Shares */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200/60 dark:hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Public</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.publicShares}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                      Shared
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/30 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Private Shares */}
            <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-200/60 dark:hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-gray-400">Private</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.privateShares}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-amber-500/30 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Filters & Controls */}
        {codeShares.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-sm border border-slate-200/60 dark:border-slate-700">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Filter Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Filter by Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full pl-4 pr-10 py-2.5 text-base border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl shadow-sm transition-all duration-200"
                  >
                    <option value="all">All Code Shares</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-4 pr-10 py-2.5 text-base border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl shadow-sm transition-all duration-200"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>
              </div>

              {/* View Toggle & Results Count */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                  {getFilteredCodeShares().length} of {codeShares.length} codes
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1 border border-slate-200/50 dark:border-slate-600/50">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
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
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
                    }`}
                    title="Card View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4H3m16 8H5m14 4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/30 text-red-700 dark:text-red-400 p-6 rounded-2xl mb-8 shadow-sm">
            <div className="flex items-center">
              <div className="bg-red-100 dark:bg-red-800/30 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
            <div className="text-center py-16 px-8">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin"></div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Loading Your Code Collection</h2>
              <p className="text-slate-600 dark:text-gray-400">
                Please wait while we fetch your code shares...
              </p>
            </div>
          </div>
        ) : codeShares.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 overflow-hidden">
            <div className="text-center py-16 px-8">
              <div className="mx-auto mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to Start Coding?</h2>
              <p className="text-slate-600 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                You haven't created any code shares yet. Start by creating your first snippet to organize and share your code.
              </p>
              <button
                onClick={handleCreateNewCodeShare}
                disabled={creating}
                className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  {creating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Your First Code</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Code Shares Grid/List */
          <div ref={contentRef} className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'} mt-8`}>
            {getFilteredCodeShares().map((codeShare) => (
              <div
                key={codeShare._id}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-200/60 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {viewMode === 'grid' ? (
                  /* Grid View Layout */
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            codeShare.isPublic
                              ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30'
                              : 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 ${codeShare.isPublic ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full mr-1.5`}></span>
                            {codeShare.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteCodeShare(codeShare._id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title="Delete code share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Title and Language */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-800/30 rounded-md uppercase tracking-wider">
                          {codeShare.language}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-2">
                        {codeShare.title}
                      </h3>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{codeShare.accessCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatDate(codeShare.createdAt).split(',')[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/code/${codeShare._id}`}
                      className="group/btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open Code</span>
                    </Link>
                  </div>
                ) : (
                  /* List View Layout */
                  <div className="flex items-center p-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                            {codeShare.title}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            codeShare.isPublic
                              ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30'
                              : 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30'
                          }`}>
                            {codeShare.isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {codeShare.language}
                          </span>
                          <span>•</span>
                          <span>{codeShare.accessCount || 0} views</span>
                          <span>•</span>
                          <span>{formatDate(codeShare.createdAt).split(',')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/code/${codeShare._id}`}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow-md hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Open</span>
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteCodeShare(codeShare._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                        title="Delete code share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Custom Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Code Share
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Are you sure you want to delete this code share? This will permanently remove the code and all associated data.
              </p>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-200/60 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-6 py-2.5 text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-all duration-200 hover:scale-105"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-red-500/25"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    
  );
};


export default Dashboard;

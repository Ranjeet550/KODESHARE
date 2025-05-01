import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createCodeShare } from '../utils/api';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AnimatedBackground from '../components/AnimatedBackground';
import AnimatedFeatureIcon from '../components/AnimatedFeatureIcon';
import CanvasAnimation from '../components/CanvasAnimation';
import HeroCarousel from '../components/HeroCarousel';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customId, setCustomId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const ctaRef = useRef(null);

  // Check if we're at the root URL and there's a path segment after it
  useEffect(() => {
    const path = location.pathname;
    if (path !== '/' && !path.startsWith('/code/') && !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/dashboard')) {
      // Extract the custom ID from the URL (remove leading slash)
      const customSlug = path.substring(1);
      if (customSlug && /^[a-zA-Z0-9_-]{1,50}$/.test(customSlug)) {
        // Navigate to the code editor with this custom ID
        navigate(`/code/${customSlug}`);
      }
    }
  }, [location, navigate]);

  // Setup animations
  useEffect(() => {
    // Animate sections on scroll
    const sections = [heroRef.current, featuresRef.current, howItWorksRef.current, ctaRef.current];

    sections.forEach((section, index) => {
      if (!section) return;

      // Initial state
      gsap.set(section, {
        y: 50,
        opacity: 0
      });

      // Create scroll animation
      gsap.to(section, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom-=100',
          toggleActions: 'play none none reverse'
        },
        delay: index * 0.1
      });
    });

    return () => {
      // Cleanup
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleCreateNewCodeShare = async () => {
    try {
      setLoading(true);
      setError(null);

      // If user entered a custom ID, validate it first
      if (customId.trim()) {
        // Validate custom ID format
        const customIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
        if (!customIdRegex.test(customId.trim())) {
          setError('Custom ID can only contain letters, numbers, underscores, and hyphens (max 50 characters)');
          setLoading(false);
          return;
        }

        // Create a code share with the custom ID
        try {
          await createCodeShare({
            title: 'Untitled Code',
            language: 'javascript',
            code: '// Start coding here...',
            isPublic: true,
            expiresIn: 24, // 24 hours
            customId: customId.trim()
          });

          // Navigate to the code editor with the custom ID
          navigate(`/code/${customId.trim()}`);
        } catch (err) {
          // If there's an error (like duplicate ID), just navigate to the URL
          // The server will handle creating it or returning an existing one
          navigate(`/code/${customId.trim()}`);
        }
        return;
      }

      // Create a new code share with default values (no custom ID)
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
      setLoading(false);
    }
  };

  // Handle direct URL input
  const handleDirectUrlInput = (e) => {
    e.preventDefault();
    if (customId.trim()) {
      // Validate custom ID format
      const customIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
      if (!customIdRegex.test(customId.trim())) {
        setError('Custom ID can only contain letters, numbers, underscores, and hyphens (max 50 characters)');
        return;
      }

      // Navigate directly to the custom URL
      window.location.href = `/${customId.trim()}`;
    }
  };

  return (
    <div className="flex flex-col items-center relative">
      {/* Animated Background */}
      <AnimatedBackground />
      <CanvasAnimation />

      {/* Hero Carousel Section */}
      <div ref={heroRef} className="w-full mb-24">
        <HeroCarousel
          onCreateClick={handleCreateNewCodeShare}
          onCustomIdSubmit={handleDirectUrlInput}
          customId={customId}
          setCustomId={setCustomId}
          loading={loading}
          error={error}
        />
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="w-full max-w-6xl mb-28 px-6">
        {/* Section Header with Decorative Elements */}
        <div className="relative mb-16 text-center">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#E9F5BE]/50 dark:bg-[#81E7AF]/20 rounded-full blur-3xl opacity-70"></div>
          <span className="inline-block text-[#03A791] dark:text-[#81E7AF] font-semibold mb-3">POWERFUL FEATURES</span>
          <h2 className="text-5xl font-bold text-gray-800 dark:text-white relative z-10">
            Why Choose <span className="text-[#03A791] dark:text-[#81E7AF]">Code Ghar</span>?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#03A791] to-[#F1BA88] mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Feature Card 1 */}
          <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] border border-gray-100 dark:border-dark-600 group">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-[#81E7AF]/20 dark:bg-[#03A791]/30 rounded-2xl transform -rotate-6 scale-90 opacity-50 group-hover:rotate-3 transition-all duration-300"></div>
              <AnimatedFeatureIcon delay={0.1}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#03A791] dark:text-[#81E7AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </AnimatedFeatureIcon>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#03A791] dark:group-hover:text-[#81E7AF] transition-colors duration-300">Real-time Collaboration</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Work together with your team in real-time. See changes as they happen and collaborate seamlessly without delays or conflicts.
            </p>
            <div className="mt-6 w-12 h-1 bg-[#03A791]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] border border-gray-100 dark:border-dark-600 group">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-[#F1BA88]/20 dark:bg-[#F1BA88]/30 rounded-2xl transform rotate-6 scale-90 opacity-50 group-hover:-rotate-3 transition-all duration-300"></div>
              <AnimatedFeatureIcon delay={0.2}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#F1BA88] dark:text-[#F1BA88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </AnimatedFeatureIcon>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#F1BA88] dark:group-hover:text-[#F1BA88] transition-colors duration-300">Syntax Highlighting</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Support for multiple programming languages with beautiful syntax highlighting for better readability and coding experience.
            </p>
            <div className="mt-6 w-12 h-1 bg-[#F1BA88]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] border border-gray-100 dark:border-dark-600 group">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-[#E9F5BE]/20 dark:bg-[#E9F5BE]/30 rounded-2xl transform -rotate-3 scale-90 opacity-50 group-hover:rotate-6 transition-all duration-300"></div>
              <AnimatedFeatureIcon delay={0.3}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#81E7AF] dark:text-[#E9F5BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </AnimatedFeatureIcon>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#81E7AF] dark:group-hover:text-[#E9F5BE] transition-colors duration-300">Secure Sharing</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Control who can access your code with private sharing options, custom URLs, and expiration settings for enhanced security.
            </p>
            <div className="mt-6 w-12 h-1 bg-[#81E7AF]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div ref={howItWorksRef} className="w-full max-w-5xl px-6 mb-28">
        {/* Section Header */}
        <div className="relative mb-16 text-center">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#F1BA88]/20 dark:bg-[#F1BA88]/20 rounded-full blur-3xl opacity-70"></div>
          <span className="inline-block text-[#F1BA88] dark:text-[#F1BA88] font-semibold mb-3">SIMPLE PROCESS</span>
          <h2 className="text-5xl font-bold text-gray-800 dark:text-white relative z-10">
            How It <span className="text-[#F1BA88] dark:text-[#F1BA88]">Works</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#F1BA88] to-[#03A791] mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-[28px] top-[70px] bottom-[70px] w-1 bg-gradient-to-b from-[#03A791] via-[#81E7AF] to-[#F1BA88] rounded-full hidden md:block"></div>

          <div className="space-y-16 relative">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 group">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-[#03A791]/20 dark:bg-[#03A791]/30 rounded-full blur-xl scale-150 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="bg-gradient-to-br from-[#03A791] to-[#81E7AF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl font-bold">1</span>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-600 md:ml-4 w-full max-w-3xl group-hover:shadow-2xl transition-all duration-300 group-hover:translate-y-[-5px]">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#03A791] dark:group-hover:text-[#81E7AF] transition-colors duration-300">
                  Create a code share
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Click the "Create New Code Share" button to instantly create a new code sharing session.
                  You can choose your preferred programming language and customize settings to suit your needs.
                </p>
                <div className="mt-6 flex items-center text-[#03A791] dark:text-[#81E7AF] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Quick and easy setup</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 group">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-[#F1BA88]/20 dark:bg-[#F1BA88]/30 rounded-full blur-xl scale-150 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="bg-gradient-to-br from-[#F1BA88] to-[#E9F5BE] text-[#03A791] rounded-full w-14 h-14 flex items-center justify-center shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl font-bold">2</span>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-600 md:ml-4 w-full max-w-3xl group-hover:shadow-2xl transition-all duration-300 group-hover:translate-y-[-5px]">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#F1BA88] dark:group-hover:text-[#F1BA88] transition-colors duration-300">
                  Share the link
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Copy the unique URL from your browser and share it with your collaborators.
                  Anyone with the link can join your coding session instantly, no account required.
                </p>
                <div className="mt-6 flex items-center text-[#F1BA88] dark:text-[#F1BA88] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Instant collaboration</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 group">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-[#E9F5BE]/20 dark:bg-[#E9F5BE]/30 rounded-full blur-xl scale-150 opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="bg-gradient-to-br from-[#81E7AF] to-[#E9F5BE] text-[#03A791] rounded-full w-14 h-14 flex items-center justify-center shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl font-bold">3</span>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-600 md:ml-4 w-full max-w-3xl group-hover:shadow-2xl transition-all duration-300 group-hover:translate-y-[-5px]">
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#81E7AF] dark:group-hover:text-[#E9F5BE] transition-colors duration-300">
                  Code together
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  Start coding in real-time with your team. All changes are synchronized instantly,
                  making collaboration seamless and efficient. Perfect for pair programming and teaching.
                </p>
                <div className="mt-6 flex items-center text-[#81E7AF] dark:text-[#E9F5BE] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time synchronization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="w-full max-w-5xl px-6 mb-20">
        <div className="relative bg-gradient-to-br from-[#F1BA88] via-[#03A791] to-[#81E7AF] dark:from-[#F1BA88] dark:via-[#03A791] dark:to-[#81E7AF] p-12 md:p-16 rounded-3xl shadow-2xl overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#E9F5BE]/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-[#F1BA88]/10 rounded-full blur-2xl"></div>

            {/* Animated Circles */}
            <div className="absolute top-20 right-1/4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute bottom-20 right-1/3 w-4 h-4 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-1/2 left-20 w-5 h-5 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
          </div>

          <div className="relative z-10 text-center">
            {/* Badge */}
            <div className="inline-block mb-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-medium">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Join Thousands of Developers
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
              Ready to start coding <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">together?</span>
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create your first code share now and experience the power of real-time collaboration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={handleCreateNewCodeShare}
                disabled={loading}
                className="bg-white hover:bg-[#E9F5BE] text-[#03A791] font-bold py-5 px-10 rounded-xl text-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed border border-white/20 w-full sm:w-auto"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#03A791]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Get Started Now
                  </div>
                )}
              </button>

              <a
                href="#features"
                className="bg-transparent text-white border-2 border-white/30 hover:border-white/60 font-bold py-5 px-10 rounded-xl text-xl transition-all duration-300 hover:bg-white/10 w-full sm:w-auto flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault();
                  featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            {error && (
              <div className="mt-8 bg-red-500/20 backdrop-blur-sm text-white p-4 rounded-lg max-w-md mx-auto border border-red-500/30">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

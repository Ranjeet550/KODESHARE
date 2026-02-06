import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createCodeShare } from "../utils/api";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedBackground from "../components/AnimatedBackground";
import AnimatedFeatureIcon from "../components/AnimatedFeatureIcon";
import CanvasAnimation from "../components/CanvasAnimation";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customId, setCustomId] = useState("");
  const [email, setEmail] = useState("");
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for animations
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);
  const faqRef = useRef(null);
  const integrationRef = useRef(null);
  const securityRef = useRef(null);
  const useCasesRef = useRef(null);
  const demoRef = useRef(null);

  // Check if we're at the root URL and there's a path segment after it
  useEffect(() => {
    // This effect is no longer needed - routing is handled in App.jsx
  }, []);

  // Setup animations
  useEffect(() => {
    // Rotating hero title animation
    if (heroRef.current) {
      const titleSpans = heroRef.current.querySelectorAll(
        "h1 .rotate-text-item",
      );
      if (titleSpans.length > 0) {
        const tl = gsap.timeline({ repeat: -1 });
        const displayDuration = 2; // How long each word shows
        const transitionDuration = 0.5; // Transition animation duration

        titleSpans.forEach((span, index) => {
          const startTime = index * displayDuration;

          // Animate in
          tl.fromTo(
            span,
            {
              opacity: 0,
              rotationY: 90,
              transformOrigin: "center center",
            },
            {
              opacity: 1,
              rotationY: 0,
              duration: transitionDuration,
              ease: "power2.out",
            },
            startTime,
          );

          // Hold visible
          tl.to(span, {
            opacity: 1,
            rotationY: 0,
            duration: displayDuration - transitionDuration * 2,
          });

          // Animate out
          tl.to(span, {
            opacity: 0,
            rotationY: -90,
            duration: transitionDuration,
            ease: "power2.in",
          });
        });
      }
    }
    const sections = [
      heroRef.current,
      featuresRef.current,
      howItWorksRef.current,
      statsRef.current,
      testimonialsRef.current,
      pricingRef.current,
      ctaRef.current,
      faqRef.current,
      integrationRef.current,
      securityRef.current,
      useCasesRef.current,
      demoRef.current,
    ];

    sections.forEach((section, index) => {
      if (!section) return;

      gsap.set(section, {
        y: 50,
        opacity: 0,
      });

      gsap.to(section, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top bottom-=100",
          toggleActions: "play none none reverse",
        },
        delay: index * 0.1,
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle escape key for video modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowVideoModal(false);
      }
    };

    if (showVideoModal) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showVideoModal]);

  const handleCreateNewCodeShare = async () => {
    try {
      setLoading(true);
      setError(null);

      if (customId.trim()) {
        const customIdRegex = /^[a-zA-Z0-9_-]{2,50}$/;
        if (!customIdRegex.test(customId.trim())) {
          setError(
            "Custom ID must be 2-50 characters (letters, numbers, underscores, hyphens)",
          );
          setLoading(false);
          return;
        }

        try {
          await createCodeShare({
            title: "Untitled Code",
            language: "javascript",
            code: "// Start coding here...",
            isPublic: true,
            expiresIn: 24,
            customId: customId.trim(),
          });
          navigate(`/code/${customId.trim()}`);
        } catch (err) {
          navigate(`/code/${customId.trim()}`);
        }
        return;
      }

      const response = await createCodeShare({
        title: "Untitled Code",
        language: "javascript",
        code: "// Start coding here...",
        isPublic: true,
        expiresIn: 24,
      });

      navigate(`/code/${response.codeShare.id}`);
    } catch (err) {
      setError(err.message || "Failed to create new code share");
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSignup = (e) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  const handleWatchDemo = () => {
    setShowVideoModal(true);
  };

  // Data for new sections
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Developer at Google",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      content:
        "Kodeshare has revolutionized how our team collaborates on code. The real-time editing is seamless and the interface is incredibly intuitive.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Tech Lead at Microsoft",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content:
        "We've tried many code sharing tools, but Kodeshare stands out with its performance and reliability. It's become essential for our remote team.",
      rating: 5,
    },
    {
      name: "Emily Johnson",
      role: "Full Stack Developer at Netflix",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content:
        "The custom workspace URLs and security features make Kodeshare perfect for client presentations and code reviews. Highly recommended!",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for individual developers and small projects",
      features: [
        "Unlimited public code shares",
        "Real-time collaboration",
        "Syntax highlighting for 50+ languages",
        "24-hour code expiration",
        "Basic support",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "per month",
      description: "Ideal for professional developers and small teams",
      features: [
        "Everything in Free",
        "Private code shares",
        "Custom workspace URLs",
        "Extended expiration options",
        "Priority support",
        "Advanced collaboration tools",
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Team",
      price: "$29",
      period: "per month",
      description: "Built for teams and organizations",
      features: [
        "Everything in Pro",
        "Team management",
        "Advanced security controls",
        "Analytics and insights",
        "SSO integration",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "How does real-time collaboration work?",
      answer:
        "Our real-time collaboration uses WebSocket technology to sync changes instantly across all connected users. Every keystroke, cursor movement, and selection is synchronized in real-time, creating a seamless collaborative experience.",
    },
    {
      question: "Is my code secure on Kodeshare?",
      answer:
        "Yes, we take security seriously. All code is encrypted in transit and at rest. Private shares are protected with secure URLs, and we offer additional security features like password protection and expiration dates for Pro users.",
    },
    {
      question: "What programming languages are supported?",
      answer:
        "Kodeshare supports syntax highlighting for over 50 programming languages including JavaScript, Python, Java, C++, Go, Rust, TypeScript, PHP, Ruby, and many more. We're constantly adding support for new languages.",
    },
    {
      question: "Can I use custom URLs for my code shares?",
      answer:
        "Yes! You can create custom workspace URLs that are easy to remember and share. This feature is available for all users and is perfect for presentations, tutorials, and team collaboration.",
    },
    {
      question: "How long are code shares stored?",
      answer:
        "Free users can set expiration times up to 24 hours. Pro users have access to extended expiration options including 7 days, 30 days, or permanent storage for important code shares.",
    },
    {
      question: "Do you offer team management features?",
      answer:
        "Yes, our Team plan includes comprehensive team management features including user roles, access controls, team analytics, and centralized billing. Perfect for organizations of any size.",
    },
  ];

  const useCases = [
    {
      title: "Code Reviews",
      description:
        "Streamline your code review process with real-time collaboration and commenting",
      icon: "👥",
      benefits: [
        "Real-time feedback",
        "Version tracking",
        "Team collaboration",
      ],
    },
    {
      title: "Pair Programming",
      description:
        "Code together in real-time, whether you're in the same room or across the globe",
      icon: "💻",
      benefits: [
        "Live cursor tracking",
        "Voice chat integration",
        "Screen sharing",
      ],
    },
    {
      title: "Teaching & Tutorials",
      description:
        "Perfect for coding bootcamps, online courses, and mentoring sessions",
      icon: "🎓",
      benefits: [
        "Student progress tracking",
        "Interactive examples",
        "Assignment sharing",
      ],
    },
    {
      title: "Technical Interviews",
      description:
        "Conduct seamless technical interviews with candidates worldwide",
      icon: "🎯",
      benefits: [
        "Live coding assessment",
        "Multiple language support",
        "Recording capabilities",
      ],
    },
  ];

  const integrations = [
    { name: "GitHub", logo: "🐙", description: "Import and sync repositories" },
    { name: "VS Code", logo: "📝", description: "Native editor integration" },
    { name: "Slack", logo: "💬", description: "Share code in channels" },
    { name: "Discord", logo: "🎮", description: "Embed code shares" },
    { name: "Zoom", logo: "📹", description: "Screen sharing integration" },
    { name: "Figma", logo: "🎨", description: "Design to code workflow" },
  ];

  return (
    <div className="flex flex-col items-center relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      <CanvasAnimation />

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl mx-4 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                See Kodeshare in Action
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Video Content */}
            <div className="relative aspect-video bg-gray-900">
              {/* Replace this with your actual video */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
                title="Kodeshare Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              {/* Fallback content if you don't have a video yet */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#03A791] to-[#81E7AF] text-white">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold mb-2">
                    Demo Video Coming Soon
                  </h4>
                  <p className="text-white/80">
                    Experience the power of real-time collaboration
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 dark:bg-dark-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white">
                    Ready to try it yourself?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Create your first code share in seconds
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowVideoModal(false);
                    handleCreateNewCodeShare();
                  }}
                  className="group relative px-10 py-5 bg-gradient-to-r from-[#03A791] to-[#81E7AF] text-white font-bold rounded-2xl text-lg shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-[#03A791]/25 disabled:opacity-70 disabled:cursor-not-allowed min-w-[220px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#81E7AF] to-[#03A791] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center">
                    Start Coding Free
                    <svg
                      className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative w-full min-h-screen flex items-center justify-center px-6 py-20"
      >
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Hero Badge */}
          <div className="inline-flex items-center px-6 py-3 mb-8 bg-gradient-to-r from-[#03A791]/10 to-[#81E7AF]/10 border border-[#03A791]/20 rounded-full text-sm font-medium text-[#03A791] dark:text-[#81E7AF] backdrop-blur-sm shadow-lg">
            <span className="w-2 h-2 bg-[#03A791] rounded-full mr-3 animate-pulse"></span>
            ✨ Trusted by 500K+ developers worldwide
          </div>

          {/* Hero Title */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-[#03A791] to-[#81E7AF] dark:from-white dark:via-[#81E7AF] dark:to-[#E9F5BE] bg-clip-text text-transparent">
              Code
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#03A791] to-[#F1BA88] bg-clip-text text-transparent">
              Collaborate
            </span>
            <br />
            <span className="text-gray-800 dark:text-white">Create</span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            The ultimate collaborative coding platform. Share code instantly,
            collaborate in real-time, and build extraordinary projects with your
            team.
          </p>

          {/* Custom ID Input */}
          <div className="max-w-lg mx-auto mb-16">
            <div className="flex items-center bg-white/80 dark:bg-dark-700/80 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-dark-600/50 p-3 backdrop-blur-sm">
              <span className="px-4 text-gray-500 dark:text-gray-400 text-sm font-medium">
                kodeshare.dev/
              </span>
              <input
                type="text"
                placeholder="your-custom-workspace"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="flex-1 px-3 py-3 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none font-medium"
              />
              <button
                onClick={handleCreateNewCodeShare}
                disabled={loading || !customId.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#03A791] to-[#81E7AF] text-white rounded-xl font-bold hover:from-[#028a73] hover:to-[#6dd19c] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Create
              </button>
            </div>

            {error && (
              <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Trusted by teams at
            </span>
            <div className="flex items-center gap-8">
              {["Google", "Microsoft", "Meta", "Netflix", "Spotify"].map(
                (company) => (
                  <div
                    key={company}
                    className="px-6 py-3 bg-white/50 dark:bg-dark-700/50 rounded-xl text-gray-600 dark:text-gray-300 font-semibold backdrop-blur-sm border border-gray-200/30 dark:border-dark-600/30"
                  >
                    {company}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-[#81E7AF]/20 to-[#E9F5BE]/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-[#F1BA88]/20 to-[#03A791]/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-20 w-24 h-24 bg-gradient-to-r from-[#E9F5BE]/30 to-[#81E7AF]/30 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef}
        className="w-full py-24 bg-gradient-to-br from-[#03A791]/5 via-white/50 to-[#81E7AF]/5 dark:from-[#03A791]/10 dark:via-dark-800/50 dark:to-[#81E7AF]/10 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { number: "10M+", label: "Code Shares Created" },
              { number: "500K+", label: "Active Developers" },
              { number: "99.9%", label: "Uptime Guarantee" },
              { number: "150+", label: "Countries Served" },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-5xl md:text-6xl font-black text-transparent bg-gradient-to-r from-[#03A791] to-[#81E7AF] bg-clip-text mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="w-full py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#03A791]/10 to-[#81E7AF]/10 text-[#03A791] dark:text-[#81E7AF] rounded-full text-sm font-medium mb-4 text-gray-800 dark:text-white">
              POWERFUL FEATURES
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white relative z-10">
              Why Choose{" "}
              <span className="text-[#03A791] dark:text-[#81E7AF]">
                Kodeshare
              </span>
              ?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#03A791] to-[#F1BA88] mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature Card 1 */}
            <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] border border-gray-100 dark:border-dark-600 group">
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-[#81E7AF]/20 dark:bg-[#03A791]/30 rounded-2xl transform -rotate-6 scale-90 opacity-50 group-hover:rotate-3 transition-all duration-300"></div>
                <AnimatedFeatureIcon delay={0.1}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-[#03A791] dark:text-[#81E7AF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </AnimatedFeatureIcon>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#03A791] dark:group-hover:text-[#81E7AF] transition-colors duration-300">
                Real-time Collaboration
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Work together with your team in real-time. See changes as they
                happen and collaborate seamlessly without delays or conflicts.
              </p>
              <div className="mt-6 w-12 h-1 bg-[#03A791]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] border border-gray-100 dark:border-dark-600 group">
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-[#F1BA88]/20 dark:bg-[#F1BA88]/30 rounded-2xl transform rotate-6 scale-90 opacity-50 group-hover:-rotate-3 transition-all duration-300"></div>
                <AnimatedFeatureIcon delay={0.2}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-[#F1BA88] dark:text-[#F1BA88]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </AnimatedFeatureIcon>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#F1BA88] dark:group-hover:text-[#F1BA88] transition-colors duration-300">
                Syntax Highlighting
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Support for multiple programming languages with beautiful syntax
                highlighting for better readability and coding experience.
              </p>
              <div className="mt-6 w-12 h-1 bg-[#F1BA88]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] border border-gray-100 dark:border-dark-600 group">
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-[#E9F5BE]/20 dark:bg-[#E9F5BE]/30 rounded-2xl transform -rotate-3 scale-90 opacity-50 group-hover:rotate-6 transition-all duration-300"></div>
                <AnimatedFeatureIcon delay={0.3}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-[#81E7AF] dark:text-[#E9F5BE]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </AnimatedFeatureIcon>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-[#81E7AF] dark:group-hover:text-[#E9F5BE] transition-colors duration-300">
                Secure Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Control who can access your code with private sharing options,
                custom URLs, and expiration settings for enhanced security.
              </p>
              <div className="mt-6 w-12 h-1 bg-[#81E7AF]/50 rounded-full group-hover:w-full transition-all duration-500"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <div ref={howItWorksRef} className="w-full max-w-5xl px-6 mb-28">
        {/* Section Header */}
        <div className="relative mb-16 text-center">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#F1BA88]/20 dark:bg-[#F1BA88]/20 rounded-full blur-3xl opacity-70"></div>
          <span className="inline-block text-[#F1BA88] dark:text-[#F1BA88] font-semibold mb-3">
            SIMPLE PROCESS
          </span>
          <h2 className="text-5xl font-bold text-gray-800 dark:text-white relative z-10">
            How It{" "}
            <span className="text-[#F1BA88] dark:text-[#F1BA88]">Works</span>
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
                  Click the "Create New Code Share" button to instantly create a
                  new code sharing session. You can choose your preferred
                  programming language and customize settings to suit your
                  needs.
                </p>
                <div className="mt-6 flex items-center text-[#03A791] dark:text-[#81E7AF] font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
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
                  Copy the unique URL from your browser and share it with your
                  collaborators. Anyone with the link can join your coding
                  session instantly, no account required.
                </p>
                <div className="mt-6 flex items-center text-[#F1BA88] dark:text-[#F1BA88] font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
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
                  Start coding in real-time with your team. All changes are
                  synchronized instantly, making collaboration seamless and
                  efficient. Perfect for pair programming and teaching.
                </p>
                <div className="mt-6 flex items-center text-[#81E7AF] dark:text-[#E9F5BE] font-medium">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
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
            <div
              className="absolute bottom-20 right-1/3 w-4 h-4 bg-white/20 rounded-full animate-ping"
              style={{ animationDuration: "3s" }}
            ></div>
            <div
              className="absolute top-1/2 left-20 w-5 h-5 bg-white/20 rounded-full animate-ping"
              style={{ animationDuration: "4s" }}
            ></div>
          </div>

          <div className="relative z-10 text-center">
            {/* Badge */}
            <div className="inline-block mb-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-medium">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Join Thousands of Developers
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
              Ready to start coding{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                together?
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create your first code share now and experience the power of
              real-time collaboration.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={handleCreateNewCodeShare}
                disabled={loading}
                className="bg-white hover:bg-[#E9F5BE] text-[#03A791] font-bold py-5 px-10 rounded-xl text-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed border border-white/20 w-full sm:w-auto"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#03A791]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
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
                  featuresRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>

            {error && (
              <div className="mt-8 bg-red-500/20 backdrop-blur-sm text-white p-4 rounded-lg max-w-md mx-auto border border-red-500/30">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-red-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef}
        className="w-full py-24 bg-gradient-to-br from-gray-50 to-white dark:from-dark-800 dark:to-dark-700 px-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#03A791]/10 to-[#81E7AF]/10 text-[#03A791] dark:text-[#81E7AF] rounded-full text-sm font-medium mb-4">
              TESTIMONIALS
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              What Developers{" "}
              <span className="text-[#03A791] dark:text-[#81E7AF]">Say</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#03A791] to-[#F1BA88] mx-auto rounded-full"></div>
          </div>

          {/* Testimonials Container */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white dark:bg-dark-700 rounded-3xl shadow-2xl p-12 border border-gray-100 dark:border-dark-600">
              <div className="text-center">
                {/* Quote Icon */}
                <div className="w-16 h-16 bg-gradient-to-r from-[#03A791] to-[#81E7AF] rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Testimonial Content */}
                <blockquote className="text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                  "{testimonials[activeTestimonial].content}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center justify-center">
                  <img
                    src={testimonials[activeTestimonial].avatar}
                    alt={testimonials[activeTestimonial].name}
                    className="w-16 h-16 rounded-full mr-4 border-4 border-[#03A791]/20"
                  />
                  <div className="text-left">
                    <div className="font-bold text-gray-800 dark:text-white text-lg">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-[#03A791] dark:text-[#81E7AF] font-medium">
                      {testimonials[activeTestimonial].role}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex justify-center mt-6">
                  {[...Array(testimonials[activeTestimonial].rating)].map(
                    (_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400 mx-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial
                      ? "bg-[#03A791] scale-125"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-[#03A791]/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section ref={useCasesRef} className="w-full py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#F1BA88]/10 to-[#03A791]/10 text-[#F1BA88] dark:text-[#F1BA88] rounded-full text-sm font-medium mb-4">
              USE CASES
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              Perfect for <span className="text-[#F1BA88]">Every</span> Scenario
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#F1BA88] to-[#03A791] mx-auto rounded-full"></div>
          </div>

          {/* Use Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-dark-600 group hover:scale-105"
              >
                <div className="text-6xl mb-6 text-center group-hover:scale-110 transition-transform duration-300">
                  {useCase.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white text-center">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center leading-relaxed">
                  {useCase.description}
                </p>
                <div className="space-y-2">
                  {useCase.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-center text-[#03A791] dark:text-[#81E7AF]"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        ref={pricingRef}
        className="w-full py-24 bg-gradient-to-br from-gray-50 to-white dark:from-dark-800 dark:to-dark-700 px-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#81E7AF]/10 to-[#E9F5BE]/10 text-[#03A791] dark:text-[#81E7AF] rounded-full text-sm font-medium mb-4">
              PRICING
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              Choose Your{" "}
              <span className="text-[#03A791] dark:text-[#81E7AF]">Plan</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#03A791] to-[#81E7AF] mx-auto rounded-full"></div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-dark-700 rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "border-[#03A791] dark:border-[#81E7AF] shadow-[#03A791]/20 dark:shadow-[#81E7AF]/20"
                    : "border-gray-200 dark:border-dark-600 hover:border-[#03A791] dark:hover:border-[#81E7AF]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#03A791] to-[#81E7AF] text-white px-6 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-5xl font-black text-[#03A791] dark:text-[#81E7AF]">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-[#03A791] dark:text-[#81E7AF] mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#03A791] to-[#81E7AF] text-white hover:from-[#028a73] hover:to-[#6dd19c] shadow-lg hover:shadow-xl"
                      : "bg-gray-100 dark:bg-dark-600 text-gray-800 dark:text-white hover:bg-[#03A791] hover:text-white dark:hover:bg-[#81E7AF] dark:hover:text-gray-800"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section ref={integrationRef} className="w-full py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#E9F5BE]/10 to-[#F1BA88]/10 text-[#F1BA88] dark:text-[#F1BA88] rounded-full text-sm font-medium mb-4">
              INTEGRATIONS
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              Works with Your <span className="text-[#F1BA88]">Favorite</span>{" "}
              Tools
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#F1BA88] to-[#03A791] mx-auto rounded-full"></div>
          </div>

          {/* Integration Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-600 group hover:scale-105 text-center"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {integration.logo}
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                  {integration.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section
        ref={securityRef}
        className="w-full py-24 bg-gradient-to-br from-gray-50 to-white dark:from-dark-800 dark:to-dark-700 px-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-red-100 to-orange-100 text-red-600 dark:text-red-400 rounded-full text-sm font-medium mb-4">
              SECURITY
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              Your Code is <span className="text-red-500">Secure</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
          </div>

          {/* Security Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-600 group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                End-to-End Encryption
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All code is encrypted in transit and at rest using
                industry-standard AES-256 encryption.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-600 group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                SOC 2 Compliant
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We meet the highest security standards with regular audits and
                compliance certifications.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-700 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-600 group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                Private by Default
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your private code shares are never indexed or accessible to
                anyone without the direct link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="w-full py-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#03A791]/10 to-[#E9F5BE]/10 text-[#03A791] dark:text-[#81E7AF] rounded-full text-sm font-medium mb-4">
              FAQ
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              Got{" "}
              <span className="text-[#03A791] dark:text-[#81E7AF]">
                Questions?
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#03A791] to-[#E9F5BE] mx-auto rounded-full"></div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? null : index)
                  }
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors duration-200"
                >
                  <span className="text-lg font-semibold text-gray-800 dark:text-white pr-8">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-6 h-6 text-[#03A791] dark:text-[#81E7AF] flex-shrink-0 transition-transform duration-200 ${
                      activeFaq === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {activeFaq === index && (
                  <div className="px-8 pb-6">
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section
        ref={demoRef}
        className="w-full py-24 bg-gradient-to-br from-[#03A791]/5 via-white/50 to-[#81E7AF]/5 dark:from-[#03A791]/10 dark:via-dark-800/50 dark:to-[#81E7AF]/10 px-6"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#81E7AF]/10 to-[#F1BA88]/10 text-[#03A791] dark:text-[#81E7AF] rounded-full text-sm font-medium mb-4">
              DEMO
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-6">
              See It in{" "}
              <span className="text-[#03A791] dark:text-[#81E7AF]">Action</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#03A791] to-[#F1BA88] mx-auto rounded-full"></div>
          </div>

          {/* Demo Content */}
          <div className="bg-white dark:bg-dark-700 rounded-3xl shadow-2xl p-12 border border-gray-100 dark:border-dark-600">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-[#03A791] to-[#81E7AF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                Watch Kodeshare in Action
              </h3>

              <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                See how easy it is to create, share, and collaborate on code
                with your team in real-time.
              </p>

              <button
                onClick={handleWatchDemo}
                className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-[#03A791] to-[#81E7AF] text-white font-bold rounded-2xl text-xl shadow-2xl hover:shadow-[#03A791]/25 transform transition-all duration-300 hover:scale-105"
              >
                <svg
                  className="w-6 h-6 mr-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

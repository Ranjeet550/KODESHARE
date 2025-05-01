import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import FloatingCodeSnippets from './FloatingCodeSnippets';

const slides = [
  {
    title: "Share Code in Real-Time",
    subtitle: "Collaborate seamlessly with your team on any coding project",
    image: "/hero-slide1.svg", // You can add actual images to your public folder
    color: "from-[#03A791] to-[#81E7AF]"
  },
  {
    title: "Multiple Languages Support",
    subtitle: "Write and share code in dozens of programming languages",
    image: "/hero-slide2.svg",
    color: "from-[#F1BA88] to-[#03A791]"
  },
  {
    title: "Secure & Customizable",
    subtitle: "Create custom URLs and control who can access your code",
    image: "/hero-slide3.svg",
    color: "from-[#81E7AF] to-[#E9F5BE]"
  }
];

const HeroCarousel = ({ onCreateClick, onCustomIdSubmit, customId, setCustomId, loading, error }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideRefs = useRef([]);
  const carouselRef = useRef(null);
  const indicatorsRef = useRef([]);

  // Initialize slide refs
  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, slides.length);
    indicatorsRef.current = indicatorsRef.current.slice(0, slides.length);
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        goToSlide((currentSlide + 1) % slides.length);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [currentSlide, isAnimating]);

  const goToSlide = (index) => {
    if (isAnimating || index === currentSlide) return;

    setIsAnimating(true);

    // Animate out current slide
    gsap.to(slideRefs.current[currentSlide], {
      opacity: 0,
      x: -50,
      duration: 0.5,
      ease: "power2.out"
    });

    // Update indicators
    gsap.to(indicatorsRef.current[currentSlide], {
      width: "2rem",
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      duration: 0.5
    });

    // Animate in new slide
    gsap.fromTo(
      slideRefs.current[index],
      { opacity: 0, x: 50 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        delay: 0.3,
        ease: "power2.out",
        onComplete: () => setIsAnimating(false)
      }
    );

    // Update active indicator
    gsap.to(indicatorsRef.current[index], {
      width: "3rem",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      duration: 0.5
    });

    // Update background gradient
    gsap.to(carouselRef.current, {
      backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
      duration: 1,
      className: `bg-gradient-to-br ${slides[index].color}`
    });

    setCurrentSlide(index);
  };

  return (
    <div
      ref={carouselRef}
      className={`w-full py-20 px-6 bg-gradient-to-br ${slides[currentSlide].color} dark:opacity-90 rounded-3xl shadow-xl relative overflow-hidden`}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Floating Code Snippets */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingCodeSnippets />
      </div>

      {/* Carousel Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Slides */}
        <div className="relative h-[350px] md:h-[300px] mb-12">
          {slides.map((slide, index) => (
            <div
              key={index}
              ref={el => slideRefs.current[index] = el}
              className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-center md:text-left md:max-w-xl">
                  {/* Badge */}
                  <div className="inline-block mb-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-medium">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Real-time Collaboration Platform
                  </div>

                  <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white tracking-tight leading-tight">
                    {slide.title}
                  </h1>

                  <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>

                <div className="hidden md:block w-64 h-64 relative">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="relative transform transition-all duration-1000 hover:scale-110 hover:rotate-3">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center space-x-4 mb-10">
          {slides.map((_, index) => (
            <button
              key={index}
              ref={el => indicatorsRef.current[index] = el}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all duration-500 relative ${
                index === currentSlide ? 'w-12 bg-white/90' : 'w-8 bg-white/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === currentSlide && (
                <span className="absolute inset-0 bg-white/50 rounded-full animate-ping"></span>
              )}
            </button>
          ))}
        </div>

        {/* Direct URL Input */}
        <div className="mb-12 max-w-2xl mx-auto backdrop-blur-md bg-white/10 p-2 rounded-2xl shadow-xl border border-white/10">
          <form onSubmit={onCustomIdSubmit} className="flex flex-col sm:flex-row items-center p-2 rounded-xl">
            <div className="flex items-center w-full bg-white/10 rounded-xl px-2">
              <span className="text-white font-mono text-lg px-3 py-2">localhost:5174/</span>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="your-custom-id"
                className="w-full px-4 py-5 rounded-xl border-0 focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/50 transition-all duration-200"
                pattern="[a-zA-Z0-9_-]+"
                title="Only letters, numbers, underscores, and hyphens are allowed"
              />
            </div>
            <button
              type="submit"
              className="mt-3 sm:mt-0 sm:ml-3 bg-white hover:bg-[#E9F5BE] text-[#03A791] font-bold py-5 px-8 rounded-xl whitespace-nowrap w-full sm:w-auto transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              Go
            </button>
          </form>
          <p className="text-white/70 text-sm mt-3 text-center px-3">
            Type a custom URL to create or join a code share
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={onCreateClick}
            disabled={loading}
            className="bg-gradient-to-r from-[#F1BA88] to-[#E9F5BE] hover:from-[#E9F5BE] hover:to-[#F1BA88] text-[#03A791] font-bold py-5 px-10 rounded-xl text-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto border border-white/20"
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
                Create New Code Share
              </div>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-8 bg-red-100/90 backdrop-blur-sm border-l-4 border-red-500 text-red-700 p-4 rounded-lg max-w-xl mx-auto">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCarousel;

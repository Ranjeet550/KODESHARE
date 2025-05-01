import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const AnimatedFeatureIcon = ({ children, delay = 0 }) => {
  const iconRef = useRef(null);

  useEffect(() => {
    const icon = iconRef.current;

    // Initial state
    gsap.set(icon, {
      scale: 0.5,
      opacity: 0,
      rotation: -10
    });

    // Create animation
    gsap.to(icon, {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.8,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: icon,
        start: 'top bottom-=100',
        toggleActions: 'play none none reverse'
      },
      delay: delay
    });

    // Add hover animation
    const hoverAnimation = () => {
      gsap.to(icon, {
        scale: 1.1,
        rotation: 5,
        duration: 0.3,
        ease: 'power1.out'
      });
    };

    const leaveAnimation = () => {
      gsap.to(icon, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: 'power1.out'
      });
    };

    icon.addEventListener('mouseenter', hoverAnimation);
    icon.addEventListener('mouseleave', leaveAnimation);

    return () => {
      // Cleanup
      if (icon) {
        icon.removeEventListener('mouseenter', hoverAnimation);
        icon.removeEventListener('mouseleave', leaveAnimation);
        gsap.killTweensOf(icon);
      }

      // Clean up any ScrollTrigger instances
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars && trigger.vars.trigger === icon) {
          trigger.kill();
        }
      });
    };
  }, [delay]);

  return (
    <div
      ref={iconRef}
      className="w-14 h-14 bg-[#E9F5BE]/50 dark:bg-[#03A791]/30 rounded-full flex items-center justify-center mb-6 cursor-pointer"
    >
      {children}
    </div>
  );
};

export default AnimatedFeatureIcon;

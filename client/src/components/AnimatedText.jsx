import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

// Register TextPlugin
gsap.registerPlugin(TextPlugin);

const AnimatedText = ({ text, className, delay = 0 }) => {
  const textRef = useRef(null);

  useEffect(() => {
    const textElement = textRef.current;

    // Check if textElement exists
    if (!textElement) return;

    // Split text into characters
    const chars = text.split('');

    // Clear the element
    textElement.textContent = '';

    // Create spans for each character
    chars.forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      textElement.appendChild(span);
    });

    // Animate each character
    const animation = gsap.to(textElement.children, {
      opacity: 1,
      y: 0,
      stagger: 0.05,
      delay: delay,
      ease: 'power3.out',
      duration: 0.5,
      onStart: () => {
        gsap.set(textElement.children, { y: '20px' });
      }
    });

    return () => {
      // Cleanup
      if (animation) {
        animation.kill();
      }
      if (textElement && textElement.children) {
        gsap.killTweensOf(textElement.children);
      }
    };
  }, [text, delay]);

  return (
    <span ref={textRef} className={className}>
      {text}
    </span>
  );
};

export default AnimatedText;

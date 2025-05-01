import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const codeSnippets = [
  {
    language: 'javascript',
    code: `function hello() {\n  console.log("Hello, world!");\n}`,
    color: 'bg-yellow-500'
  },
  {
    language: 'python',
    code: `def greet():\n    print("Hello, world!")`,
    color: 'bg-blue-500'
  },
  {
    language: 'java',
    code: `public void sayHello() {\n    System.out.println("Hello!");\n}`,
    color: 'bg-red-500'
  },
  {
    language: 'html',
    code: `<div class="greeting">\n  <h1>Hello World</h1>\n</div>`,
    color: 'bg-orange-500'
  },
  {
    language: 'css',
    code: `.greeting {\n  color: blue;\n  font-size: 24px;\n}`,
    color: 'bg-purple-500'
  }
];

const FloatingCodeSnippets = () => {
  const snippetsRef = useRef([]);

  useEffect(() => {
    // Create timeline
    const tl = gsap.timeline();

    // Animate each snippet
    snippetsRef.current.forEach((snippet, index) => {
      // Random position
      const xPos = Math.random() * 60 - 30; // -30 to 30
      const yPos = Math.random() * 40 - 20; // -20 to 20
      const rotation = Math.random() * 10 - 5; // -5 to 5
      const scale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

      // Set initial position
      gsap.set(snippet, {
        x: xPos + 'vw',
        y: yPos + 'vh',
        rotation: rotation,
        scale: scale,
        opacity: 0
      });

      // Animate in
      tl.to(snippet, {
        opacity: 0.8,
        duration: 1,
        delay: index * 0.2
      });

      // Create floating animation
      gsap.to(snippet, {
        y: yPos + 10 + 'vh',
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Create subtle rotation
      gsap.to(snippet, {
        rotation: rotation + (Math.random() * 6 - 3),
        duration: 4 + Math.random() * 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });

    return () => {
      // Cleanup
      if (tl) {
        tl.kill();
      }

      // Make sure snippetsRef.current exists and is an array
      if (snippetsRef.current && Array.isArray(snippetsRef.current)) {
        snippetsRef.current.forEach(snippet => {
          if (snippet) {
            gsap.killTweensOf(snippet);
          }
        });
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {codeSnippets.map((snippet, index) => (
        <div
          key={index}
          ref={el => snippetsRef.current[index] = el}
          className={`absolute ${snippet.color} bg-opacity-20 dark:bg-opacity-30 p-3 rounded-lg shadow-lg max-w-xs transform`}
        >
          <div className="text-xs font-mono text-white whitespace-pre">{snippet.code}</div>
        </div>
      ))}
    </div>
  );
};

export default FloatingCodeSnippets;

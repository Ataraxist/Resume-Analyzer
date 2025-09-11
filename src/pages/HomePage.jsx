import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useRef, useEffect } from 'react';
import TopographicalBackground from '../components/TopographicalBackground';

function HomePage() {
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    
    const handleMouseMove = (e) => {
      // Cancel any pending animation frame
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      // Use requestAnimationFrame for smooth updates
      animationFrame = requestAnimationFrame(() => {
        if (!buttonRef.current) return;
        
        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        const buttonCenterY = rect.top + rect.height / 2;
        
        // Calculate distance from cursor to button center
        const distance = Math.sqrt(
          Math.pow(e.clientX - buttonCenterX, 2) + 
          Math.pow(e.clientY - buttonCenterY, 2)
        );
        
        // Convert distance to intensity (0-1 scale)
        // Closer = stronger glow (max distance for effect is 300px)
        const maxDistance = 900;
        const intensity = Math.max(0, 1 - distance / maxDistance);
        
        // Directly update button style for instant response
        button.style.boxShadow = `
          0 0 ${20 + intensity * 30}px rgba(255, 255, 255, ${0.3 + intensity * 0.4}),
          0 0 ${40 + intensity * 60}px rgba(255, 255, 255, ${0.2 + intensity * 0.3}),
          0 0 ${60 + intensity * 100}px rgba(59, 130, 246, ${0.1 + intensity * 0.3})
        `;
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Full page background - break out of container */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 -inset-x-8 -inset-y-8">
          <TopographicalBackground />
        </div>
      </div>
      
      {/* Top-positioned content */}
      <div className="relative z-10 flex flex-col items-center pt-24 md:pt-32 px-4">
        {/* Hero text */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-4 text-white drop-shadow-lg">
          From where you are<br />to where you belong.
        </h1>
        <p className="text-lg md:text-xl text-white/80 text-center mb-12 drop-shadow">
          Chart the waters with CareerCompass.
        </p>
        
        {/* Enhanced CTA Button with proximity glow */}
        <Link
          ref={buttonRef}
          to="/careers"
          className="group inline-flex items-center gap-3 px-8 py-4 text-xl font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:from-primary-700 hover:to-primary-800 transform hover:scale-105 transition-all duration-200"
        >
          <Compass className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
          Start Your Journey
        </Link>
      </div>

      {/* Process Cards */}
      <div className="relative z-10 mt-24 mb-16 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* Step 1 */}
          <div className="group relative flex flex-col items-center">
            <div className="relative w-48 h-48 md:w-56 md:h-56 overflow-hidden rounded-full">
              {/* Background circle with glass effect */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
              <div className="absolute inset-0 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"></div>
              
              {/* Oversized number */}
              <span className="absolute inset-0 flex items-center justify-center text-[14rem] md:text-[18rem] font-bold text-white/10 select-none leading-none">
                1
              </span>
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Choose Your Path</h3>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  Select your current role or dream position
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group relative flex flex-col items-center">
            <div className="relative w-48 h-48 md:w-56 md:h-56 overflow-hidden rounded-full">
              {/* Background circle with glass effect */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
              <div className="absolute inset-0 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"></div>
              
              {/* Oversized number */}
              <span className="absolute inset-0 flex items-center justify-center text-[14rem] md:text-[18rem] font-bold text-white/10 select-none leading-none">
                2
              </span>
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Share Your Story</h3>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  Upload your resume to showcase your experience
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group relative flex flex-col items-center">
            <div className="relative w-48 h-48 md:w-56 md:h-56 overflow-hidden rounded-full">
              {/* Background circle with glass effect */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
              <div className="absolute inset-0 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"></div>
              
              {/* Oversized number */}
              <span className="absolute inset-0 flex items-center justify-center text-[14rem] md:text-[18rem] font-bold text-white/10 select-none leading-none">
                3
              </span>
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Chart Your Course</h3>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  Navigate gaps and accelerate your growth
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
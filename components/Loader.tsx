import React from 'react';

// Inline loader - shows within the content area
export const LeafInlineLoader = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="relative w-20 h-20 overflow-hidden">
          <img 
            src="/leaf.png" 
            alt="Loading" 
            className="w-full h-full object-contain animate-reveal"
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-3">Loading...</p>
      </div>

      <style jsx>{`
        @keyframes reveal {
          0% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.3;
          }
          50% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
          100% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.3;
          }
        }

        .animate-reveal {
          animation: reveal 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Full screen loader - covers entire screen
export const LeafLoader = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="relative">
        <div className="relative w-24 h-24 overflow-hidden">
          <img 
            src="/leaf.png" 
            alt="Loading" 
            className="w-full h-full object-contain animate-reveal"
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">Loading...</p>
      </div>

      <style jsx>{`
        @keyframes reveal {
          0% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.3;
          }
          50% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
          100% {
            clip-path: inset(100% 0 0 0);
            opacity: 0.3;
          }
        }

        .animate-reveal {
          animation: reveal 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// Button loader - replaces button content
export const LeafButtonLoader = () => {
  return (
    <div className="w-full flex items-center justify-center py-4 px-4">
      <div className="relative w-12 h-12 overflow-hidden">
        <img 
          src="/leaf.png" 
          alt="Loading" 
          className="w-full h-full object-contain animate-reveal"
        />
        <style jsx>{`
          @keyframes reveal {
            0% {
              clip-path: inset(100% 0 0 0);
              opacity: 0.3;
            }
            50% {
              clip-path: inset(0 0 0 0);
              opacity: 1;
            }
            100% {
              clip-path: inset(100% 0 0 0);
              opacity: 0.3;
            }
          }

          .animate-reveal {
            animation: reveal 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default LeafInlineLoader;
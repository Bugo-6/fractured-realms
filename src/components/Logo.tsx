import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-full shadow-lg overflow-hidden">
        {/* Pitch lines */}
        <div className="absolute w-full h-full border-2 border-emerald-500 rounded-full opacity-50"></div>
        <div className="absolute w-1/2 h-full border-r-2 border-emerald-500 left-0 opacity-50"></div>
        <div className="absolute w-3 h-3 border-2 border-emerald-500 rounded-full opacity-50"></div>
        
        {/* Ball */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-6 h-6 text-white relative z-10 transform -rotate-12"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 12l3-2.5-1-4.5-4 1-2 4.5 4 1.5z" fill="currentColor" />
          <path d="M12 12l-4 1.5-2-3 2-4 4 1v4.5z" />
          <path d="M12 12l3 2.5 1 4.5-4-1-2-4.5 2-1.5z" />
        </svg>
      </div>
      <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase italic">
        Kick<span className="text-emerald-600">Off</span>
      </span>
    </div>
  );
};

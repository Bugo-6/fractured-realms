import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="relative bg-gray-900 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1518605368461-1e1e38ce81ba?auto=format&fit=crop&q=80&w=2000"
          alt="Football stadium"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            החולצה של הקבוצה שלך <br />
            <span className="text-emerald-500">מחכה לך כאן.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-xl">
            קולקציה חדשה של חולצות כדורגל מקוריות, רטרו ומהדורות מיוחדות. 
            הצטייד לעונה החדשה עם KickOff.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-colors shadow-lg shadow-emerald-600/30"
            >
              קנה עכשיו
            </button>
            <button 
              onClick={() => {
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full backdrop-blur-sm transition-colors"
            >
              צפה בקולקציה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

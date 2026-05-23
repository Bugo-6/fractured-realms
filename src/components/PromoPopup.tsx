import React, { useEffect, useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface PopupProps {
  onAddToCart: (product: Product) => void;
}

export const PromoPopup: React.FC<PopupProps> = ({ onAddToCart }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup shortly after page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const mysteryBoxProduct: Product = {
    id: 'mystery-1',
    name: 'מיסטרי בוקס מונדיאל',
    price: 75,
    category: 'מונדיאל',
    image: '/mystery-box.jpg',
    isNew: true,
  };

  const handleAddToCart = () => {
    onAddToCart(mysteryBoxProduct);
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsVisible(false)}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full transform transition-all animate-in fade-in zoom-in duration-300">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="aspect-[4/3] relative">
          <img 
            src="/mystery-box.jpg" 
            alt="Mystery Box" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
            <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-max mb-2">
              מבצע מיוחד!
            </span>
            <h2 className="text-3xl font-black text-white leading-tight">
              מיסטרי בוקס<br/>מונדיאל
            </h2>
          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6 text-lg">
            חולצת מונדיאל בהפתעה! כולל כל המידות, משלוחים חינם.
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-4xl font-black text-gray-900">₪75</span>
            <span className="text-lg text-gray-400 line-through">₪150</span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition-colors flex justify-center items-center gap-2 text-lg shadow-lg shadow-emerald-600/30"
          >
            <ShoppingCart className="w-6 h-6" />
            הוסף לעגלה עכשיו
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            לא תודה, אולי בפעם אחרת
          </button>
        </div>
      </div>
    </div>
  );
};

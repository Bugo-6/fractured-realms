import React from 'react';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { categories } from '../data/products';

interface NavbarProps {
  cartItemCount: number;
  onOpenCart: () => void;
  onSelectCategory: (category: string | null) => void;
  selectedCategory: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  cartItemCount, 
  onOpenCart, 
  onSelectCategory,
  selectedCategory
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ms-2 text-gray-600 hover:text-emerald-600 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => onSelectCategory(null)}>
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-8">
            <button 
              onClick={() => onSelectCategory(null)}
              className={`text-sm font-medium transition-colors hover:text-emerald-600 ${selectedCategory === null ? 'text-emerald-600' : 'text-gray-700'}`}
            >
              הכל
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${selectedCategory === category ? 'text-emerald-600' : 'text-gray-700'}`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Cart Button */}
          <div className="flex items-center">
            <button
              onClick={onOpenCart}
              className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              aria-label="עגלת קניות"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-emerald-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => {
                onSelectCategory(null);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-right px-3 py-2 rounded-md text-base font-medium ${selectedCategory === null ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'}`}
            >
              הכל
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onSelectCategory(category);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-right px-3 py-2 rounded-md text-base font-medium ${selectedCategory === category ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

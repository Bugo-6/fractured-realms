import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {product.isNew && (
          <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            חדש
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => onAddToCart(product)}
            className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-gray-900 font-bold py-3 px-6 rounded-full flex items-center gap-2 hover:bg-emerald-50"
          >
            <ShoppingCart className="w-5 h-5" />
            הוסף לסל
          </button>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-xs text-emerald-600 font-semibold mb-1">{product.category}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-xl font-black text-gray-900">₪{product.price}</span>
          <button
            onClick={() => onAddToCart(product)}
            className="lg:hidden bg-gray-900 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors"
            aria-label="הוסף לסל"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition-transform ease-in-out duration-300">
          <div className="h-full flex flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                עגלת קניות
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <ShoppingBag className="w-16 h-16 text-gray-300" />
                  <p className="text-lg">העגלה שלך ריקה</p>
                  <button 
                    onClick={onClose}
                    className="text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    המשך בקניות
                  </button>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col flex-1 justify-between">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-500 ms-2"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-gray-600 hover:text-emerald-600"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 text-sm font-medium text-gray-900 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-gray-600 hover:text-emerald-600"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            ₪{item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <div className="flex justify-between text-base font-bold text-gray-900 mb-4">
                  <p>סך הכל</p>
                  <p>₪{total}</p>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  משלוח ומיסים יחושבו בקופה.
                </p>
                <button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex justify-center items-center gap-2"
                  onClick={() => alert('מעבר לתשלום...')}
                >
                  המשך לתשלום
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

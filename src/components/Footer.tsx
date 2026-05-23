import React from 'react';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="bg-white inline-block p-2 rounded-lg">
              <Logo />
            </div>
            <p className="text-gray-400 leading-relaxed">
              היעד מספר אחד שלך לחולצות כדורגל. אנחנו מביאים לכם את החולצות הכי חמות, רטרו נדיר וקולקציות מיוחדות.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              <a href="https://www.instagram.com/kick_off._shop" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-500 transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6">קישורים מהירים</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">דף הבית</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">קולקציה חדשה</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">מבצעים</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">שאלות נפוצות</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6">קטגוריות</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-emerald-500 transition-colors">מונדיאל</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">ריאל מדריד</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">ברצלונה</a></li>
              <li><a href="#" className="hover:text-emerald-500 transition-colors">רטרו</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-bold mb-6">צור קשר</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                <span>רחוב הכדורגל 10, תל אביב</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span dir="ltr">03-123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>support@kickoff.co.il</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} KickOff. כל הזכויות שמורות.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">תנאי שימוש</a>
            <a href="#" className="hover:text-white transition-colors">מדיניות פרטיות</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

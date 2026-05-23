import { Product } from '../types';

export const categories = [
  'מונדיאל',
  'ריאל מדריד',
  'ברצלונה',
  'רטרו',
  'חמש הליגות הבכירות'
];

export const products: Product[] = [
  // מונדיאל
  {
    id: 'wc-1',
    name: 'ארגנטינה בית 2022 - מסי',
    price: 350,
    category: 'מונדיאל',
    image: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
  {
    id: 'wc-2',
    name: 'צרפת חוץ 2022 - אמבפה',
    price: 320,
    category: 'מונדיאל',
    image: 'https://images.unsplash.com/photo-1518605368461-1e1e38ce81ba?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'wc-3',
    name: 'ברזיל בית 2022 - ניימאר',
    price: 330,
    category: 'מונדיאל',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800',
  },
  
  // ריאל מדריד
  {
    id: 'rm-1',
    name: 'ריאל מדריד בית 23/24 - בלינגהאם',
    price: 380,
    category: 'ריאל מדריד',
    image: 'https://images.unsplash.com/photo-1556816723-1ce827b9ef96?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
  {
    id: 'rm-2',
    name: 'ריאל מדריד חוץ 23/24 - ויניסיוס',
    price: 360,
    category: 'ריאל מדריד',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&q=80&w=800',
  },
  
  // ברצלונה
  {
    id: 'fcb-1',
    name: 'ברצלונה בית 23/24 - לבנדובסקי',
    price: 380,
    category: 'ברצלונה',
    image: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
  {
    id: 'fcb-2',
    name: 'ברצלונה שלישית 23/24 - פדרי',
    price: 360,
    category: 'ברצלונה',
    image: 'https://images.unsplash.com/photo-1600147184844-3079213192e3?auto=format&fit=crop&q=80&w=800',
  },

  // רטרו
  {
    id: 'ret-1',
    name: 'מילאן בית 2006/07 - קאקה',
    price: 400,
    category: 'רטרו',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'ret-2',
    name: 'ארסנל בית 2003/04 - הנרי',
    price: 420,
    category: 'רטרו',
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800',
  },

  // חמש הליגות הבכירות
  {
    id: 'top-1',
    name: 'מנצ\'סטר סיטי בית 23/24 - הלאנד',
    price: 370,
    category: 'חמש הליגות הבכירות',
    image: 'https://images.unsplash.com/photo-1605810731664-cae612911c79?auto=format&fit=crop&q=80&w=800',
    isNew: true,
  },
  {
    id: 'top-2',
    name: 'באיירן מינכן בית 23/24 - קיין',
    price: 370,
    category: 'חמש הליגות הבכירות',
    image: 'https://images.unsplash.com/photo-1508344928928-7137b2f002e1?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'top-3',
    name: 'אינטר בית 23/24 - לאוטרו',
    price: 350,
    category: 'חמש הליגות הבכירות',
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800',
  }
];

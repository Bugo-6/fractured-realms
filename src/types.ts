export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  isNew?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

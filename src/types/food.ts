export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isBestSeller?: boolean;
  isTodaySpecial?: boolean;
  rating: number;
  prepTime: number; // in minutes
  available: boolean;
  customizable?: boolean;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  token: number;
  items: CartItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  pickupTime: string;
  totalAmount: number;
  createdAt: Date;
  estimatedPrepTime: number;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  favorites: string[];
  orderHistory: Order[];
}

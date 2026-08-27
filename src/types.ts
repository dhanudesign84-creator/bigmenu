export interface Restaurant {
  id: string;
  name: string;
  subtitle: string;
  logo_url?: string;
  cover_image_url?: string;
  address?: string;
  phone?: string;
  currency_symbol: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  available: boolean;
  vegetarian: boolean;
  prep_time?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OwnerSession {
  email: string;
  token: string;
  expires_at: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

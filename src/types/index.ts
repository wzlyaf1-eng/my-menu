export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  subcategoryId?: string;
  ingredients?: string[];
  preparationTime?: string;
  calories?: number;
  allergens?: string[];
  available: boolean;
  seasonal: boolean;
  bestseller: boolean;
  isNew: boolean;
  limited: boolean;
  moods: string[];
  sizes?: SizeOption[];
  customizations?: CustomizationGroup[];
  rating?: number;
  ratingCount?: number;
  offerPrice?: number;
}

export interface SizeOption {
  id: string;
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: SizeOption;
  selectedCustomizations: SelectedCustomization[];
  notes: string;
}

export interface SelectedCustomization {
  groupId: string;
  optionIds: string[];
}

export interface Order {
  id: string;
  type: 'dine-in' | 'delivery';
  tableNumber?: number;
  customerName?: string;
  phone?: string;
  address?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  createdAt: string;
  notes?: string;
}

export interface Mood {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Table {
  id: string;
  number: number;
  qrCode: string;
}

export interface StoreSettings {
  name: string;
  logo: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram?: string;
  facebook?: string;
  workingHours: string;
  currency: 'IQD' | 'USD' | 'SAR';
  taxRate: number;
  isOpen: boolean;
}

export type FilterType = 'all' | 'hot-drinks' | 'cold-drinks' | 'desserts' | 'breakfast' | 'bakery' | 'seasonal' | 'bestsellers' | 'new' | 'offers';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Category, StoreSettings, FilterType } from '@/types';
import { storeSettings as defaultStoreSettings } from '@/data/demo';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AppState {
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Table
  tableNumber: number | null;
  setTableNumber: (num: number | null) => void;

  // Order Type
  orderType: 'dine-in' | 'delivery' | null;
  setOrderType: (type: 'dine-in' | 'delivery' | null) => void;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: FilterType;
  setActiveFilter: (f: FilterType) => void;

  // Last Order
  lastOrder: CartItem[] | null;
  setLastOrder: (items: CartItem[]) => void;

  // Mood Selection
  selectedMoods: string[];
  toggleMood: (moodId: string) => void;
  clearMoods: () => void;

  // UI
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isProductModalOpen: boolean;
  selectedProduct: Product | null;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
  isMoodFilterOpen: boolean;
  setMoodFilterOpen: (open: boolean) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Dynamic Data & Database CRUD
  products: Product[];
  categories: Category[];
  storeSettings: StoreSettings;
  isDbConnected: boolean;
  isLoading: boolean;
  loadError: string | null;

  fetchData: () => Promise<void>;
  
  // CRUD Products
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // CRUD Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Orders and Analytics
  submitOrder: (tableNumber: number | null, orderType: 'dine-in' | 'delivery', items: CartItem[], total: number) => Promise<void>;
  logVisit: () => Promise<void>;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;
}

type ProductRow = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  offer_price?: number | string | null;
  offerPrice?: number | string | null;
  image?: string | null;
  category_id?: string | null;
  categoryId?: string | null;
  subcategory_id?: string | null;
  subcategoryId?: string | null;
  ingredients?: string[] | null;
  preparation_time?: string | null;
  preparationTime?: string | null;
  calories?: number | null;
  allergens?: string[] | null;
  available?: boolean | null;
  seasonal?: boolean | null;
  bestseller?: boolean | null;
  is_new?: boolean | null;
  isNew?: boolean | null;
  limited?: boolean | null;
  moods?: string[] | null;
  rating?: number | string | null;
  rating_count?: number | string | null;
  ratingCount?: number | string | null;
  sizes?: Product['sizes'] | null;
  customizations?: Product['customizations'] | null;
  created_at?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
};

type DbProductUpdates = Record<string, string | number | boolean | string[] | Product['sizes'] | Product['customizations'] | null | undefined>;

const fallbackImage = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300';

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapProductRow(prod: ProductRow): Product {
  const offerPrice = prod.offer_price ?? prod.offerPrice;
  const ratingCount = prod.rating_count ?? prod.ratingCount;

  return {
    id: prod.id,
    name: prod.name,
    description: prod.description || '',
    price: toNumber(prod.price),
    image: prod.image || '',
    categoryId: prod.category_id || prod.categoryId || '',
    subcategoryId: prod.subcategory_id || prod.subcategoryId || undefined,
    ingredients: prod.ingredients || [],
    preparationTime: prod.preparation_time || prod.preparationTime || '',
    calories: prod.calories ?? undefined,
    allergens: prod.allergens || [],
    available: prod.available ?? true,
    seasonal: prod.seasonal ?? false,
    bestseller: prod.bestseller ?? false,
    isNew: prod.is_new ?? prod.isNew ?? false,
    limited: prod.limited ?? false,
    moods: prod.moods || [],
    rating: prod.rating === null || prod.rating === undefined ? undefined : toNumber(prod.rating),
    ratingCount: ratingCount === null || ratingCount === undefined ? undefined : toNumber(ratingCount),
    sizes: prod.sizes || [],
    customizations: prod.customizations || [],
    offerPrice: offerPrice === null || offerPrice === undefined ? undefined : toNumber(offerPrice),
    updatedAt: prod.updated_at || prod.updatedAt || prod.created_at || undefined
  };
}

function sortByLatestUpdate(products: Product[]) {
  return [...products].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function productToDb(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category_id: product.categoryId,
    preparation_time: product.preparationTime,
    calories: product.calories,
    allergens: product.allergens,
    available: product.available,
    seasonal: product.seasonal,
    bestseller: product.bestseller,
    is_new: product.isNew,
    limited: product.limited,
    moods: product.moods,
    sizes: product.sizes,
    customizations: product.customizations,
    offer_price: product.offerPrice ?? null
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find(
            (c) => c.product.id === item.product.id
          );
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.product.id === item.product.id
                  ? { ...c, quantity: c.quantity + item.quantity }
                  : c
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.product.id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((c) => c.product.id !== productId)
              : state.cart.map((c) =>
                  c.product.id === productId ? { ...c, quantity } : c
                ),
        })),
      clearCart: () => set({ cart: [] }),
      cartTotal: () =>
        get().cart.reduce((total, item) => {
          const currentProduct = get().products.find((p) => p.id === item.product.id) || item.product;
          const sizePrice = item.selectedSize?.price || 0;
          const customPrice = item.selectedCustomizations.reduce(
            (sum, sc) =>
              sum +
              sc.optionIds.reduce((oSum, oid) => {
                const group = currentProduct.customizations?.find(
                  (cg) => cg.id === sc.groupId
                );
                const opt = group?.options.find((o) => o.id === oid);
                return oSum + (opt?.price || 0);
              }, 0),
            0
          );
          const basePrice = currentProduct.offerPrice ?? currentProduct.price;
          return total + (basePrice + sizePrice + customPrice) * item.quantity;
        }, 0),
      cartCount: () => get().cart.reduce((c, i) => c + i.quantity, 0),

      favorites: [],
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),
      isFavorite: (productId) => get().favorites.includes(productId),

      tableNumber: null,
      setTableNumber: (num) => set({ tableNumber: num }),

      orderType: null,
      setOrderType: (type) => set({ orderType: type }),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      activeFilter: 'all',
      setActiveFilter: (f) => set({ activeFilter: f }),

      lastOrder: null,
      setLastOrder: (items) => set({ lastOrder: items }),

      selectedMoods: [],
      toggleMood: (moodId) =>
        set((state) => ({
          selectedMoods: state.selectedMoods.includes(moodId)
            ? state.selectedMoods.filter((id) => id !== moodId)
            : [...state.selectedMoods, moodId],
        })),
      clearMoods: () => set({ selectedMoods: [] }),

      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),
      isProductModalOpen: false,
      selectedProduct: null,
      openProductModal: (product) =>
        set({ isProductModalOpen: true, selectedProduct: product }),
      closeProductModal: () =>
        set({ isProductModalOpen: false, selectedProduct: null }),
      isMoodFilterOpen: false,
      setMoodFilterOpen: (open) => set({ isMoodFilterOpen: open }),

      isDarkMode: false,
      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Dynamic Data Initial State — empty until fetched from the database,
      // so a broken connection is visible instead of silently showing demo data.
      products: [],
      categories: [],
      storeSettings: defaultStoreSettings,
      isDbConnected: isSupabaseConfigured,
      isLoading: false,
      loadError: isSupabaseConfigured
        ? null
        : 'Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',

      fetchData: async () => {
        if (!isSupabaseConfigured) {
          set({
            isDbConnected: false,
            isLoading: false,
            loadError: 'Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
          });
          return;
        }
        set({ isLoading: true, loadError: null });
        try {
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });
          if (catError) throw catError;

          const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (prodError) throw prodError;

          const { data: settingsData, error: settingsError } = await supabase
            .from('store_settings')
            .select('*')
            .maybeSingle();
          if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

          const mappedCategories: Category[] = (catData || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            nameEn: cat.name_en || cat.nameEn || '',
            icon: cat.icon || 'Coffee',
            sortOrder: cat.sort_order ?? cat.sortOrder ?? 0
          }));

          const mappedProducts = sortByLatestUpdate((prodData || []).map((prod) => mapProductRow(prod as ProductRow)));

          const updatedState: Partial<AppState> = {
            isDbConnected: true,
            categories: mappedCategories,
            products: mappedProducts,
            loadError: null
          };

          if (settingsData) {
            updatedState.storeSettings = {
              name: settingsData.name || '',
              logo: settingsData.logo || '',
              phone: settingsData.phone || '',
              whatsapp: settingsData.whatsapp || '',
              address: settingsData.address || '',
              instagram: settingsData.instagram,
              facebook: settingsData.facebook,
              workingHours: settingsData.working_hours || settingsData.workingHours || '',
              currency: settingsData.currency || 'IQD',
              taxRate: settingsData.tax_rate ?? settingsData.taxRate ?? 0,
              isOpen: settingsData.is_open ?? settingsData.isOpen ?? true
            };
          }

          set(updatedState);
        } catch (error) {
          console.warn('Error fetching data from Supabase:', error);
          set({
            isDbConnected: false,
            loadError: 'تعذر تحميل القائمة. تحقق من الاتصال أو إعدادات Supabase.'
          });
        } finally {
          set({ isLoading: false });
        }
      },

      addProduct: async (newProd) => {
        const productWithId = {
          ...newProd,
          id: Math.random().toString(36).substring(2, 9),
          image: newProd.image || fallbackImage,
          updatedAt: new Date().toISOString()
        } as Product;

        if (!isSupabaseConfigured) {
          set((state) => ({ products: sortByLatestUpdate([productWithId, ...state.products]) }));
          return;
        }
        try {
          const { data, error } = await supabase
            .from('products')
            .insert(productToDb(productWithId))
            .select('*')
            .single();
          if (error) throw error;
          const savedProduct = data ? mapProductRow(data as ProductRow) : productWithId;
          set((state) => ({ products: sortByLatestUpdate([savedProduct, ...state.products]) }));
        } catch (error) {
          console.error('Error adding product to Supabase:', error);
          throw error;
        }
      },

      updateProduct: async (id, updates) => {
        const updatedAt = new Date().toISOString();
        if (!isSupabaseConfigured) {
          set((state) => ({
            products: sortByLatestUpdate(
              state.products.map((p) => (p.id === id ? { ...p, ...updates, updatedAt } : p))
            ),
          }));
          return;
        }
        try {
          const dbUpdates: DbProductUpdates = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.price !== undefined) dbUpdates.price = updates.price;
          if (updates.image !== undefined) dbUpdates.image = updates.image;
          if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
          if (updates.preparationTime !== undefined) dbUpdates.preparation_time = updates.preparationTime;
          if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
          if (updates.allergens !== undefined) dbUpdates.allergens = updates.allergens;
          if (updates.available !== undefined) dbUpdates.available = updates.available;
          if (updates.seasonal !== undefined) dbUpdates.seasonal = updates.seasonal;
          if (updates.bestseller !== undefined) dbUpdates.bestseller = updates.bestseller;
          if (updates.isNew !== undefined) dbUpdates.is_new = updates.isNew;
          if (updates.limited !== undefined) dbUpdates.limited = updates.limited;
          if (updates.moods !== undefined) dbUpdates.moods = updates.moods;
          if (updates.sizes !== undefined) dbUpdates.sizes = updates.sizes;
          if (updates.customizations !== undefined) dbUpdates.customizations = updates.customizations;
          if ('offerPrice' in updates) dbUpdates.offer_price = updates.offerPrice ?? null;

          const { data, error } = await supabase
            .from('products')
            .update(dbUpdates, { count: 'exact' })
            .eq('id', id)
            .select('*');
          if (error) throw error;
          const savedProduct = data?.[0] ? mapProductRow(data[0] as ProductRow) : null;
          if (!savedProduct) {
            throw new Error('Product was not found or could not be updated.');
          }
          set((state) => ({
            products: sortByLatestUpdate(
              state.products.map((p) => (p.id === id ? savedProduct : p))
            ),
          }));
        } catch (error) {
          console.error('Error updating product in Supabase:', error);
          throw error;
        }
      },

      deleteProduct: async (id) => {
        if (!isSupabaseConfigured) {
          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
          }));
          return;
        }
        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            products: state.products.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting product from Supabase:', error);
          throw error;
        }
      },

      addCategory: async (newCat) => {
        const catWithId = {
          ...newCat,
          id: 'cat_' + Math.random().toString(36).substring(2, 9)
        } as Category;

        if (!isSupabaseConfigured) {
          set((state) => ({
            categories: [...state.categories, catWithId].sort((a, b) => a.sortOrder - b.sortOrder),
          }));
          return;
        }
        try {
          const { error } = await supabase.from('categories').insert({
            id: catWithId.id,
            name: catWithId.name,
            name_en: catWithId.nameEn,
            icon: catWithId.icon,
            sort_order: catWithId.sortOrder
          });
          if (error) throw error;
          set((state) => ({
            categories: [...state.categories, catWithId].sort((a, b) => a.sortOrder - b.sortOrder),
          }));
        } catch (error) {
          console.error('Error adding category to Supabase:', error);
          throw error;
        }
      },

      updateCategory: async (id, updates) => {
        if (!isSupabaseConfigured) {
          set((state) => ({
            categories: state.categories
              .map((c) => (c.id === id ? { ...c, ...updates } : c))
              .sort((a, b) => a.sortOrder - b.sortOrder),
          }));
          return;
        }
        try {
          const dbUpdates: Record<string, string | number> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
          if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
          if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

          const { error } = await supabase
            .from('categories')
            .update(dbUpdates)
            .eq('id', id);
          if (error) throw error;
          set((state) => ({
            categories: state.categories
              .map((c) => (c.id === id ? { ...c, ...updates } : c))
              .sort((a, b) => a.sortOrder - b.sortOrder),
          }));
        } catch (error) {
          console.error('Error updating category in Supabase:', error);
          throw error;
        }
      },

      deleteCategory: async (id) => {
        if (!isSupabaseConfigured) {
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
          }));
          return;
        }
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting category from Supabase:', error);
          throw error;
        }
      },

      submitOrder: async (tableNumber, orderType, items, total) => {
        if (!isSupabaseConfigured) return;
        try {
          const { error } = await supabase.from('orders').insert({
            table_number: tableNumber,
            order_type: orderType,
            items: items,
            total_price: total
          });
          if (error) throw error;
        } catch (error) {
          console.error('Error submitting order to Supabase:', error);
          throw error;
        }
      },

      logVisit: async () => {
        if (!isSupabaseConfigured) return;
        
        // Prevent logging multiple times in the same session
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            if (sessionStorage.getItem('kb_visit_logged') === 'true') {
              return;
            }
          }
        } catch {
          // Ignore storage accessibility issues
        }

        try {
          const { error } = await supabase.from('analytics').insert({
            type: 'visit'
          });
          if (error) throw error;
          
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              sessionStorage.setItem('kb_visit_logged', 'true');
            }
          } catch {
            // Ignore storage accessibility issues
          }
        } catch (error) {
          console.warn('Non-critical: Analytics visit log failed:', error);
        }
      },

      updateStoreSettings: async (settings) => {
        if (!isSupabaseConfigured) {
          set({ storeSettings: settings });
          return;
        }
        try {
          const { data, error: selectError } = await supabase
            .from('store_settings')
            .select('id')
            .maybeSingle();
          if (selectError) throw selectError;

          const dbSettings = {
            name: settings.name,
            logo: settings.logo,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            address: settings.address,
            instagram: settings.instagram,
            facebook: settings.facebook,
            working_hours: settings.workingHours,
            currency: settings.currency,
            tax_rate: settings.taxRate,
            is_open: settings.isOpen
          };

          if (data?.id) {
            const { error } = await supabase
              .from('store_settings')
              .update(dbSettings)
              .eq('id', data.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('store_settings')
              .insert(dbSettings);
            if (error) throw error;
          }
          set({ storeSettings: settings });
        } catch (error) {
          console.error('Error updating store settings in Supabase:', error);
          throw error;
        }
      },
    }),
    {
      name: 'kunafa-bilali-storage',
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
        tableNumber: state.tableNumber,
        orderType: state.orderType,
        lastOrder: state.lastOrder,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

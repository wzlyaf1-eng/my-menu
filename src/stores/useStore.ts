import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Category, StoreSettings, FilterType } from '@/types';
import { products as demoProducts, categories as demoCategories, storeSettings as demoStoreSettings } from '@/data/demo';
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
          const sizePrice = item.selectedSize?.price || 0;
          const customPrice = item.selectedCustomizations.reduce(
            (sum, sc) =>
              sum +
              sc.optionIds.reduce((oSum, oid) => {
                const group = item.product.customizations?.find(
                  (cg) => cg.id === sc.groupId
                );
                const opt = group?.options.find((o) => o.id === oid);
                return oSum + (opt?.price || 0);
              }, 0),
            0
          );
          return total + (item.product.price + sizePrice + customPrice) * item.quantity;
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

      // Dynamic Data Initial State
      products: demoProducts,
      categories: demoCategories,
      storeSettings: demoStoreSettings,
      isDbConnected: isSupabaseConfigured,
      isLoading: false,

      fetchData: async () => {
        if (!isSupabaseConfigured) return;
        set({ isLoading: true });
        try {
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });
          if (catError) throw catError;

          const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*');
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

          const mappedProducts: Product[] = (prodData || []).map(prod => ({
            id: prod.id,
            name: prod.name,
            description: prod.description || '',
            price: prod.price || 0,
            image: prod.image || '',
            categoryId: prod.category_id || prod.categoryId || '',
            subcategoryId: prod.subcategory_id || prod.subcategoryId,
            ingredients: prod.ingredients || [],
            preparationTime: prod.preparation_time || prod.preparationTime,
            calories: prod.calories,
            allergens: prod.allergens || [],
            available: prod.available ?? true,
            seasonal: prod.seasonal ?? false,
            bestseller: prod.bestseller ?? false,
            isNew: prod.is_new ?? prod.isNew ?? false,
            limited: prod.limited ?? false,
            moods: prod.moods || [],
            rating: prod.rating,
            ratingCount: prod.rating_count || prod.ratingCount,
            sizes: prod.sizes || [],
            customizations: prod.customizations || [],
            offerPrice: prod.offer_price || prod.offerPrice
          }));

          const updatedState: Partial<AppState> = {
            isDbConnected: true
          };
          if (mappedCategories.length > 0) updatedState.categories = mappedCategories;
          if (mappedProducts.length > 0) updatedState.products = mappedProducts;

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
          console.warn('Non-critical: Error fetching data from Supabase (app will run in fallback/demo mode):', error);
          set({ isDbConnected: false });
        } finally {
          set({ isLoading: false });
        }
      },

      addProduct: async (newProd) => {
        const productWithId = {
          ...newProd,
          id: Math.random().toString(36).substring(2, 9)
        } as Product;
        set((state) => ({ products: [...state.products, productWithId] }));

        if (!isSupabaseConfigured) return;
        try {
          const { error } = await supabase.from('products').insert({
            id: productWithId.id,
            name: productWithId.name,
            description: productWithId.description,
            price: productWithId.price,
            image: productWithId.image,
            category_id: productWithId.categoryId,
            preparation_time: productWithId.preparationTime,
            calories: productWithId.calories,
            allergens: productWithId.allergens,
            available: productWithId.available,
            seasonal: productWithId.seasonal,
            bestseller: productWithId.bestseller,
            is_new: productWithId.isNew,
            limited: productWithId.limited,
            moods: productWithId.moods,
            sizes: productWithId.sizes,
            customizations: productWithId.customizations,
            offer_price: productWithId.offerPrice
          });
          if (error) throw error;
        } catch (error) {
          console.error('Error adding product to Supabase:', error);
          throw error;
        }
      },

      updateProduct: async (id, updates) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));

        if (!isSupabaseConfigured) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbUpdates: any = {};
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
          if (updates.offerPrice !== undefined) dbUpdates.offer_price = updates.offerPrice;

          const { error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id);
          if (error) throw error;
        } catch (error) {
          console.error('Error updating product in Supabase:', error);
          throw error;
        }
      },

      deleteProduct: async (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));

        if (!isSupabaseConfigured) return;
        try {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
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
        set((state) => ({ categories: [...state.categories, catWithId] }));

        if (!isSupabaseConfigured) return;
        try {
          const { error } = await supabase.from('categories').insert({
            id: catWithId.id,
            name: catWithId.name,
            name_en: catWithId.nameEn,
            icon: catWithId.icon,
            sort_order: catWithId.sortOrder
          });
          if (error) throw error;
        } catch (error) {
          console.error('Error adding category to Supabase:', error);
          throw error;
        }
      },

      updateCategory: async (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));

        if (!isSupabaseConfigured) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbUpdates: any = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
          if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
          if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

          const { error } = await supabase
            .from('categories')
            .update(dbUpdates)
            .eq('id', id);
          if (error) throw error;
        } catch (error) {
          console.error('Error updating category in Supabase:', error);
          throw error;
        }
      },

      deleteCategory: async (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));

        if (!isSupabaseConfigured) return;
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
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
        set({ storeSettings: settings });
        if (!isSupabaseConfigured) return;
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

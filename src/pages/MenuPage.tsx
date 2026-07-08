import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, RefreshCw, Sparkles } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { BottomNav } from '@/components/shared/BottomNav';
import { CategoryNav, CategorySection } from '@/components/menu/CategoryNav';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductModal } from '@/components/menu/ProductModal';
import { Cart } from '@/components/menu/Cart';
import { MoodFilter } from '@/components/menu/MoodFilter';
import { OffersBanner } from '@/components/menu/OffersBanner';
import { ContactSection } from '@/components/menu/ContactSection';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function MenuSkeleton() {
  return (
    <div className="px-4 max-w-2xl mx-auto space-y-6 py-4">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-20 rounded-full shrink-0" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border/50 overflow-hidden bg-card">
              <Skeleton className="aspect-square rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MenuPage() {
  const {
    searchQuery,
    activeFilter,
    favorites,
    categories,
    products,
    fetchData,
    logVisit,
    isLoading,
    loadError,
  } = useStore();

  useEffect(() => {
    fetchData();
    logVisit();
  }, [fetchData, logVisit]);

  const visibleProducts = useMemo(
    () =>
      products
        .filter((p) => p.available !== false)
        .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let filtered = [...visibleProducts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.ingredients?.some((i) => i.toLowerCase().includes(q)) ||
          categories.find((c) => c.id === p.categoryId)?.name.toLowerCase().includes(q)
      );
    }

    if (activeFilter.startsWith('cat:')) {
      filtered = filtered.filter((p) => p.categoryId === activeFilter.slice(4));
    } else {
      switch (activeFilter) {
        case 'bestsellers':
          filtered = filtered.filter((p) => p.bestseller);
          break;
        case 'new':
          filtered = filtered.filter((p) => p.isNew);
          break;
        case 'offers':
          filtered = filtered.filter((p) => p.offerPrice);
          break;
        case 'seasonal':
          filtered = filtered.filter((p) => p.seasonal);
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [searchQuery, activeFilter, visibleProducts, categories]);

  const categoryProductSections = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          products: filteredProducts
            .filter((product) => product.categoryId === category.id)
            .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
        }))
        .filter((section) => section.products.length > 0),
    [categories, filteredProducts]
  );

  const favoriteProducts = useMemo(
    () => visibleProducts.filter((p) => favorites.includes(p.id)),
    [favorites, visibleProducts]
  );

  const showInitialLoading = isLoading && products.length === 0;
  const showLoadError = !!loadError && products.length === 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Main Content */}
      <main>
        {/* Hero */}
        <section className="relative px-4 pt-6 pb-2 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              <ChefHat className="h-4 w-4" />
              <span>أهلاً وسهلاً بكم</span>
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">
              استمتع بأشهى المنتجات
            </h1>
            <p className="text-muted-foreground text-sm">
              اختر من مجموعتنا المتميزة من المشروبات والحلويات
            </p>
          </motion.div>
        </section>

        {/* Offers Banner */}
        <OffersBanner />

        {/* Categories Grid */}
        <CategorySection />

        {/* Category Filter Nav */}
        <CategoryNav />

        {showInitialLoading ? (
          <MenuSkeleton />
        ) : showLoadError ? (
          <div id="products-section" className="px-4 max-w-2xl mx-auto py-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center rounded-2xl border border-border/50 bg-card p-6"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-destructive" />
              </div>
              <p className="font-bold">تعذر تحميل القائمة</p>
              <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
              <Button onClick={() => fetchData()} className="mt-4 rounded-xl gap-2">
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </motion.div>
          </div>
        ) : (
          <div id="products-section" className="px-4 max-w-2xl mx-auto space-y-6 py-4">
            {categoryProductSections.map(({ category, products: catProducts }) => (
              <section key={category.id} id={`category-${category.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 mb-3"
                >
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h2 className="font-bold text-lg">{category.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    ({catProducts.length})
                  </span>
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  {catProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            ))}

            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  لا توجد منتجات مطابقة لبحثك
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  جرب كلمات مختلفة أو تصفح الفئات
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Favorites Section */}
        {favoriteProducts.length > 0 && (
          <section id="favorites-section" className="px-4 py-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-rose-500 rounded-full" />
              <h2 className="font-bold text-lg">المفضلة</h2>
              <span className="text-xs text-muted-foreground">
                ({favoriteProducts.length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {favoriteProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Contact Section */}
        <ContactSection />

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-muted-foreground">
          <p>© 2025 كنافة بلالي - جميع الحقوق محفوظة</p>
        </footer>
      </main>

      {/* Floating Navigation */}
      <BottomNav />

      {/* Overlays */}
      <ProductModal />
      <Cart />
      <MoodFilter />
    </div>
  );
}

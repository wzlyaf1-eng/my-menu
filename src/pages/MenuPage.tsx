import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles } from 'lucide-react';
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

export function MenuPage() {
  const { searchQuery, activeFilter, favorites, categories, products, fetchData, logVisit } = useStore();

  useEffect(() => {
    fetchData();
    logVisit();
  }, [fetchData, logVisit]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search
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

    // Filter
    switch (activeFilter) {
      case 'hot-drinks':
        filtered = filtered.filter((p) => p.categoryId === 'cat1');
        break;
      case 'cold-drinks':
        filtered = filtered.filter((p) => p.categoryId === 'cat2');
        break;
      case 'desserts':
        filtered = filtered.filter((p) => p.categoryId === 'cat3');
        break;
      case 'breakfast':
        filtered = filtered.filter((p) => p.categoryId === 'cat4');
        break;
      case 'bakery':
        filtered = filtered.filter((p) => p.categoryId === 'cat5');
        break;
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

    return filtered;
  }, [searchQuery, activeFilter]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.categoryId]) groups[p.categoryId] = [];
      groups[p.categoryId].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const favoriteProducts = useMemo(
    () => products.filter((p) => favorites.includes(p.id)),
    [favorites]
  );

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

        {/* Products by Category */}
        <div className="px-4 max-w-2xl mx-auto space-y-6 py-4">
          {Object.entries(groupedByCategory).map(([catId, catProducts]) => {
            const category = categories.find((c) => c.id === catId);
            if (!category) return null;

            return (
              <section key={catId} id={`category-${catId}`}>
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
            );
          })}

          {/* Empty State */}
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

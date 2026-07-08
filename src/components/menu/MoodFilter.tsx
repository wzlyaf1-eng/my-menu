import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Target, Sparkles, Zap, Droplets, Candy,
  CloudSnow, Sun, Moon, Briefcase, BookOpen, Users, Heart, Lightbulb
} from 'lucide-react';
import { moods, moodReasons } from '@/data/demo';
import { useStore } from '@/stores/useStore';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ElementType> = {
  Target, Sparkles, Zap, Droplets, Candy,
  CloudSnow, Sun, Moon, Briefcase, BookOpen, Users, Heart, Lightbulb,
};

export function MoodFilter() {
  const {
    isMoodFilterOpen,
    setMoodFilterOpen,
    selectedMoods,
    toggleMood,
    clearMoods,
    products,
  } = useStore();

  // Get recommended products based on selected moods
  const recommendedProducts: (import('@/types').Product & { reason?: string })[] = selectedMoods.length > 0
    ? products
        .filter((p) => selectedMoods.some((moodId) => p.moods.includes(moodId)))
        .map((p) => {
          const reasons = selectedMoods
            .map((m) => moodReasons[m]?.[p.id])
            .filter(Boolean);
          return { ...p, reason: reasons[0] || '' };
        })
        .sort((a, b) => {
          const aMatches = selectedMoods.filter((m) => a.moods.includes(m)).length;
          const bMatches = selectedMoods.filter((m) => b.moods.includes(m)).length;
          return bMatches - aMatches;
        })
    : [];

  return (
    <AnimatePresence>
      {isMoodFilterOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setMoodFilterOpen(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto hide-scrollbar"
          >
            {/* Header */}
            <div className="p-5 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">كيف هو مزاجك اليوم؟</h2>
                    <p className="text-xs text-muted-foreground">
                      اختر مزاجك واحصل على توصيات ذكية
                    </p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMoodFilterOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Mood Selection */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {selectedMoods.length > 0
                    ? `تم اختيار ${selectedMoods.length} مزاج`
                    : 'اختر واحداً أو أكثر'}
                </span>
                {selectedMoods.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMoods}
                    className="text-xs h-7"
                  >
                    مسح الكل
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {moods.map((mood) => {
                  const Icon = iconMap[mood.icon] || Sparkles;
                  const isSelected = selectedMoods.includes(mood.id);
                  return (
                    <motion.button
                      key={mood.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleMood(mood.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground hover:border-primary/30'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {mood.name}
                    </motion.button>
                  );
                })}
              </div>

              {/* Recommendations */}
              {selectedMoods.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold">توصياتنا لك</h3>
                    <span className="text-sm text-muted-foreground">
                      ({recommendedProducts.length} منتج)
                    </span>
                  </div>

                  {recommendedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {recommendedProducts.slice(0, 8).map((product, index) => (
                        <div key={product.id}>
                          <ProductCard product={product} index={index} />
                          {product.reason && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-[11px] text-primary mt-1 px-1 leading-relaxed"
                            >
                              {product.reason}
                            </motion.p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>لا توجد منتجات متوافقة مع اختيارك حالياً</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

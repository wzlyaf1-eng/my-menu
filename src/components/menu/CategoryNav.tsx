import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Coffee, Snowflake, Cake, Sun, Croissant, Flame,
  Percent, LayoutGrid
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import type { FilterType } from '@/types';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Coffee, Snowflake, Cake, Sun, Croissant, Flame, Percent, LayoutGrid,
};

const filterItems: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'hot-drinks', label: 'ساخن' },
  { id: 'cold-drinks', label: 'بارد' },
  { id: 'desserts', label: 'حلويات' },
  { id: 'breakfast', label: 'إفطار' },
  { id: 'bakery', label: 'مخبوزات' },
  { id: 'bestsellers', label: 'الأكثر مبيعاً' },
  { id: 'new', label: 'جديد' },
  { id: 'offers', label: 'عروض' },
];

export function CategoryNav() {
  const { activeFilter, setActiveFilter } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[60px] z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar max-w-2xl mx-auto"
      >
        {filterItems.map((item, index) => {
          const isActive = activeFilter === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(item.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-premium'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function CategorySection() {
  const { categories } = useStore();
  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-4 gap-3">
        {categories.map((cat, index) => {
          const Icon = iconMap[cat.icon] || LayoutGrid;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-premium transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

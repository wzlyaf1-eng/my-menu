import { motion } from 'framer-motion';
import { Heart, Clock, Flame, Star, Sparkles, BadgePercent } from 'lucide-react';
import type { Product } from '@/types';
import { useStore } from '@/stores/useStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const { openProductModal, toggleFavorite, isFavorite } = useStore();
  const fav = isFavorite(product.id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ').format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openProductModal(product)}
      className="bg-card rounded-2xl overflow-hidden shadow-premium border border-border/50 cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.bestseller && (
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5">
              <Flame className="h-3 w-3 mr-0.5" />
              الأكثر مبيعاً
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5">
              <Sparkles className="h-3 w-3 mr-0.5" />
              جديد
            </Badge>
          )}
          {product.offerPrice !== undefined && (
            <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5">
              <BadgePercent className="h-3 w-3 mr-0.5" />
              عرض
            </Badge>
          )}
          {product.seasonal && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              موسمي
            </Badge>
          )}
        </div>

        {/* Favorite */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors',
            fav
              ? 'bg-rose-500 text-white'
              : 'bg-black/30 text-white hover:bg-black/50'
          )}
        >
          <Heart className={cn('h-4 w-4', fav && 'fill-current')} />
        </motion.button>

        {/* Price overlay */}
        {product.rating !== undefined && (
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
            <div className="flex items-center gap-1 text-white/90">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{product.rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-bold text-sm mb-1 text-foreground leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {product.offerPrice !== undefined ? (
              <>
                <span className="text-lg font-bold text-primary price-tag">
                  {formatPrice(product.offerPrice)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-primary price-tag">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">د.ع</span>
          </div>

          {product.preparationTime && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">{product.preparationTime}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

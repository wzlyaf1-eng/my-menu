import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, Clock, Flame, Plus, Minus, Star,
  AlertTriangle, Sparkles, Check
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { SelectedCustomization, SizeOption } from '@/types';

export function ProductModal() {
  const {
    isProductModalOpen,
    selectedProduct,
    closeProductModal,
    addToCart,
    toggleFavorite,
    isFavorite,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<SizeOption | undefined>();
  const [customizations, setCustomizations] = useState<SelectedCustomization[]>([]);
  const [notes, setNotes] = useState('');
  const [, setCurrentImageIndex] = useState(0);

  const product = selectedProduct;
  const fav = product ? isFavorite(product.id) : false;

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const basePrice = product.offerPrice || product.price;
    const sizePrice = selectedSize?.price || 0;
    const customPrice = customizations.reduce((sum, sc) => {
      const group = product.customizations?.find((cg) => cg.id === sc.groupId);
      return (
        sum +
        sc.optionIds.reduce((oSum, oid) => {
          const opt = group?.options.find((o) => o.id === oid);
          return oSum + (opt?.price || 0);
        }, 0)
      );
    }, 0);
    return (basePrice + sizePrice + customPrice) * quantity;
  }, [product, selectedSize, customizations, quantity]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ').format(price);
  };

  const handleClose = () => {
    closeProductModal();
    setQuantity(1);
    setSelectedSize(undefined);
    setCustomizations([]);
    setNotes('');
    setCurrentImageIndex(0);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const missingRequired = product.customizations?.find(
      (group) =>
        group.required &&
        !customizations.find((customization) => customization.groupId === group.id)?.optionIds.length
    );
    if (missingRequired) {
      toast.error(`يرجى اختيار ${missingRequired.name}`);
      return;
    }
    addToCart({
      product,
      quantity,
      selectedSize,
      selectedCustomizations: customizations,
      notes,
    });
    toast.success('تمت الإضافة إلى السلة', {
      description: `${product.name} × ${quantity}`,
    });
    handleClose();
  };

  const toggleCustomization = (groupId: string, optionId: string, multiSelect: boolean) => {
    setCustomizations((prev) => {
      const existing = prev.find((c) => c.groupId === groupId);
      if (!existing) {
        return [...prev, { groupId, optionIds: [optionId] }];
      }
      if (multiSelect) {
        const hasOption = existing.optionIds.includes(optionId);
        return prev.map((c) =>
          c.groupId === groupId
            ? {
                ...c,
                optionIds: hasOption
                  ? c.optionIds.filter((id) => id !== optionId)
                  : [...c.optionIds, optionId],
              }
            : c
        );
      }
      return prev.map((c) =>
        c.groupId === groupId ? { ...c, optionIds: [optionId] } : c
      );
    });
  };

  const isOptionSelected = (groupId: string, optionId: string) => {
    return customizations
      .find((c) => c.groupId === groupId)
      ?.optionIds.includes(optionId);
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isProductModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-background rounded-t-3xl max-h-[90vh] overflow-y-auto hide-scrollbar"
          >
            {/* Image Header */}
            <div className="relative aspect-video">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Top Actions */}
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFavorite(product.id)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md',
                    fav
                      ? 'bg-rose-500 text-white'
                      : 'bg-black/30 text-white'
                  )}
                >
                  <Heart className={cn('h-5 w-5', fav && 'fill-current')} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-md"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {product.bestseller && (
                    <Badge className="bg-amber-500 text-white">
                      <Flame className="h-3 w-3 mr-1" />
                      الأكثر مبيعاً
                    </Badge>
                  )}
                  {product.isNew && (
                    <Badge className="bg-emerald-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      جديد
                    </Badge>
                  )}
                  {product.seasonal && (
                    <Badge variant="secondary">موسمي</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{product.name}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Rating & Price */}
              <div className="flex items-center justify-between">
                {product.rating !== undefined && product.ratingCount !== undefined ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-lg">{product.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      ({product.ratingCount} تقييم)
                    </span>
                  </div>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-1.5">
                  {product.offerPrice ? (
                    <>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(product.offerPrice)}
                      </span>
                      <span className="text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">د.ع</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Details */}
              <div className="flex flex-wrap gap-3">
                {product.preparationTime && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <Clock className="h-4 w-4" />
                    {product.preparationTime}
                  </div>
                )}
                {product.calories && (
                  <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    {product.calories} سعرة
                  </div>
                )}
              </div>

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3">اختيار الحجم</h3>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-medium transition-all border-2',
                          selectedSize?.id === size.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        )}
                      >
                        {size.name}
                        {size.price > 0 && (
                          <span className="text-xs mr-1">(+{formatPrice(size.price)})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customizations */}
              {product.customizations?.map((group) => (
                <div key={group.id}>
                  <h3 className="font-bold mb-3">
                    {group.name}
                    {group.required && (
                      <span className="text-rose-500 text-sm mr-1">*</span>
                    )}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {group.options.map((option) => {
                      const selected = isOptionSelected(group.id, option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            toggleCustomization(group.id, option.id, group.multiSelect)
                          }
                          className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 flex items-center gap-1.5',
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-foreground hover:border-primary/50'
                          )}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                          {option.name}
                          {option.price > 0 && (
                            <span className="text-xs">(+{formatPrice(option.price)})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Allergens */}
              {product.allergens && product.allergens.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-sm">معلومات الحساسية:</span>
                    <span className="text-sm text-muted-foreground mr-1">
                      يحتوي على {product.allergens.join('، ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="font-bold mb-2">ملاحظات خاصة</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي طلبات خاصة..."
                  className="w-full p-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={2}
                  dir="rtl"
                />
              </div>

              <Separator />

              {/* Quantity & Add */}
              <div className="flex items-center gap-4 pb-4">
                {/* Quantity */}
                <div className="flex items-center gap-3 bg-muted rounded-2xl p-1">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-card shadow-sm flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </motion.button>
                  <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-sm flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Add Button */}
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 rounded-2xl text-base font-bold gap-2"
                >
                  إضافة للسلة
                  <span className="text-sm opacity-80">
                    ({formatPrice(totalPrice)} د.ع)
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

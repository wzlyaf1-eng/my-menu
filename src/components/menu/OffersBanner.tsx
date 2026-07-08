import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BadgePercent } from 'lucide-react';
import { useStore } from '@/stores/useStore';

export function OffersBanner() {
  const { products, openProductModal } = useStore();
  const [current, setCurrent] = useState(0);

  const offers = useMemo(() => products.filter((p) => p.offerPrice), [products]);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [offers.length]);

  if (offers.length === 0) return null;

  const offer = offers[current];
  const discount = Math.round(
    ((offer.price - (offer.offerPrice || 0)) / offer.price) * 100
  );

  const formatPrice = (price: number) => new Intl.NumberFormat('ar-IQ').format(price);

  return (
    <div className="px-4 py-3 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary-dark/90 text-white shadow-premium-lg cursor-pointer"
        onClick={() => openProductModal(offer)}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative flex items-center gap-4 p-4">
          {/* Image */}
          <img
            src={offer.image}
            alt={offer.name}
            className="w-20 h-20 rounded-xl object-cover shadow-lg"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BadgePercent className="h-4 w-4" />
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                خصم {discount}%
              </span>
            </div>
            <h3 className="font-bold text-base truncate">{offer.name}</h3>
            <p className="text-xs text-white/80 line-clamp-1 mb-2">{offer.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{formatPrice(offer.offerPrice || 0)} د.ع</span>
              <span className="text-sm line-through text-white/60">
                {formatPrice(offer.price)} د.ع
              </span>
            </div>
          </div>

          {/* Navigation Arrows */}
          {offers.length > 1 && (
            <div className="flex flex-col gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) => (prev - 1 + offers.length) % offers.length);
                }}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((prev) => (prev + 1) % offers.length);
                }}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dots */}
        {offers.length > 1 && (
          <div className="flex justify-center gap-1 pb-3">
            {offers.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? 'bg-white w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

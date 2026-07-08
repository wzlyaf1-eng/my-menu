import { motion } from 'framer-motion';
import { Home, Sparkles, ShoppingCart, Heart, Phone } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { id: 'menu', label: 'القائمة', icon: Home },
  { id: 'mood', label: 'مزاجي', icon: Sparkles },
  { id: 'cart', label: 'السلة', icon: ShoppingCart },
  { id: 'favorites', label: 'المفضلة', icon: Heart },
  { id: 'contact', label: 'اتصل بنا', icon: Phone },
];

export function BottomNav() {
  const { setMoodFilterOpen, setCartOpen, setActiveFilter, isMoodFilterOpen, isCartOpen, cartCount } = useStore();

  const handleClick = (id: string) => {
    switch (id) {
      case 'menu':
        setActiveFilter('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'mood':
        setMoodFilterOpen(!isMoodFilterOpen);
        break;
      case 'cart':
        setCartOpen(true);
        break;
      case 'favorites':
        setActiveFilter('favorites');
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'contact':
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
    }
  };

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
      className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border/60 bg-background/90 shadow-premium-lg backdrop-blur-xl supports-[padding:max(0px)]:bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 max-w-2xl mx-auto px-1.5 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === 'mood' && isMoodFilterOpen) ||
            (item.id === 'cart' && isCartOpen);

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleClick(item.id)}
              className={cn(
                'relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.id === 'cart' && cartCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  >
                    {cartCount()}
                  </motion.span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

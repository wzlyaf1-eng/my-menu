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
  const { setMoodFilterOpen, setCartOpen, isMoodFilterOpen, isCartOpen, cartCount } = useStore();

  const handleClick = (id: string) => {
    switch (id) {
      case 'menu':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'mood':
        setMoodFilterOpen(!isMoodFilterOpen);
        break;
      case 'cart':
        setCartOpen(true);
        break;
      case 'favorites':
        document.getElementById('favorites-section')?.scrollIntoView({ behavior: 'smooth' });
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
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe"
    >
      <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-2">
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
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative',
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

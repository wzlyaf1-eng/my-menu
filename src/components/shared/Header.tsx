import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Moon, Sun, Utensils } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  const { searchQuery, setSearchQuery, isDarkMode, toggleDarkMode, tableNumber } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 glass border-b border-border/50"
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2"
          whileTap={{ scale: 0.95 }}
        >
          <img
            src="/images/logo.jpg"
            alt="كنافة بلالي"
            className="w-10 h-10 rounded-xl object-cover shadow-md"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight text-foreground">
              كنافة بلالي
            </span>
            {tableNumber && (
              <span className="text-[11px] text-primary font-medium">
                طاولة {tableNumber}
              </span>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <AnimatePresence mode="wait">
            {isSearchOpen ? (
              <motion.div
                key="search-input"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center gap-1"
              >
                <Input
                  autoFocus
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 h-9 text-sm rtl"
                  dir="rtl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div key="actions" className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                {tableNumber && (
                  <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                    <Utensils className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">{tableNumber}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

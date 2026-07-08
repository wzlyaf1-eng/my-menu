import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Minus, Trash2, ShoppingBag, Send, Utensils, Truck, Receipt, Table, Phone, User, MapPin, ChevronDown
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function Cart() {
  const {
    isCartOpen, setCartOpen, cart,
    updateQuantity, cartTotal, clearCart, tableNumber, removeFromCart,
    orderType, setOrderType, lastOrder, setLastOrder,
    submitOrder, storeSettings, products,
  } = useStore();

  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // Order type selection is part of checkout flow

  const formatPrice = (price: number) => new Intl.NumberFormat('ar-IQ').format(price);

  const resolveCartItems = () =>
    cart
      .map((item) => {
        const currentProduct = products.find((product) => product.id === item.product.id);
        if (!currentProduct || currentProduct.available === false) return null;
        return { ...item, product: currentProduct };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

  const itemTotal = (item: (typeof cart)[number]) => {
    const basePrice = item.product.offerPrice ?? item.product.price;
    const sizePrice = item.selectedSize?.price || 0;
    const customPrice = item.selectedCustomizations.reduce((sum, selected) => {
      const group = item.product.customizations?.find((customization) => customization.id === selected.groupId);
      return (
        sum +
        selected.optionIds.reduce((optionSum, optionId) => {
          const option = group?.options.find((candidate) => candidate.id === optionId);
          return optionSum + (option?.price || 0);
        }, 0)
      );
    }, 0);
    return (basePrice + sizePrice + customPrice) * item.quantity;
  };

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    if (!storeSettings.isOpen) {
      toast.error('المتجر مغلق حالياً ولا يمكن إرسال الطلب');
      return;
    }
    if (!storeSettings.whatsapp.trim()) {
      toast.error('رقم واتساب غير مضاف في إعدادات المتجر');
      return;
    }

    const type = orderType || 'dine-in';
    if (type === 'delivery' && (!customerName.trim() || !phone.trim() || !address.trim())) {
      toast.error('يرجى إدخال الاسم ورقم الهاتف والعنوان للتوصيل');
      return;
    }

    const resolvedItems = resolveCartItems();
    if (resolvedItems.length !== cart.length) {
      cart.forEach((item) => {
        const currentProduct = products.find((product) => product.id === item.product.id);
        if (!currentProduct || currentProduct.available === false) {
          removeFromCart(item.product.id);
        }
      });
      toast.error('تم تحديث السلة. بعض المنتجات لم تعد متاحة.');
      return;
    }

    const resolvedTotal = resolvedItems.reduce((sum, item) => sum + itemTotal(item), 0);
    let message = `*طلب جديد من ${storeSettings.name}*\n\n`;

    message += `*نوع الطلب:* ${type === 'dine-in' ? 'طلب داخل الصالة' : 'طلب دلفري'}\n`;

    if (type === 'dine-in' && tableNumber) {
      message += `*رقم الطاولة:* ${tableNumber}\n`;
    }

    if (type === 'delivery') {
      message += `*العميل:* ${customerName || 'غير محدد'}\n`;
      message += `*الهاتف:* ${phone || 'غير محدد'}\n`;
      message += `*العنوان:* ${address || 'غير محدد'}\n`;
    }

    message += `\n*المنتجات:*\n`;
    message += `─────────────────\n`;

    resolvedItems.forEach((item, i) => {
      message += `${i + 1}. *${item.product.name}*\n`;
      message += `   الكمية: ${item.quantity}\n`;
      if (item.selectedSize) {
        message += `   الحجم: ${item.selectedSize.name}\n`;
      }
      if (item.selectedCustomizations.length > 0) {
        message += `   الإضافات: ${item.selectedCustomizations.map((sc) => {
          const group = item.product.customizations?.find((cg) => cg.id === sc.groupId);
          const opts = sc.optionIds.map((oid) => {
            const opt = group?.options.find((o) => o.id === oid);
            return opt?.name;
          }).filter(Boolean).join(', ');
          return opts;
        }).filter(Boolean).join(' | ')}\n`;
      }
      if (item.notes) {
        message += `   ملاحظات: ${item.notes}\n`;
      }
      message += `   السعر: ${formatPrice(itemTotal(item))} د.ع\n\n`;
    });

    message += `─────────────────\n`;
    message += `*الإجمالي:* ${formatPrice(resolvedTotal)} د.ع\n`;
    message += `\nشكراً لاختياركم ${storeSettings.name}! ☕`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${storeSettings.whatsapp}?text=${encodedMessage}`;

    // Submit order to database
    submitOrder(tableNumber, type, resolvedItems, resolvedTotal).catch((err) => {
      console.error('Failed to save order to database:', err);
    });

    setLastOrder([...resolvedItems]);
    window.open(whatsappUrl, '_blank');
    toast.success('تم فتح واتساب لإرسال الطلب');
    clearCart();
    setShowCheckout(false);
    setCartOpen(false);
  };

  const handleRepeatLastOrder = () => {
    if (lastOrder) {
      lastOrder.forEach((item) => {
        useStore.getState().addToCart(item);
      });
      toast.success('تمت إعادة آخر طلب');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { setCartOpen(false); setShowCheckout(false); }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-background rounded-t-3xl max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-lg">سلة المشتريات</h2>
                <span className="bg-primary/10 text-primary text-sm font-bold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setCartOpen(false); setShowCheckout(false); }}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Content */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium mb-4">السلة فارغة</p>
                {lastOrder && lastOrder.length > 0 && (
                  <Button variant="outline" onClick={handleRepeatLastOrder} className="gap-2">
                    <Receipt className="h-4 w-4" />
                    إعادة آخر طلب
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 bg-card rounded-2xl p-3 border border-border/50"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.product.name}</h4>
                          {item.selectedSize && (
                            <p className="text-xs text-muted-foreground">
                              الحجم: {item.selectedSize.name}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2 bg-muted rounded-xl p-0.5">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shadow-sm"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="h-3 w-3 text-rose-500" />
                                ) : (
                                  <Minus className="h-3 w-3" />
                                )}
                              </button>
                              <span className="text-sm font-bold w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="font-bold text-primary text-sm price-tag">
                              {formatPrice(itemTotal(item))} د.ع
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-border/50 p-4 space-y-3 bg-card rounded-t-2xl">
                  {!showCheckout ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">الإجمالي</span>
                        <span className="text-xl font-bold text-primary price-tag">
                          {formatPrice(cartTotal())} د.ع
                        </span>
                      </div>
                      <Button
                        onClick={() => setShowCheckout(true)}
                        disabled={!storeSettings.isOpen}
                        className="w-full h-12 rounded-2xl text-base font-bold gap-2"
                      >
                        {storeSettings.isOpen ? 'متابعة الطلب' : 'المتجر مغلق حالياً'}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Order Type Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">نوع الطلب</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setOrderType('dine-in')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              orderType === 'dine-in'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card'
                            }`}
                          >
                            <Utensils className="h-4 w-4" />
                            <span className="text-sm font-medium">داخل الصالة</span>
                          </button>
                          <button
                            onClick={() => setOrderType('delivery')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                              orderType === 'delivery'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card'
                            }`}
                          >
                            <Truck className="h-4 w-4" />
                            <span className="text-sm font-medium">دلفري</span>
                          </button>
                        </div>
                      </div>

                      {orderType === 'delivery' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="اسم العميل"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              dir="rtl"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <input
                              type="tel"
                              placeholder="رقم الهاتف"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              dir="rtl"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="العنوان"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="flex-1 p-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      )}

                      {orderType === 'dine-in' && tableNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-xl">
                          <Table className="h-4 w-4" />
                          <span>طاولة رقم {tableNumber}</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <span className="font-medium">الإجمالي النهائي</span>
                        <span className="text-xl font-bold text-primary price-tag">
                          {formatPrice(cartTotal())} د.ع
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCheckout(false)}
                          className="flex-1 h-11 rounded-xl"
                        >
                          رجوع
                        </Button>
                        <Button
                          onClick={handleWhatsAppOrder}
                          disabled={!storeSettings.isOpen}
                          className="flex-[2] h-11 rounded-xl font-bold gap-2"
                        >
                          <Send className="h-4 w-4" />
                          إرسال عبر واتساب
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

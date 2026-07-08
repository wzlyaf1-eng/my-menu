import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Coffee, Grid3X3, Tag, Settings,
  BarChart3, QrCode, LogOut, Plus, Edit2,
  Trash2, TrendingUp, DollarSign, Users, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Moon, Sun
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { moods as demoMoods } from '@/data/demo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUploadInput } from '@/components/shared/ImageUploadInput';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'offers' | 'analytics' | 'qr' | 'settings';

const menuItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'products', label: 'المنتجات', icon: Coffee },
  { id: 'categories', label: 'الفئات', icon: Grid3X3 },
  { id: 'offers', label: 'العروض', icon: Tag },
  { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

const salesData = [
  { name: 'السبت', sales: 45000 },
  { name: 'الأحد', sales: 52000 },
  { name: 'الإثنين', sales: 38000 },
  { name: 'الثلاثاء', sales: 61000 },
  { name: 'الأربعاء', sales: 55000 },
  { name: 'الخميس', sales: 72000 },
  { name: 'الجمعة', sales: 85000 },
];

const categoryData = [
  { name: 'مشروبات ساخنة', value: 35 },
  { name: 'مشروبات باردة', value: 25 },
  { name: 'حلويات', value: 20 },
  { name: 'كنافة', value: 15 },
  { name: 'مخبوزات', value: 5 },
];

const COLORS = ['#D48234', '#E8A853', '#8B6914', '#C4956A', '#A67B5B'];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const { toggleDarkMode, isDarkMode, products, categories, fetchData } = useStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [visitsCount, setVisitsCount] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured) return;

    async function loadAdminStats() {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        const { count, error: visitsError } = await supabase
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'visit');
        if (visitsError) throw visitsError;
        setVisitsCount(count || 0);
      } catch (err) {
        console.error('Error loading admin stats:', err);
      }
    }

    loadAdminStats();
  }, [isAuthenticated]);

  const dynamicSalesData = useMemo(() => {
    if (!isSupabaseConfigured || orders.length === 0) {
      return salesData;
    }
    const daysOfWeek = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const dailySalesMap: Record<string, number> = {};
    daysOfWeek.forEach(d => { dailySalesMap[d] = 0; });

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const dayIndex = date.getDay();
      const mapping = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayName = mapping[dayIndex];
      dailySalesMap[dayName] = (dailySalesMap[dayName] || 0) + Number(order.total_price || 0);
    });

    return daysOfWeek.map(d => ({
      name: d,
      sales: dailySalesMap[d]
    }));
  }, [orders]);

  const dynamicCategoryData = useMemo(() => {
    if (!isSupabaseConfigured || orders.length === 0) {
      return categoryData;
    }
    const catMap: Record<string, number> = {};
    orders.forEach(order => {
      const items = order.items || [];
      items.forEach((item: import('@/types').CartItem) => {
        const catName = categories.find(c => c.id === item.product?.categoryId)?.name || 'أخرى';
        catMap[catName] = (catMap[catName] || 0) + (item.quantity || 1);
      });
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value
    }));
  }, [orders, categories]);

  const computedTotalSales = useMemo(() => {
    if (!isSupabaseConfigured) return '٤٠٥,٠٠٠';
    const sum = orders.reduce((acc, order) => acc + Number(order.total_price || 0), 0);
    return new Intl.NumberFormat('ar-IQ').format(sum);
  }, [orders]);

  const computedOrdersToday = useMemo(() => {
    if (!isSupabaseConfigured) return '٤٨';
    const today = new Date().toDateString();
    const count = orders.filter(order => new Date(order.created_at).toDateString() === today).length;
    return new Intl.NumberFormat('ar-IQ').format(count);
  }, [orders]);

  const computedVisits = useMemo(() => {
    if (!isSupabaseConfigured) return '١,٢٣٤';
    return new Intl.NumberFormat('ar-IQ').format(visitsCount);
  }, [visitsCount]);

  const handleLogin = () => {
    if (password === 'admin') {
      setIsAuthenticated(true);
      toast.success('تم تسجيل الدخول بنجاح');
    } else {
      toast.error('كلمة المرور غير صحيحة');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-950 dark:to-stone-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-card rounded-3xl shadow-premium-lg p-8 border border-border/50"
        >
          <div className="text-center mb-6">
            <img
              src="/images/logo.jpg"
              alt="كنافة بلالي"
              className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover shadow-premium"
            />
            <h1 className="text-xl font-bold">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
          </div>

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="h-12 rounded-xl text-center text-lg tracking-widest"
              dir="rtl"
            />
            <Button onClick={handleLogin} className="w-full h-12 rounded-xl font-bold">
              تسجيل الدخول
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              كلمة المرور الافتراضية: admin
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/images/logo.jpg" alt="" className="w-9 h-9 rounded-xl object-cover" />
            <h1 className="font-bold">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAuthenticated(false)}
              className="gap-1"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 sticky top-[60px] h-[calc(100vh-60px)] border-l border-border/50 p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Tabs */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 p-2 overflow-x-auto hide-scrollbar">
          <div className="flex gap-1 min-w-max px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardTab
                key="dashboard"
                salesData={dynamicSalesData}
                categoryData={dynamicCategoryData}
                totalSales={computedTotalSales}
                ordersToday={computedOrdersToday}
                visits={computedVisits}
                productsCount={products.length}
              />
            )}
            {activeTab === 'products' && (
              <ProductsTab key="products" />
            )}
            {activeTab === 'categories' && (
              <CategoriesTab key="categories" />
            )}
            {activeTab === 'offers' && (
              <OffersTab key="offers" />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsTab key="analytics" salesData={dynamicSalesData} />
            )}
            {activeTab === 'qr' && (
              <QRTab key="qr" />
            )}
            {activeTab === 'settings' && (
              <SettingsTab key="settings" />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// Dashboard Tab
interface DashboardTabProps {
  salesData: { name: string; sales: number }[];
  categoryData: { name: string; value: number }[];
  totalSales: string;
  ordersToday: string;
  visits: string;
  productsCount: number;
}

function DashboardTab({
  salesData,
  categoryData,
  totalSales,
  ordersToday,
  visits,
  productsCount,
}: DashboardTabProps) {
  const stats = [
    { label: 'إجمالي المبيعات', value: totalSales, change: '+١٢٪', up: true, icon: DollarSign },
    { label: 'الطلبات اليوم', value: ordersToday, change: '+٨٪', up: true, icon: ShoppingBag },
    { label: 'الزيارات', value: visits, change: '+٢٣٪', up: true, icon: Users },
    { label: 'المنتجات', value: String(productsCount), change: '+٢', up: true, icon: Coffee },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold">نظرة عامة</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-premium"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  stat.up ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-premium">
          <h3 className="font-bold mb-4">المبيعات الأسبوعية</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-premium">
          <h3 className="font-bold mb-4">توزيع المبيعات حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Products Tab
function ProductsTab() {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number | undefined>(undefined);
  const [image, setImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [available, setAvailable] = useState(true);
  const [seasonal, setSeasonal] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [limited, setLimited] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [calories, setCalories] = useState<number | undefined>(undefined);
  const [preparationTime, setPreparationTime] = useState('');

  const openAddDialog = () => {
    setDialogMode('add');
    setSelectedProduct(null);
    setName('');
    setDescription('');
    setPrice(0);
    setOfferPrice(undefined);
    setImage('');
    setCategoryId(categories[0]?.id || '');
    setAvailable(true);
    setSeasonal(false);
    setBestseller(false);
    setIsNew(true);
    setLimited(false);
    setSelectedMoods([]);
    setCalories(undefined);
    setPreparationTime('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setDialogMode('edit');
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setOfferPrice(product.offerPrice || undefined);
    setImage(product.image || '');
    setCategoryId(product.categoryId || categories[0]?.id || '');
    setAvailable(product.available !== false);
    setSeasonal(!!product.seasonal);
    setBestseller(!!product.bestseller);
    setIsNew(!!product.isNew);
    setLimited(!!product.limited);
    setSelectedMoods(product.moods || []);
    setCalories(product.calories || undefined);
    setPreparationTime(product.preparationTime || '');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }
    if (price <= 0) {
      toast.error('يرجى إدخال سعر صالح');
      return;
    }
    if (!categoryId) {
      toast.error('يرجى تحديد الفئة');
      return;
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      image: image.trim() || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300',
      categoryId,
      available,
      seasonal,
      bestseller,
      isNew,
      limited,
      moods: selectedMoods,
      calories: calories ? Number(calories) : undefined,
      preparationTime: preparationTime.trim()
    };

    try {
      if (dialogMode === 'add') {
        await addProduct(productData);
        toast.success('تمت إضافة المنتج بنجاح');
      } else {
        await updateProduct(selectedProduct.id, productData);
        toast.success('تم تحديث المنتج بنجاح');
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      toast.success('تم حذف المنتج بنجاح');
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حذف المنتج');
    }
  };

  const toggleMoodSelection = (moodId: string) => {
    setSelectedMoods(prev =>
      prev.includes(moodId) ? prev.filter(id => id !== moodId) : [...prev, moodId]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">المنتجات ({products.length})</h2>
        <Button size="sm" onClick={openAddDialog} className="gap-1 rounded-xl">
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-right px-4 py-3 font-medium">المنتج</th>
                <th className="text-right px-4 py-3 font-medium">الفئة</th>
                <th className="text-right px-4 py-3 font-medium">السعر</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="text-right px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-right">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px] text-right">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {categories.find((c) => c.id === product.categoryId)?.name || 'غير محدد'}
                  </td>
                  <td className="px-4 py-3 font-medium text-right">
                    {product.offerPrice ? (
                      <div>
                        <span className="text-primary">{product.offerPrice.toLocaleString()}</span>
                        <span className="text-muted-foreground line-through text-xs mr-2">
                          {product.price.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      product.price.toLocaleString()
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      variant={product.available ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {product.available ? 'متاح' : 'غير متاح'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(product)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => openDeleteDialog(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {dialogMode === 'add' ? 'إضافة منتج جديد' : 'تعديل المنتج'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prod-name">اسم المنتج *</Label>
                <Input id="prod-name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: كنافة نابلسية" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-category">الفئة *</Label>
                <select
                  id="prod-category"
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="prod-desc">الوصف</Label>
              <Textarea id="prod-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="تفاصيل المنتج والمكونات..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prod-price">السعر الأساسي (د.ع) *</Label>
                <Input id="prod-price" type="number" value={price || ''} onChange={e => setPrice(Number(e.target.value))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-offer">سعر العرض (د.ع - اختياري)</Label>
                <Input id="prod-offer" type="number" value={offerPrice || ''} onChange={e => setOfferPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="اتركه فارغاً في حال عدم وجود عرض" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="prod-image">الصورة (رفع ملف أو رابط)</Label>
                <ImageUploadInput id="prod-image" value={image} onChange={setImage} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-time">وقت التحضير (مثال: ١٠ دقائق)</Label>
                <Input id="prod-time" value={preparationTime} onChange={e => setPreparationTime(e.target.value)} placeholder="١٠-١٥ دقيقة" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prod-calories">السعرات الحرارية</Label>
                <Input id="prod-calories" type="number" value={calories || ''} onChange={e => setCalories(e.target.value ? Number(e.target.value) : undefined)} placeholder="٣٥٠" />
              </div>
            </div>

            {/* Switch Toggles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="prod-available" className="cursor-pointer">متاح للطلب</Label>
                <Switch id="prod-available" checked={available} onCheckedChange={setAvailable} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="prod-bestseller" className="cursor-pointer">الأكثر مبيعاً</Label>
                <Switch id="prod-bestseller" checked={bestseller} onCheckedChange={setBestseller} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="prod-new" className="cursor-pointer">جديد</Label>
                <Switch id="prod-new" checked={isNew} onCheckedChange={setIsNew} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="prod-seasonal" className="cursor-pointer">موسمي</Label>
                <Switch id="prod-seasonal" checked={seasonal} onCheckedChange={setSeasonal} />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label htmlFor="prod-limited" className="cursor-pointer">كمية محدودة</Label>
                <Switch id="prod-limited" checked={limited} onCheckedChange={setLimited} />
              </div>
            </div>

            {/* Mood Selector */}
            <div className="space-y-2">
              <Label>تحديد مزاج الزبائن المتوافق مع المنتج</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[150px] overflow-y-auto p-2 border border-border/50 rounded-xl bg-card">
                {demoMoods.map(mood => {
                  const isSelected = selectedMoods.includes(mood.id);
                  return (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => toggleMoodSelection(mood.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span>{mood.name}</span>
                      <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      }`}>
                        {isSelected && <span className="text-[8px] text-white">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              <Button type="submit">حفظ التغييرات</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تأكيد حذف المنتج</DialogTitle>
          </DialogHeader>
          <div className="text-right space-y-3 py-3">
            <p className="text-sm">هل أنت متأكد من رغبتك في حذف المنتج <span className="font-bold text-rose-500">"{selectedProduct?.name}"</span>؟</p>
            <p className="text-xs text-muted-foreground">لا يمكن التراجع عن هذا الإجراء وسيتم حذفه فوراً من المتجر وقاعدة البيانات.</p>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Categories Tab
function CategoriesTab() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [icon, setIcon] = useState('Coffee');
  const [sortOrder, setSortOrder] = useState<number>(0);

  const openAddDialog = () => {
    setDialogMode('add');
    setSelectedCategory(null);
    setName('');
    setNameEn('');
    setIcon('Coffee');
    setSortOrder(categories.length);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: any) => {
    setDialogMode('edit');
    setSelectedCategory(category);
    setName(category.name);
    setNameEn(category.nameEn || '');
    setIcon(category.icon || 'Coffee');
    setSortOrder(category.sortOrder || 0);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم الفئة بالعربية');
      return;
    }
    if (!nameEn.trim()) {
      toast.error('يرجى إدخال اسم الفئة بالإنجليزية');
      return;
    }

    const catData = {
      name: name.trim(),
      nameEn: nameEn.trim(),
      icon,
      sortOrder: Number(sortOrder)
    };

    try {
      if (dialogMode === 'add') {
        await addCategory(catData);
        toast.success('تمت إضافة الفئة بنجاح');
      } else {
        await updateCategory(selectedCategory.id, catData);
        toast.success('تم تحديث الفئة بنجاح');
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الفئة');
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory(selectedCategory.id);
      toast.success('تم حذف الفئة بنجاح');
      setIsDeleteOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حذف الفئة');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">الفئات ({categories.length})</h2>
        <Button size="sm" onClick={openAddDialog} className="gap-1 rounded-xl">
          <Plus className="h-4 w-4" />
          إضافة فئة
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, i) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-premium flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-right">{cat.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(cat)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => openDeleteDialog(cat)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-right mb-2">{cat.nameEn}</p>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-2xl font-black text-primary text-right">{count}</p>
                  <p className="text-[10px] text-muted-foreground text-right">منتج</p>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">ترتيب: {cat.sortOrder}</Badge>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Category Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {dialogMode === 'add' ? 'إضافة فئة جديدة' : 'تعديل الفئة'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 text-right">
            <div className="space-y-1">
              <Label htmlFor="cat-name">اسم الفئة (بالعربية) *</Label>
              <Input id="cat-name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مشروبات ساخنة" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-name-en">اسم الفئة (بالإنجليزية) *</Label>
              <Input id="cat-name-en" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="مثال: Hot Drinks" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cat-icon">الأيقونة</Label>
                <select
                  id="cat-icon"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                >
                  <option value="Coffee">قهوة / مشروب ساخن (Coffee)</option>
                  <option value="Grid3X3">شبكة (Grid)</option>
                  <option value="Tag">بطاقة عروض (Tag)</option>
                  <option value="IceCream">آيس كريم (IceCream)</option>
                  <option value="Cake">حلويات (Cake)</option>
                  <option value="Utensils">وجبات (Utensils)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-order">ترتيب الظهور</Label>
                <Input id="cat-order" type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
              </div>
            </div>

            <DialogFooter className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              <Button type="submit">حفظ الفئة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تأكيد حذف الفئة</DialogTitle>
          </DialogHeader>
          <div className="text-right space-y-3 py-3">
            <p className="text-sm">هل أنت متأكد من رغبتك في حذف الفئة <span className="font-bold text-rose-500">"{selectedCategory?.name}"</span>؟</p>
            <p className="text-xs text-muted-foreground text-rose-400">تنبيه: سيؤدي حذف الفئة إلى جعل جميع المنتجات المرتبطة بها تظهر كـ "غير مصنفة" أو قد تختفي من تصفية المجموعات.</p>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف نهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// Offers Tab
function OffersTab() {
  const { products } = useStore();
  const offers = products.filter((p) => p.offerPrice);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">العروض ({offers.length})</h2>
        <Button size="sm" className="gap-1 rounded-xl">
          <Plus className="h-4 w-4" />
          إضافة عرض
        </Button>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const discount = Math.round(((offer.price - (offer.offerPrice || 0)) / offer.price) * 100);
          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-premium flex items-center gap-4"
            >
              <img
                src={offer.image}
                alt={offer.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold">{offer.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-rose-500 text-white text-xs">خصم {discount}%</Badge>
                  <span className="text-primary font-bold">{offer.offerPrice?.toLocaleString()} د.ع</span>
                  <span className="text-muted-foreground line-through text-xs">
                    {offer.price.toLocaleString()} د.ع
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Analytics Tab
interface AnalyticsTabProps {
  salesData: { name: string; sales: number }[];
}

function AnalyticsTab({ salesData }: AnalyticsTabProps) {
  const { products } = useStore();
  const topProducts = [...products]
    .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold">التحليلات</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-premium">
          <h3 className="font-bold mb-4">اتجاه المبيعات</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-premium">
          <h3 className="font-bold mb-4">المنتجات الأكثر طلباً</h3>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.id} className="flex items-center gap-3">
                <span className="text-lg font-black text-muted-foreground w-6">
                  {i + 1}
                </span>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.ratingCount} طلب
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// QR Tab
function QRTab() {
  const [selectedTable, setSelectedTable] = useState(1);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const generateQR = async () => {
    try {
      const QRCode = await import('qrcode');
      const url = `${window.location.origin}?table=${selectedTable}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#D48234',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(dataUrl);
      toast.success(`تم توليد QR Code للطاولة ${selectedTable}`);
    } catch {
      toast.error('حدث خطأ أثناء توليد QR Code');
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `kunafa-bilali-table-${selectedTable}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('تم تحميل QR Code');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-md mx-auto"
    >
      <h2 className="text-xl font-bold text-center">مولد QR Code</h2>

      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-premium space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">رقم الطاولة</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTable(Math.max(1, selectedTable - 1))}
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-bold text-lg"
            >
              -
            </button>
            <div className="flex-1 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-black text-primary">{selectedTable}</span>
            </div>
            <button
              onClick={() => setSelectedTable(selectedTable + 1)}
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-bold text-lg"
            >
              +
            </button>
          </div>
        </div>

        <Button onClick={generateQR} className="w-full h-12 rounded-xl font-bold gap-2">
          <QrCode className="h-5 w-5" />
          توليد QR Code
        </Button>

        {qrDataUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3"
          >
            <div className="bg-white p-4 rounded-2xl inline-block">
              <img
                src={qrDataUrl}
                alt={`QR Code for table ${selectedTable}`}
                className="w-64 h-64"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              الطاولة {selectedTable} - امسح للوصول للقائمة
            </p>
            <div className="flex gap-2">
              <Button onClick={downloadQR} variant="outline" className="flex-1 rounded-xl">
                تحميل PNG
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Settings Tab
function SettingsTab() {
  const { storeSettings, updateStoreSettings } = useStore();
  const [settings, setSettings] = useState(storeSettings);
  const [prevStoreSettings, setPrevStoreSettings] = useState(storeSettings);

  if (storeSettings !== prevStoreSettings) {
    setPrevStoreSettings(storeSettings);
    setSettings(storeSettings);
  }

  const handleSave = async () => {
    try {
      await updateStoreSettings(settings);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-lg"
    >
      <h2 className="text-xl font-bold">إعدادات المتجر</h2>

      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-premium space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">اسم المتجر</label>
          <Input
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="rounded-xl"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">رقم الهاتف</label>
          <Input
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="rounded-xl ltr"
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">واتساب</label>
          <Input
            value={settings.whatsapp}
            onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
            className="rounded-xl ltr"
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">العنوان</label>
          <Input
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="rounded-xl"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">ساعات العمل</label>
          <Input
            value={settings.workingHours}
            onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
            className="rounded-xl"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">العملة</label>
          <select
            value={settings.currency}
            onChange={(e) =>
              setSettings({ ...settings, currency: e.target.value as 'IQD' | 'USD' | 'SAR' })
            }
            className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm"
          >
            <option value="IQD">دينار عراقي (IQD)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="SAR">ريال سعودي (SAR)</option>
          </select>
        </div>

        <Separator />

        <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold">
          حفظ الإعدادات
        </Button>
      </div>
    </motion.div>
  );
}

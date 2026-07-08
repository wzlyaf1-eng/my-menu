import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';
import { MenuPage } from '@/pages/MenuPage';
import { AdminPage } from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function App() {
  const { setTableNumber, isDarkMode } = useStore();

  useEffect(() => {
    // Detect table from URL
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) {
      const tableNum = parseInt(table, 10);
      if (!isNaN(tableNum) && tableNum > 0) {
        setTableNumber(tableNum);
        toast.success(`تم تحديد الطاولة رقم ${tableNum}`, {
          description: 'يمكنك البدء بطلبك الآن',
        });
      }
    }
  }, [setTableNumber]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Tajawal', sans-serif",
            direction: 'rtl',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;

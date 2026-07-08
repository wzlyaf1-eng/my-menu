import { motion } from 'framer-motion';
import {
  Phone, Instagram, Facebook, Clock, Share2, MessageCircle
} from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ContactSection() {
  const { storeSettings } = useStore();
  const logo = storeSettings.logo || '/images/logo.jpg';
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: storeSettings.name,
          text: `قائمة ${storeSettings.name} - استمتع بأشهى المنتجات!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ رابط القائمة');
      }
    } catch {
      // User cancelled
    }
  };

  return (
    <section id="contact-section" className="px-4 py-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl border border-border/50 p-5 space-y-4"
      >
        <div className="text-center mb-4">
          <img
            src={logo}
            alt={storeSettings.name}
            className="w-16 h-16 rounded-2xl mx-auto mb-3 object-cover shadow-premium"
          />
          <h3 className="font-bold text-lg">{storeSettings.name}</h3>
          <p className="text-sm text-muted-foreground">{storeSettings.address}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-medium">ساعات العمل</span>
              <p className="text-muted-foreground text-xs">{storeSettings.workingHours}</p>
            </div>
          </div>

          {storeSettings.phone && (
            <a
              href={`tel:${storeSettings.phone}`}
              className="flex items-center gap-3 text-sm hover:bg-muted/50 p-2 rounded-xl transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-medium">اتصل بنا</span>
                <p className="text-muted-foreground text-xs ltr">{storeSettings.phone}</p>
              </div>
            </a>
          )}

          {storeSettings.whatsapp && (
            <a
              href={`https://wa.me/${storeSettings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:bg-muted/50 p-2 rounded-xl transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <span className="font-medium">واتساب</span>
                <p className="text-muted-foreground text-xs ltr">{storeSettings.whatsapp}</p>
              </div>
            </a>
          )}

          {storeSettings.instagram && (
            <a
              href={`https://instagram.com/${storeSettings.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:bg-muted/50 p-2 rounded-xl transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                <Instagram className="h-4 w-4 text-pink-500" />
              </div>
              <div>
                <span className="font-medium">انستغرام</span>
                <p className="text-muted-foreground text-xs">@{storeSettings.instagram}</p>
              </div>
            </a>
          )}

          {storeSettings.facebook && (
            <a
              href={`https://facebook.com/${storeSettings.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm hover:bg-muted/50 p-2 rounded-xl transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Facebook className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <span className="font-medium">فيسبوك</span>
                <p className="text-muted-foreground text-xs">{storeSettings.facebook}</p>
              </div>
            </a>
          )}
        </div>

        <Button
          variant="outline"
          onClick={handleShare}
          className="w-full gap-2 mt-2 rounded-xl"
        >
          <Share2 className="h-4 w-4" />
          مشاركة القائمة
        </Button>
      </motion.div>
    </section>
  );
}

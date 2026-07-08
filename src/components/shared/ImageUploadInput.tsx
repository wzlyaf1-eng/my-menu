import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/uploadImage';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ImageUploadInputProps {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  folder?: string;
}

// URL input with an upload button: pick a file, it goes to Supabase Storage
// and the resulting public URL fills the field.
export function ImageUploadInput({ id, value, onChange, placeholder, folder }: ImageUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من ٥ ميغابايت');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('فشل رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'https://example.com/image.jpg'}
        className="flex-1"
      />
      {isSupabaseConfigured && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="رفع صورة"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </Button>
        </>
      )}
    </div>
  );
}

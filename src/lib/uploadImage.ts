import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET = 'product-images';

// Uploads a file to Supabase Storage and returns its public URL.
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type || undefined,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

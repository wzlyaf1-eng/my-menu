// Seeds the Supabase database with the menu data from src/data/demo.ts.
// Run: node scripts/run-seed.mjs  (bundles this file and executes it with .env loaded)
import { createClient } from '@supabase/supabase-js';
import { categories, products, storeSettings } from '../src/data/demo';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { error: catError } = await supabase.from('categories').upsert(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      name_en: c.nameEn,
      icon: c.icon,
      sort_order: c.sortOrder,
    }))
  );
  if (catError) throw catError;
  console.log(`Seeded ${categories.length} categories`);

  const { error: prodError } = await supabase.from('products').upsert(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      offer_price: p.offerPrice ?? null,
      image: p.image,
      category_id: p.categoryId,
      subcategory_id: p.subcategoryId ?? null,
      ingredients: p.ingredients ?? [],
      preparation_time: p.preparationTime ?? '',
      calories: p.calories ?? null,
      allergens: p.allergens ?? [],
      available: p.available,
      seasonal: p.seasonal,
      bestseller: p.bestseller,
      is_new: p.isNew,
      limited: p.limited,
      moods: p.moods ?? [],
      rating: p.rating ?? null,
      rating_count: p.ratingCount ?? null,
      sizes: p.sizes ?? [],
      customizations: p.customizations ?? [],
    }))
  );
  if (prodError) throw prodError;
  console.log(`Seeded ${products.length} products`);

  const { data: existing, error: selError } = await supabase
    .from('store_settings')
    .select('id')
    .maybeSingle();
  if (selError) throw selError;

  const dbSettings = {
    name: storeSettings.name,
    logo: storeSettings.logo,
    phone: storeSettings.phone,
    whatsapp: storeSettings.whatsapp,
    address: storeSettings.address,
    instagram: storeSettings.instagram ?? null,
    facebook: storeSettings.facebook ?? null,
    working_hours: storeSettings.workingHours,
    currency: storeSettings.currency,
    tax_rate: storeSettings.taxRate,
    is_open: storeSettings.isOpen,
  };
  const { error: setError } = existing?.id
    ? await supabase.from('store_settings').update(dbSettings).eq('id', existing.id)
    : await supabase.from('store_settings').insert(dbSettings);
  if (setError) throw setError;
  console.log('Seeded store settings');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

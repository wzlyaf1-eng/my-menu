-- The app's admin screen is protected by a simple client-side password
-- (VITE_ADMIN_PASSWORD), not Supabase Auth. These policies keep the public
-- menu readable and allow the browser app to manage menu data with the anon key.

drop policy if exists "admin write categories" on public.categories;
drop policy if exists "admin write products" on public.products;
drop policy if exists "admin write store settings" on public.store_settings;
drop policy if exists "admin read orders" on public.orders;
drop policy if exists "admin update orders" on public.orders;
drop policy if exists "admin read analytics" on public.analytics;

drop policy if exists "admin upload product images" on storage.objects;
drop policy if exists "admin update product images" on storage.objects;
drop policy if exists "admin delete product images" on storage.objects;

create policy "anon write categories" on public.categories
  for all to anon using (true) with check (true);
create policy "anon write products" on public.products
  for all to anon using (true) with check (true);
create policy "anon write store settings" on public.store_settings
  for all to anon using (true) with check (true);

create policy "anon read orders" on public.orders
  for select to anon using (true);
create policy "anon update orders" on public.orders
  for update to anon using (true) with check (true);
create policy "anon read analytics" on public.analytics
  for select to anon using (true);

create policy "anon upload product images" on storage.objects
  for insert to anon with check (bucket_id = 'product-images');
create policy "anon update product images" on storage.objects
  for update to anon using (bucket_id = 'product-images');
create policy "anon delete product images" on storage.objects
  for delete to anon using (bucket_id = 'product-images');

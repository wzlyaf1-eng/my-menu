-- Tighten admin access and add stable update timestamps for admin ordering.

alter table public.products
  add column if not exists updated_at timestamptz default now();

update public.products
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin users can read self" on public.admin_users;
create policy "admin users can read self" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "public full access" on public.categories;
drop policy if exists "public full access" on public.products;
drop policy if exists "public full access" on public.store_settings;

drop policy if exists "public read" on public.orders;
drop policy if exists "public update" on public.orders;
drop policy if exists "public read" on public.analytics;

drop policy if exists "public upload product images" on storage.objects;
drop policy if exists "public update product images" on storage.objects;
drop policy if exists "public delete product images" on storage.objects;

drop policy if exists "public read categories" on public.categories;
drop policy if exists "admin write categories" on public.categories;
drop policy if exists "public read products" on public.products;
drop policy if exists "admin write products" on public.products;
drop policy if exists "public read store settings" on public.store_settings;
drop policy if exists "admin write store settings" on public.store_settings;
drop policy if exists "admin read orders" on public.orders;
drop policy if exists "admin update orders" on public.orders;
drop policy if exists "admin read analytics" on public.analytics;
drop policy if exists "admin upload product images" on storage.objects;
drop policy if exists "admin update product images" on storage.objects;
drop policy if exists "admin delete product images" on storage.objects;

create policy "public read categories" on public.categories
  for select using (true);
create policy "admin write categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public read products" on public.products
  for select using (true);
create policy "admin write products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public read store settings" on public.store_settings
  for select using (true);
create policy "admin write store settings" on public.store_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read orders" on public.orders
  for select to authenticated using (public.is_admin());
create policy "admin update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin read analytics" on public.analytics
  for select to authenticated using (public.is_admin());

create policy "admin upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "admin delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

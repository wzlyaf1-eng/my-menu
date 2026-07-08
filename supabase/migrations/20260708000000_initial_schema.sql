-- my-menu — initial schema
-- Applied with: supabase db push
-- Creates all tables the app queries, the storage bucket for product images,
-- and the row-level-security policies matching how the app uses the anon key.

-- ============ Tables ============

create table if not exists public.categories (
  id text primary key,
  name text not null,
  name_en text default '',
  icon text default 'Coffee',
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text default '',
  price numeric not null default 0,
  offer_price numeric,
  image text default '',
  category_id text references public.categories(id) on delete set null,
  subcategory_id text,
  ingredients jsonb default '[]',
  preparation_time text default '',
  calories integer,
  allergens jsonb default '[]',
  available boolean default true,
  seasonal boolean default false,
  bestseller boolean default false,
  is_new boolean default false,
  limited boolean default false,
  moods jsonb default '[]',
  rating numeric,
  rating_count integer,
  sizes jsonb default '[]',
  customizations jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  logo text default '',
  phone text default '',
  whatsapp text default '',
  address text default '',
  instagram text,
  facebook text,
  working_hours text default '',
  currency text default 'IQD',
  tax_rate numeric default 0,
  is_open boolean default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number integer,
  order_type text not null,
  items jsonb not null default '[]',
  total_price numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.analytics (
  id bigint generated always as identity primary key,
  type text not null,
  created_at timestamptz default now()
);

-- ============ Row Level Security ============
-- The app has no server and no Supabase Auth: both the public menu and the
-- admin page talk to the database with the anon key, so the anon role gets
-- full access to menu data and insert-only access from customers on orders.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.analytics enable row level security;

create policy "public full access" on public.categories
  for all using (true) with check (true);
create policy "public full access" on public.products
  for all using (true) with check (true);
create policy "public full access" on public.store_settings
  for all using (true) with check (true);

create policy "public read" on public.orders for select using (true);
create policy "public insert" on public.orders for insert with check (true);
create policy "public update" on public.orders for update using (true) with check (true);

create policy "public read" on public.analytics for select using (true);
create policy "public insert" on public.analytics for insert with check (true);

-- ============ Storage: product images ============

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "public upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images');
create policy "public update product images" on storage.objects
  for update using (bucket_id = 'product-images');
create policy "public delete product images" on storage.objects
  for delete using (bucket_id = 'product-images');

create extension if not exists "pgcrypto";

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  wallet_address text,
  payment_network text not null default 'polygon_mainnet' check (
    payment_network in ('polygon_mainnet', 'polygon_amoy')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price_usdc numeric(18, 6) not null check (price_usdc >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  buyer_email text,
  amount_usdc numeric(18, 6) not null check (amount_usdc >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'expired', 'cancelled')
  ),
  payment_tx_hash text,
  payment_network text not null default 'polygon_mainnet' check (
    payment_network in ('polygon_mainnet', 'polygon_amoy')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
before update on public.shops
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Users can read own shops" on public.shops;
create policy "Users can read own shops"
on public.shops for select
using (auth.uid() = owner_id);

drop policy if exists "Users can insert own shops" on public.shops;
create policy "Users can insert own shops"
on public.shops for insert
with check (auth.uid() = owner_id);

drop policy if exists "Users can update own shops" on public.shops;
create policy "Users can update own shops"
on public.shops for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users can read own products" on public.products;
create policy "Users can read own products"
on public.products for select
using (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own products" on public.products;
create policy "Users can manage own products"
on public.products for all
using (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
on public.orders for select
using (
  exists (
    select 1 from public.shops
    where shops.id = orders.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Users can manage own orders" on public.orders;
create policy "Users can manage own orders"
on public.orders for all
using (
  exists (
    select 1 from public.shops
    where shops.id = orders.shop_id
      and shops.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.shops
    where shops.id = orders.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
on public.products for select
using (active = true);

drop policy if exists "Anyone can read shops for active products" on public.shops;
drop policy if exists "Anyone can read public shop payment details" on public.shops;
create policy "Anyone can read public shop payment details"
on public.shops for select
using (true);

drop policy if exists "Anyone can create pending orders" on public.orders;
create policy "Anyone can create pending orders"
on public.orders for insert
with check (
  status = 'pending'
  and payment_tx_hash is null
  and exists (
    select 1 from public.products
    where products.id = orders.product_id
      and products.shop_id = orders.shop_id
      and products.active = true
      and products.price_usdc = orders.amount_usdc
  )
);

drop policy if exists "Anyone can read their pending order by id" on public.orders;
create policy "Anyone can read their pending order by id"
on public.orders for select
using (status = 'pending');

drop policy if exists "Anyone can attach tx hash to pending orders" on public.orders;
create policy "Anyone can attach tx hash to pending orders"
on public.orders for update
using (status = 'pending')
with check (
  status = 'pending'
  and payment_tx_hash is not null
);

-- STREAK MVP initial schema
-- Supabase PostgreSQL migration.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('merchant', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.merchant_status as enum ('active', 'suspended');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.product_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_link_status as enum ('active', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'payment_submitted', 'paid', 'failed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('submitted', 'confirmed', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'merchant',
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status public.merchant_status not null default 'active',
  store_name text not null,
  contact_name text not null,
  phone text not null,
  country text not null default 'JP',
  business_description text not null,
  website_url text,
  wallet_address text not null,
  terms_accepted_at timestamptz not null,
  anti_social_confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchants_wallet_address_format check (wallet_address ~* '^0x[0-9a-f]{40}$')
);

create table if not exists public.merchant_settings (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null unique references public.merchants(id) on delete cascade,
  fee_bps integer not null default 250,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_settings_fee_bps_range check (fee_bps >= 0 and fee_bps <= 10000)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  status public.product_status not null default 'draft',
  name text not null,
  description text,
  price_usdc numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_usdc_positive check (price_usdc > 0)
);

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null unique,
  status public.payment_link_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  payment_link_id uuid not null references public.payment_links(id) on delete restrict,
  status public.order_status not null default 'pending',
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  buyer_postal_code text not null,
  buyer_address text not null,
  buyer_note text,
  product_name_snapshot text not null,
  merchant_name_snapshot text not null,
  amount_usdc numeric(20, 6) not null,
  fee_bps integer not null,
  merchant_amount_usdc numeric(20, 6) not null,
  streak_fee_usdc numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint orders_amount_usdc_positive check (amount_usdc > 0),
  constraint orders_fee_bps_range check (fee_bps >= 0 and fee_bps <= 10000),
  constraint orders_amounts_non_negative check (
    merchant_amount_usdc >= 0 and streak_fee_usdc >= 0
  )
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  merchant_id uuid not null references public.merchants(id) on delete restrict,
  status public.payment_status not null default 'submitted',
  chain_id integer not null,
  token_address text not null,
  contract_address text not null,
  tx_hash text not null unique,
  payer_address text,
  merchant_wallet_address text not null,
  streak_wallet_address text not null,
  amount_usdc numeric(20, 6) not null,
  merchant_amount_usdc numeric(20, 6) not null,
  streak_fee_usdc numeric(20, 6) not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payments_token_address_format check (token_address ~* '^0x[0-9a-f]{40}$'),
  constraint payments_contract_address_format check (contract_address ~* '^0x[0-9a-f]{40}$'),
  constraint payments_payer_address_format check (payer_address is null or payer_address ~* '^0x[0-9a-f]{40}$'),
  constraint payments_merchant_wallet_format check (merchant_wallet_address ~* '^0x[0-9a-f]{40}$'),
  constraint payments_streak_wallet_format check (streak_wallet_address ~* '^0x[0-9a-f]{40}$'),
  constraint payments_tx_hash_format check (tx_hash ~* '^0x[0-9a-f]{64}$'),
  constraint payments_amount_usdc_positive check (amount_usdc > 0),
  constraint payments_amounts_non_negative check (
    merchant_amount_usdc >= 0 and streak_fee_usdc >= 0
  )
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  type text not null,
  to_email text not null,
  status text not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint email_events_status_check check (status in ('queued', 'sent', 'failed'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists merchants_set_updated_at on public.merchants;
create trigger merchants_set_updated_at
before update on public.merchants
for each row execute function public.set_updated_at();

drop trigger if exists merchant_settings_set_updated_at on public.merchant_settings;
create trigger merchant_settings_set_updated_at
before update on public.merchant_settings
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists payment_links_set_updated_at on public.payment_links;
create trigger payment_links_set_updated_at
before update on public.payment_links
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select public.current_user_role() = 'admin'), false)
$$;

create or replace function public.current_merchant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.merchants where user_id = auth.uid()
$$;

create or replace function public.is_active_payment_link(
  target_payment_link_id uuid,
  target_merchant_id uuid,
  target_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.payment_links pl
    join public.products p on p.id = pl.product_id
    join public.merchants m on m.id = pl.merchant_id
    where pl.id = target_payment_link_id
      and pl.merchant_id = target_merchant_id
      and p.id = target_product_id
      and pl.status = 'active'
      and p.status = 'active'
      and m.status = 'active'
  )
$$;

create or replace function public.get_public_payment_link(target_slug text)
returns table (
  payment_link_id uuid,
  merchant_id uuid,
  product_id uuid,
  store_name text,
  product_name text,
  product_description text,
  price_usdc numeric(20, 6),
  fee_bps integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pl.id as payment_link_id,
    m.id as merchant_id,
    p.id as product_id,
    m.store_name,
    p.name as product_name,
    p.description as product_description,
    p.price_usdc,
    ms.fee_bps
  from public.payment_links pl
  join public.products p on p.id = pl.product_id
  join public.merchants m on m.id = pl.merchant_id
  join public.merchant_settings ms on ms.merchant_id = m.id
  where pl.slug = target_slug
    and pl.status = 'active'
    and p.status = 'active'
    and m.status = 'active'
  limit 1
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email)
  values (new.id, 'merchant', coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_new_merchant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.merchant_settings (merchant_id, fee_bps)
  values (new.id, 250)
  on conflict (merchant_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_merchant_created on public.merchants;
create trigger on_merchant_created
after insert on public.merchants
for each row execute function public.handle_new_merchant();

create index if not exists merchants_user_id_idx on public.merchants(user_id);
create index if not exists merchants_status_idx on public.merchants(status);
create unique index if not exists merchants_wallet_address_unique_idx on public.merchants(lower(wallet_address));
create index if not exists products_merchant_status_idx on public.products(merchant_id, status);
create index if not exists payment_links_slug_idx on public.payment_links(slug);
create index if not exists payment_links_merchant_id_idx on public.payment_links(merchant_id);
create index if not exists orders_merchant_created_at_idx on public.orders(merchant_id, created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists payments_tx_hash_idx on public.payments(tx_hash);
create index if not exists payments_merchant_created_at_idx on public.payments(merchant_id, created_at desc);
create index if not exists email_events_order_id_idx on public.email_events(order_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

alter table public.profiles enable row level security;
alter table public.merchants enable row level security;
alter table public.merchant_settings enable row level security;
alter table public.products enable row level security;
alter table public.payment_links enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.email_events enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "merchants_select_own_or_admin" on public.merchants;
create policy "merchants_select_own_or_admin"
on public.merchants for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "merchants_insert_own" on public.merchants;
create policy "merchants_insert_own"
on public.merchants for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "merchants_update_own_or_admin" on public.merchants;
create policy "merchants_update_own_or_admin"
on public.merchants for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "merchant_settings_select_own_or_admin" on public.merchant_settings;
create policy "merchant_settings_select_own_or_admin"
on public.merchant_settings for select
to authenticated
using (
  merchant_id = public.current_merchant_id()
  or public.is_admin()
);

drop policy if exists "merchant_settings_insert_own_or_admin" on public.merchant_settings;
create policy "merchant_settings_insert_own_or_admin"
on public.merchant_settings for insert
to authenticated
with check (
  merchant_id = public.current_merchant_id()
  or public.is_admin()
);

drop policy if exists "merchant_settings_update_admin_only" on public.merchant_settings;
create policy "merchant_settings_update_admin_only"
on public.merchant_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "products_select_own_or_admin" on public.products;
create policy "products_select_own_or_admin"
on public.products for select
to authenticated
using (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products for insert
to authenticated
with check (merchant_id = public.current_merchant_id());

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products for update
to authenticated
using (merchant_id = public.current_merchant_id())
with check (merchant_id = public.current_merchant_id());

drop policy if exists "payment_links_select_own_or_admin" on public.payment_links;
create policy "payment_links_select_own_or_admin"
on public.payment_links for select
to authenticated
using (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "payment_links_insert_own" on public.payment_links;
create policy "payment_links_insert_own"
on public.payment_links for insert
to authenticated
with check (merchant_id = public.current_merchant_id());

drop policy if exists "payment_links_update_own" on public.payment_links;
create policy "payment_links_update_own"
on public.payment_links for update
to authenticated
using (merchant_id = public.current_merchant_id())
with check (merchant_id = public.current_merchant_id());

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
on public.orders for select
to authenticated
using (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "orders_insert_public_payment_link" on public.orders;
create policy "orders_insert_public_payment_link"
on public.orders for insert
to anon, authenticated
with check (public.is_active_payment_link(payment_link_id, merchant_id, product_id));

drop policy if exists "orders_update_own_or_admin" on public.orders;
create policy "orders_update_own_or_admin"
on public.orders for update
to authenticated
using (merchant_id = public.current_merchant_id() or public.is_admin())
with check (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin"
on public.payments for select
to authenticated
using (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "payments_insert_authenticated" on public.payments;
create policy "payments_insert_authenticated"
on public.payments for insert
to authenticated
with check (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "payments_update_admin_only" on public.payments;
create policy "payments_update_admin_only"
on public.payments for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "email_events_select_own_or_admin" on public.email_events;
create policy "email_events_select_own_or_admin"
on public.email_events for select
to authenticated
using (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "email_events_insert_authenticated" on public.email_events;
create policy "email_events_insert_authenticated"
on public.email_events for insert
to authenticated
with check (merchant_id = public.current_merchant_id() or public.is_admin());

drop policy if exists "audit_logs_select_admin_only" on public.audit_logs;
create policy "audit_logs_select_admin_only"
on public.audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "audit_logs_insert_admin_only" on public.audit_logs;
create policy "audit_logs_insert_admin_only"
on public.audit_logs for insert
to authenticated
with check (public.is_admin());

drop policy if exists "payment_links_public_active_select" on public.payment_links;
create policy "payment_links_public_active_select"
on public.payment_links for select
to anon, authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.products p
    join public.merchants m on m.id = p.merchant_id
    where p.id = product_id
      and p.status = 'active'
      and m.status = 'active'
  )
);

grant execute on function public.get_public_payment_link(text) to anon, authenticated;
grant execute on function public.is_active_payment_link(uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_merchant_id() to authenticated;

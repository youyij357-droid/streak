alter table public.shops
add column if not exists payment_network text not null default 'polygon_mainnet'
check (payment_network in ('polygon_mainnet', 'polygon_amoy'));

alter table public.orders
add column if not exists payment_network text not null default 'polygon_mainnet'
check (payment_network in ('polygon_mainnet', 'polygon_amoy'));

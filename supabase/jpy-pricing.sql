alter table public.shops
add column if not exists jpy_per_usdc numeric(18, 6) not null default 160
check (jpy_per_usdc > 0);

alter table public.products
add column if not exists price_jpy numeric(18, 0);

update public.products
set price_jpy = round(price_usdc * 160)
where price_jpy is null;

alter table public.products
alter column price_jpy set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_price_jpy_check'
  ) then
    alter table public.products
    add constraint products_price_jpy_check check (price_jpy >= 0);
  end if;
end $$;

alter table public.orders
add column if not exists amount_jpy numeric(18, 0);

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
      and products.price_jpy = orders.amount_jpy
      and products.price_usdc = orders.amount_usdc
  )
);

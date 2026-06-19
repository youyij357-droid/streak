drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
on public.products for select
using (active = true);

drop policy if exists "Anyone can read shops for active products" on public.shops;
create policy "Anyone can read shops for active products"
on public.shops for select
using (
  exists (
    select 1 from public.products
    where products.shop_id = shops.id
      and products.active = true
  )
);

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

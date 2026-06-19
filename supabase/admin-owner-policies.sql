drop policy if exists "Users can delete own shops" on public.shops;
create policy "Users can delete own shops"
on public.shops for delete
using (auth.uid() = owner_id);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
on public.products for insert
with check (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
on public.products for update
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

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products"
on public.products for delete
using (
  exists (
    select 1 from public.shops
    where shops.id = products.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
on public.orders for insert
with check (
  exists (
    select 1 from public.shops
    where shops.id = orders.shop_id
      and shops.owner_id = auth.uid()
  )
);

drop policy if exists "Users can update own orders" on public.orders;
create policy "Users can update own orders"
on public.orders for update
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

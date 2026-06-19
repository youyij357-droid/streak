drop policy if exists "Anyone can attach tx hash to pending orders" on public.orders;
create policy "Anyone can attach tx hash to pending orders"
on public.orders for update
using (status = 'pending')
with check (
  status = 'pending'
  and payment_tx_hash is not null
);

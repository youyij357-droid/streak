drop policy if exists "Anyone can read shops for active products" on public.shops;

drop policy if exists "Anyone can read public shop payment details" on public.shops;
create policy "Anyone can read public shop payment details"
on public.shops for select
using (true);

-- Reset only the page data used by product and payment testing.
-- This keeps shops, login users, wallet settings, payment network, and exchange rate.
-- Run this in Supabase SQL Editor when you want a clean product/order list.

delete from public.orders;
delete from public.products;

alter table public.shops
  add column if not exists public_site_published boolean not null default true,
  add column if not exists public_site_headline text,
  add column if not exists public_site_description text,
  add column if not exists support_email text,
  add column if not exists support_hours text,
  add column if not exists company_name text,
  add column if not exists representative_name text,
  add column if not exists business_address text,
  add column if not exists sales_terms text,
  add column if not exists refund_policy text,
  add column if not exists delivery_timing text,
  add column if not exists accepted_payment_methods text,
  add column if not exists review_notice text;

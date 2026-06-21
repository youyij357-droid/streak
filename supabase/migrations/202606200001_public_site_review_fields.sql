-- Public shop site fields for provider review.

alter table public.merchants
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

create or replace function public.get_public_payment_link(target_slug text)
returns table (
  payment_link_id uuid,
  merchant_id uuid,
  product_id uuid,
  store_name text,
  product_name text,
  product_description text,
  price_usdc numeric(20, 6),
  fee_bps integer,
  website_url text,
  business_description text,
  public_site_headline text,
  public_site_description text,
  support_email text,
  support_hours text,
  company_name text,
  representative_name text,
  business_address text,
  sales_terms text,
  refund_policy text,
  delivery_timing text,
  accepted_payment_methods text,
  review_notice text
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
    ms.fee_bps,
    m.website_url,
    m.business_description,
    m.public_site_headline,
    m.public_site_description,
    m.support_email,
    m.support_hours,
    m.company_name,
    m.representative_name,
    m.business_address,
    m.sales_terms,
    m.refund_policy,
    m.delivery_timing,
    m.accepted_payment_methods,
    m.review_notice
  from public.payment_links pl
  join public.products p on p.id = pl.product_id
  join public.merchants m on m.id = pl.merchant_id
  join public.merchant_settings ms on ms.merchant_id = m.id
  where pl.slug = target_slug
    and pl.status = 'active'
    and p.status = 'active'
    and m.status = 'active'
    and m.public_site_published = true
  limit 1
$$;

create or replace function public.get_public_shop_page(target_merchant_id uuid)
returns table (
  merchant_id uuid,
  store_name text,
  website_url text,
  business_description text,
  public_site_headline text,
  public_site_description text,
  support_email text,
  support_hours text,
  company_name text,
  representative_name text,
  business_address text,
  sales_terms text,
  refund_policy text,
  delivery_timing text,
  accepted_payment_methods text,
  review_notice text,
  product_id uuid,
  product_name text,
  product_description text,
  price_usdc numeric(20, 6),
  payment_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id as merchant_id,
    m.store_name,
    m.website_url,
    m.business_description,
    m.public_site_headline,
    m.public_site_description,
    m.support_email,
    m.support_hours,
    m.company_name,
    m.representative_name,
    m.business_address,
    m.sales_terms,
    m.refund_policy,
    m.delivery_timing,
    m.accepted_payment_methods,
    m.review_notice,
    p.id as product_id,
    p.name as product_name,
    p.description as product_description,
    p.price_usdc,
    pl.slug as payment_slug
  from public.merchants m
  left join public.products p
    on p.merchant_id = m.id
   and p.status = 'active'
  left join public.payment_links pl
    on pl.product_id = p.id
   and pl.merchant_id = m.id
   and pl.status = 'active'
  where m.id = target_merchant_id
    and m.status = 'active'
    and m.public_site_published = true
  order by p.created_at desc nulls last
$$;

grant execute on function public.get_public_payment_link(text) to anon, authenticated;
grant execute on function public.get_public_shop_page(uuid) to anon, authenticated;

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const walletAddressPattern = /^0x[0-9a-f]{40}$/;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function updateMerchantSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const walletAddress = textValue(formData, 'wallet_address')?.toLowerCase();
  if (!walletAddress || !walletAddressPattern.test(walletAddress)) {
    redirect('/dashboard/settings?error=wallet');
  }

  const payload = {
    store_name: textValue(formData, 'store_name') ?? '',
    contact_name: textValue(formData, 'contact_name') ?? '',
    phone: textValue(formData, 'phone') ?? '',
    country: textValue(formData, 'country') ?? 'JP',
    business_description: textValue(formData, 'business_description') ?? '',
    website_url: textValue(formData, 'website_url'),
    wallet_address: walletAddress,
    public_site_published: formData.get('public_site_published') === 'on',
    public_site_headline: textValue(formData, 'public_site_headline'),
    public_site_description: textValue(formData, 'public_site_description'),
    support_email: textValue(formData, 'support_email'),
    support_hours: textValue(formData, 'support_hours'),
    company_name: textValue(formData, 'company_name'),
    representative_name: textValue(formData, 'representative_name'),
    business_address: textValue(formData, 'business_address'),
    sales_terms: textValue(formData, 'sales_terms'),
    refund_policy: textValue(formData, 'refund_policy'),
    delivery_timing: textValue(formData, 'delivery_timing'),
    accepted_payment_methods: textValue(formData, 'accepted_payment_methods'),
    review_notice: textValue(formData, 'review_notice'),
  };

  const { error } = await supabase.from('merchants').update(payload).eq('user_id', user.id);

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/pay/[slug]', 'page');
  revalidatePath('/shop/[merchantId]', 'page');
  redirect('/dashboard/settings?saved=1');
}

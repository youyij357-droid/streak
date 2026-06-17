import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const walletAddressPattern = /^0x[0-9a-f]{40}$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const requiredFields = [
    'storeName',
    'contactName',
    'phone',
    'country',
    'businessDescription',
    'walletAddress',
  ] as const;

  for (const field of requiredFields) {
    if (!body?.[field] || typeof body[field] !== 'string') {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  if (!body.agreedTerms || !body.agreedAntisocial) {
    return NextResponse.json(
      { error: '利用規約への同意と反社会的勢力ではないことの確認が必要です。' },
      { status: 400 }
    );
  }

  const walletAddress = body.walletAddress.trim().toLowerCase();
  if (!walletAddressPattern.test(walletAddress)) {
    return NextResponse.json(
      { error: '有効なEVMウォレットアドレスを入力してください。' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existingWalletOwner, error: walletError } = await supabase
    .from('merchants')
    .select('id, user_id')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (walletError) {
    return NextResponse.json({ error: walletError.message }, { status: 500 });
  }

  if (existingWalletOwner && existingWalletOwner.user_id !== user.id) {
    return NextResponse.json(
      { error: 'このウォレットアドレスはすでに登録されています。' },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const merchantPayload = {
    user_id: user.id,
    status: 'active',
    store_name: body.storeName.trim(),
    contact_name: body.contactName.trim(),
    phone: body.phone.trim(),
    country: body.country.trim(),
    business_description: body.businessDescription.trim(),
    website_url:
      typeof body.websiteUrl === 'string' && body.websiteUrl.trim()
        ? body.websiteUrl.trim()
        : null,
    wallet_address: walletAddress,
    terms_accepted_at: now,
    anti_social_confirmed_at: now,
  };

  const { data: existingMerchant, error: existingMerchantError } = await supabase
    .from('merchants')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMerchantError) {
    return NextResponse.json({ error: existingMerchantError.message }, { status: 500 });
  }

  const query = existingMerchant
    ? supabase.from('merchants').update(merchantPayload).eq('id', existingMerchant.id).select('id').single()
    : supabase.from('merchants').insert(merchantPayload).select('id').single();

  const { data: merchant, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, merchantId: merchant.id });
}

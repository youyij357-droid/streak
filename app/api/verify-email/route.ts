import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const shopId = searchParams.get('shopId');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://streak.io';

  if (!token || !shopId) {
    return NextResponse.redirect(new URL('/email-verified?error=invalid', baseUrl));
  }

  const supabase = createAdminClient();

  const { data: shop, error } = await supabase
    .from('shops')
    .select('id, verification_token_expires_at')
    .eq('id', shopId)
    .eq('verification_token', token)
    .single();

  if (error || !shop) {
    return NextResponse.redirect(new URL('/email-verified?error=invalid', baseUrl));
  }

  // 有効期限チェック（24時間）
  if (
    !shop.verification_token_expires_at ||
    new Date(shop.verification_token_expires_at) < new Date()
  ) {
    return NextResponse.redirect(new URL('/email-verified?error=expired', baseUrl));
  }

  await supabase
    .from('shops')
    .update({
      email_verified: true,
      verification_token: null,
      verification_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shopId);

  return NextResponse.redirect(new URL('/email-verified', baseUrl));
}

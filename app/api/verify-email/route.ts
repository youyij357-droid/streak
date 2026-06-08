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
    .select('id')
    .eq('id', shopId)
    .eq('verification_token', token)
    .single();

  if (error || !shop) {
    return NextResponse.redirect(new URL('/email-verified?error=invalid', baseUrl));
  }

  await supabase
    .from('shops')
    .update({
      email_verified: true,
      verification_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shopId);

  return NextResponse.redirect(new URL('/email-verified', baseUrl));
}

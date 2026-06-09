import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmailVerification } from '@/lib/email/resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body?.shopId || !body?.email) {
      return NextResponse.json({ error: 'shopId and email are required' }, { status: 400 });
    }

    // streak-session cookie と shopId を照合
    const sessionShopId = request.cookies.get('streak-session')?.value;
    if (!sessionShopId || sessionShopId !== body.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopId, email } = body;

    const supabase = createAdminClient();

    const { data: shop } = await supabase
      .from('shops')
      .select('shop_name')
      .eq('id', shopId)
      .single();

    const verificationToken = randomUUID();
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('shops')
      .update({
        verification_token: verificationToken,
        verification_token_expires_at: verificationTokenExpiresAt,
        email_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update verification token', detail: error.message },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://streak.io';
    const verifyUrl = `${baseUrl}/api/verify-email?token=${verificationToken}&shopId=${shopId}`;

    await sendEmailVerification({
      toEmail: email,
      shopName: shop?.shop_name ?? shopId,
      verifyUrl,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected error', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

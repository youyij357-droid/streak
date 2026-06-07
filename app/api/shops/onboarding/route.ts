import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminNotification, sendWelcomeEmail } from '@/lib/email/resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body?.shopId || !body?.shopName || !body?.walletAddress) {
      return NextResponse.json(
        { error: 'shopId, shopName, walletAddress are required' },
        { status: 400 }
      );
    }

    const { shopId, shopName, walletAddress, email } = body;

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('shops')
      .update({
        shop_name: shopName,
        wallet_address: walletAddress.toLowerCase(),
        email: email ?? null,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update shop', detail: error.message },
        { status: 500 }
      );
    }

    const appliedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://streak.io'}/dashboard`;

    // メール送信（失敗しても登録自体は成功扱い）
    await Promise.allSettled([
      sendAdminNotification({ shopName, walletAddress, email, appliedAt }),
      email ? sendWelcomeEmail({ shopName, toEmail: email, dashboardUrl }) : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected error', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

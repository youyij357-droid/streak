import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminNotification, sendEmailVerification } from '@/lib/email/resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const required = ['shopId', 'shopName', 'walletAddress', 'accountName', 'email', 'phone', 'country'];
    for (const field of required) {
      if (!body?.[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!body.agreedTerms || !body.agreedAntisocial) {
      return NextResponse.json(
        { error: '利用規約および反社確認への同意が必要です' },
        { status: 400 }
      );
    }

    const {
      shopId,
      shopName,
      walletAddress,
      accountName,
      email,
      phone,
      country,
      websiteUrl,
      businessDescription,
    } = body;

    const verificationToken = randomUUID();

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('shops')
      .update({
        shop_name: shopName,
        wallet_address: walletAddress.toLowerCase(),
        email,
        account_name: accountName,
        phone,
        country,
        website_url: websiteUrl ?? null,
        business_description: businessDescription ?? null,
        agreed_terms: true,
        agreed_antisocial: true,
        email_verified: false,
        verification_token: verificationToken,
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://streak.io';
    const verifyUrl = `${baseUrl}/api/verify-email?token=${verificationToken}&shopId=${shopId}`;
    const appliedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    await Promise.allSettled([
      sendAdminNotification({ shopName, walletAddress, email, appliedAt }),
      sendEmailVerification({ toEmail: email, shopName, verifyUrl }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected error', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

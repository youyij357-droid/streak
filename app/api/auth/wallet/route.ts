import { createAdminClient } from '@/lib/supabase/admin';
import { createShopSessionValue, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const normalizedAddress = walletAddress.toLowerCase();

    // Step1: 既存レコードを検索
    const { data: existing, error: selectError } = await supabase
      .from('shops')
      .select('id, shop_name')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing) {
      const response = NextResponse.json({
        success: true,
        isNewUser: !existing.shop_name,
        shopId: existing.id,
      });
      response.cookies.set('streak-session', createShopSessionValue(existing.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: '/',
      });
      return response;
    }

    // Step2: 存在しない場合のみINSERT
    const { data: newShop, error: insertError } = await supabase
      .from('shops')
      .insert({ wallet_address: normalizedAddress })
      .select('id, shop_name')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      isNewUser: !newShop.shop_name,
      shopId: newShop.id,
    });
    response.cookies.set('streak-session', createShopSessionValue(newShop.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('streak-session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}

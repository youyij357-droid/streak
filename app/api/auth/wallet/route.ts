import { createAdminClient } from '@/lib/supabase/admin';
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

    const { data, error } = await supabase
      .from('shops')
      .upsert(
        { wallet_address: walletAddress.toLowerCase() },
        { onConflict: 'wallet_address', ignoreDuplicates: true }
      )
      .select('id, shop_name')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const isNewUser = !data.shop_name;

    return NextResponse.json({
      success: true,
      isNewUser,
      shopId: data.id,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

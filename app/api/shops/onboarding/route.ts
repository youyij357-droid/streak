import { createAdminClient } from '@/lib/supabase/admin';
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unexpected error', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

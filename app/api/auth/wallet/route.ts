import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface OrderRequestBody {
  shopId: string;
  productId: string;
  txHash: string;
  paymentMethod: string;
  amountUsdc: number;
}

export async function POST(request: Request) {
  try {
    const body: OrderRequestBody = await request.json();
    const { shopId, productId, txHash, paymentMethod, amountUsdc } = body;

    if (!shopId || !productId || !txHash || !paymentMethod || amountUsdc == null) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const merchantAmount = amountUsdc * 0.975;
    const streakFee = amountUsdc * 0.025;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          shop_id: shopId,
          product_id: productId,
          tx_hash: txHash,
          payment_method: paymentMethod,
          amount_usdc: amountUsdc,
          merchant_amount: merchantAmount,
          streak_fee: streakFee,
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save order' },
      { status: 500 }
    );
  }
}

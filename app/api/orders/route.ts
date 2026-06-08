import { createAdminClient } from '@/lib/supabase/admin';
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

    const supabase = createAdminClient();

    // 商品情報を取得（通知用）
    const { data: product } = await supabase
      .from('products')
      .select('name, price_jpy')
      .eq('id', productId)
      .single();

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

    // 決済通知メールを fire-and-forget で送信
    const baseUrl = new URL(request.url).origin;
    fetch(`${baseUrl}/api/notify/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        productName: product?.name ?? '商品',
        amountJpy: product?.price_jpy ?? null,
        amountUsdc,
        paymentMethod,
        txHash,
      }),
    }).catch(() => {});

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save order' },
      { status: 500 }
    );
  }
}

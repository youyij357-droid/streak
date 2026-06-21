import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

interface OrderRequestBody {
  shopId: string;
  productId: string;
  txHash: string;
  paymentMethod: string;
  amountUsdc: number;
}

const VALID_PAYMENT_METHODS = new Set(['wallet', 'crossmint', 'card']);

export async function POST(request: Request) {
  try {
    const body: OrderRequestBody = await request.json();
    const { shopId, productId, txHash, paymentMethod, amountUsdc } = body;

    if (!shopId || !productId || !txHash || !paymentMethod || amountUsdc == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 });
    }

    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name, price_jpy, price_usdc, is_published')
      .eq('id', productId)
      .eq('shop_id', shopId)
      .single();

    if (productError || !product || !product.is_published) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const expectedAmount = Number(product.price_usdc);
    if (product.price_jpy == null && Math.abs(amountUsdc - expectedAmount) > 0.000001) {
      return NextResponse.json({ error: 'Amount does not match product price' }, { status: 400 });
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Order already exists for this transaction' },
        { status: 409 }
      );
    }

    const merchantAmount = amountUsdc * 0.975;
    const streakFee = amountUsdc * 0.025;

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

    const baseUrl = new URL(request.url).origin;
    fetch(`${baseUrl}/api/notify/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        productName: product.name,
        amountJpy: product.price_jpy ?? null,
        amountUsdc,
        paymentMethod,
        txHash,
      }),
    }).catch(() => {});

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save order', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

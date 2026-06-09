import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentNotification } from '@/lib/email/resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { shopId, productName, amountJpy, amountUsdc, paymentMethod, txHash } =
      await request.json();

    if (!shopId || !txHash) {
      return NextResponse.json({ error: 'shopId and txHash are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: shop } = await supabase
      .from('shops')
      .select('shop_name, email')
      .eq('id', shopId)
      .single();

    if (!shop?.email) {
      return new NextResponse(null, { status: 204 });
    }

    await sendPaymentNotification({
      shopName: shop.shop_name ?? shopId,
      toEmail: shop.email,
      productName: productName ?? '商品',
      amountJpy: amountJpy ?? null,
      amountUsdc,
      paymentMethod: paymentMethod ?? 'wallet',
      txHash,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to send notification', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

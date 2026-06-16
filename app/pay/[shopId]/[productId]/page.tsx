import { createClient } from '@/lib/supabase/server';
import { getUsdcJpyRate, jpyToUsdc } from '@/lib/exchange/rate';
import { notFound } from 'next/navigation';
import PaymentClient from './PaymentClient';

interface Shop {
  id: string;
  shop_name: string;
  wallet_address: string;
  crossmint_api_key?: string;
}

interface Product {
  id: string;
  name: string;
  price_usdc: number;
  price_jpy: number | null;
  description?: string;
  category: string;
  is_published: boolean;
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ shopId: string; productId: string }>;
}) {
  const { shopId, productId } = await params;
  const supabase = await createClient();

  const [{ data: shop }, { data: product }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, shop_name, wallet_address, crossmint_api_key')
      .eq('id', shopId)
      .single<Shop>(),
    supabase
      .from('products')
      .select('id, name, price_usdc, price_jpy, description, category, is_published')
      .eq('id', productId)
      .eq('shop_id', shopId)
      .single<Product>(),
  ]);

  if (!shop || !product || !product.is_published) {
    notFound();
  }

  // リアルタイム為替レート取得（失敗時はprice_usdcにフォールバック）
  let rateJpy: number | null = null;
  let rateUpdatedAt: string | null = null;
  try {
    rateJpy = await getUsdcJpyRate();
    rateUpdatedAt = new Date().toLocaleTimeString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    // フォールバック：price_usdcをそのまま使用
  }

  const priceUsdc =
    product.price_jpy != null && rateJpy != null
      ? jpyToUsdc(product.price_jpy, rateJpy)
      : product.price_usdc;

  return (
    <PaymentClient
      shopId={shopId}
      productId={productId}
      shop={shop}
      product={product}
      priceJpy={product.price_jpy}
      priceUsdc={priceUsdc}
      rateJpy={rateJpy}
      rateUpdatedAt={rateUpdatedAt}
    />
  );
}

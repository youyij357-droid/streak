import { createClient } from '@/lib/supabase/server';
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
      .select('id, name, price_usdc, description, category, is_published')
      .eq('id', productId)
      .eq('shop_id', shopId)
      .single<Product>(),
  ]);

  if (!shop || !product || !product.is_published) {
    notFound();
  }

  return <PaymentClient shop={shop} product={product} />;
}

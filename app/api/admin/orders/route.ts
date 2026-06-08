import { createAdminClient } from '@/lib/supabase/admin';
import { validateAdminCookie } from '@/lib/admin/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!validateAdminCookie(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [{ data: orders, error }, { data: shops }, { data: products }] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.from('shops').select('id, shop_name'),
    supabase.from('products').select('id, name'),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shopMap: Record<string, string> = Object.fromEntries(
    (shops || []).map((s: { id: string; shop_name: string }) => [s.id, s.shop_name])
  );
  const productMap: Record<string, string> = Object.fromEntries(
    (products || []).map((p: { id: string; name: string }) => [p.id, p.name])
  );

  const data = (orders || []).map((o: Record<string, unknown>) => ({
    ...o,
    shop_name: shopMap[o.shop_id as string] ?? '—',
    product_name: productMap[o.product_id as string] ?? '—',
  }));

  return NextResponse.json({ data });
}

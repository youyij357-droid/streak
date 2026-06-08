import { createAdminClient } from '@/lib/supabase/admin';
import { validateAdminCookie } from '@/lib/admin/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!validateAdminCookie(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [{ data: shops, error }, { data: products }] = await Promise.all([
    supabase.from('shops').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('shop_id'),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const productCounts: Record<string, number> = {};
  (products || []).forEach((p: { shop_id: string }) => {
    productCounts[p.shop_id] = (productCounts[p.shop_id] || 0) + 1;
  });

  const data = (shops || []).map((shop: Record<string, unknown>) => ({
    ...shop,
    product_count: productCounts[shop.id as string] || 0,
  }));

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  if (!validateAdminCookie(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { shopId, updates } = await request.json();
    if (!shopId || !updates) {
      return NextResponse.json({ error: 'shopId and updates are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('shops')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', shopId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

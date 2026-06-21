import { createAdminClient } from '@/lib/supabase/admin';
import { verifyShopSessionValue } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body?.shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    // streak-session cookie と shopId を照合
    const sessionShopId = verifyShopSessionValue(request.cookies.get('streak-session')?.value);
    if (!sessionShopId || sessionShopId !== body.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopId, email, crossmintApiKey, accountName, phone, country } = body;

    const supabase = createAdminClient();

    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) updates.email = email || null;
    if (crossmintApiKey !== undefined) updates.crossmint_api_key = crossmintApiKey || null;
    if (accountName !== undefined) updates.account_name = accountName || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (country !== undefined) updates.country = country || null;

    const { error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', shopId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save settings', detail: error.message },
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

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body?.shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 });
    }

    const { shopId, email, crossmintApiKey } = body;

    const supabase = createAdminClient();

    const updates: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (email !== undefined) updates.email = email || null;
    if (crossmintApiKey !== undefined) updates.crossmint_api_key = crossmintApiKey || null;

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

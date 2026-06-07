import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // 既存のショップを検索
    const { data: existingShop } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (existingShop) {
      return NextResponse.json({
        success: true,
        isNewUser: false,
        shopId: existingShop.id
      })
    }

    // 新規ショップを作成
    const { data: newShop, error } = await supabaseAdmin
      .from('shops')
      .insert({ wallet_address: walletAddress })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      isNewUser: true,
      shopId: newShop.id
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

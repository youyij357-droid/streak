import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, store_name, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!merchant) {
    redirect('/dashboard/onboarding');
  }

  const [{ count: productCount }, { count: orderCount }, { data: paidOrders }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .eq('status', 'active'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id),
    supabase
      .from('orders')
      .select('amount_usdc, streak_fee_usdc')
      .eq('merchant_id', merchant.id)
      .eq('status', 'paid'),
  ]);

  const totalVolume = (paidOrders ?? []).reduce(
    (sum, order) => sum + Number(order.amount_usdc ?? 0),
    0
  );
  const totalFees = (paidOrders ?? []).reduce(
    (sum, order) => sum + Number(order.streak_fee_usdc ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">加盟店ダッシュボード</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {merchant.store_name}
          </h1>
        </div>
        <Link
          href="/dashboard/products"
          className="inline-flex w-fit rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          商品を登録する
        </Link>
      </div>

      {merchant.status === 'suspended' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          この加盟店は停止中です。新しい決済は受け付けられません。
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="売上合計" value={`${totalVolume.toFixed(2)} USDC`} />
        <Metric label="STREAK手数料" value={`${totalFees.toFixed(2)} USDC`} />
        <Metric label="注文数" value={`${orderCount ?? 0}`} />
        <Metric label="有効商品" value={`${productCount ?? 0}`} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">次にやること</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <NextStep title="商品登録" body="USDC価格の商品を登録します。" href="/dashboard/products" />
          <NextStep title="決済リンク発行" body="商品ごとに購入URLを発行します。" href="/dashboard/products" />
          <NextStep title="決済履歴確認" body="TXと注文状態を確認します。" href="/dashboard/payments" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function NextStep({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </Link>
  );
}

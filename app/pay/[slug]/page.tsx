import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PaymentLinkPage(props: PageProps<'/pay/[slug]'>) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_payment_link', {
    target_slug: slug,
  });

  if (error || !data?.[0]) {
    notFound();
  }

  const paymentLink = data[0];

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-slate-950">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">{paymentLink.store_name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{paymentLink.product_name}</h1>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {paymentLink.product_description && (
            <p className="mb-6 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {paymentLink.product_description}
            </p>
          )}

          <div className="flex items-end justify-between border-t border-slate-200 pt-5">
            <div>
              <p className="text-sm text-slate-500">支払金額</p>
              <p className="mt-1 text-3xl font-semibold">
                {Number(paymentLink.price_usdc).toFixed(6)} USDC
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Polygon USDC
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          購入者情報入力とウォレット決済は次の実装ステップで接続します。現在は決済リンクの公開表示確認用です。
        </div>
      </div>
    </main>
  );
}

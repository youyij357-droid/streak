import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PaymentLink = {
  payment_link_id: string;
  merchant_id: string;
  product_id: string;
  store_name: string;
  product_name: string;
  product_description: string | null;
  price_usdc: number | string;
  business_description?: string | null;
  public_site_headline?: string | null;
  public_site_description?: string | null;
  support_email?: string | null;
  support_hours?: string | null;
  company_name?: string | null;
  representative_name?: string | null;
  business_address?: string | null;
  sales_terms?: string | null;
  refund_policy?: string | null;
  delivery_timing?: string | null;
  accepted_payment_methods?: string | null;
  review_notice?: string | null;
};

export default async function PaymentLinkPage(props: PageProps<'/pay/[slug]'>) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_payment_link', {
    target_slug: slug,
  });

  if (error || !data?.[0]) {
    notFound();
  }

  const paymentLink = data[0] as PaymentLink;
  const shopUrl = `/shop/${paymentLink.merchant_id}`;
  const paymentMethods = paymentLink.accepted_payment_methods || 'Polygon USDC';

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_380px] lg:px-8">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <Link href={shopUrl} className="text-sm font-medium text-slate-500 hover:text-slate-950">
              {paymentLink.store_name}
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {paymentLink.product_name}
            </h1>
            {paymentLink.product_description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {paymentLink.product_description}
              </p>
            )}
          </div>

          <InfoSection title="ショップについて">
            <p>{paymentLink.public_site_description || paymentLink.business_description || '販売者情報は店舗設定で確認できます。'}</p>
          </InfoSection>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoSection title="提供時期">
              <p>{paymentLink.delivery_timing || '決済確認後、販売者の案内に従って商品またはサービスが提供されます。'}</p>
            </InfoSection>
            <InfoSection title="返金・キャンセル">
              <p>{paymentLink.refund_policy || '返金・キャンセル条件は販売者へお問い合わせください。'}</p>
            </InfoSection>
          </div>

          <InfoSection title="購入前の注意事項">
            <p>
              {paymentLink.review_notice ||
                'USDC決済では、ウォレット、ネットワーク、送金先アドレスを購入者自身で確認してから送金してください。'}
            </p>
          </InfoSection>
        </section>

        <aside className="space-y-4">
          <div className="sticky top-6 rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">支払い金額</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              {Number(paymentLink.price_usdc).toFixed(6)} USDC
            </p>
            <p className="mt-2 text-sm text-slate-500">Polygon USDCで支払い</p>

            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              購入手続きへ進む
            </button>

            <div className="mt-6 space-y-4 border-t border-slate-200 pt-5 text-sm">
              <Detail label="利用可能な決済方法" value={paymentMethods} />
              <Detail label="販売者" value={paymentLink.company_name || paymentLink.store_name} />
              <Detail label="問い合わせ" value={paymentLink.support_email || '販売者へお問い合わせください'} />
              <Detail label="対応時間" value={paymentLink.support_hours || '販売者の案内をご確認ください'} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6">
            <h2 className="font-semibold text-slate-950">事業者情報</h2>
            <div className="mt-4 space-y-3">
              <Detail label="法人名・屋号" value={paymentLink.company_name || paymentLink.store_name} />
              <Detail label="代表者" value={paymentLink.representative_name || '未設定'} />
              <Detail label="所在地" value={paymentLink.business_address || '未設定'} />
              <Detail label="販売条件" value={paymentLink.sales_terms || '商品ページの表示内容をご確認ください'} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/terms" className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
              利用規約
            </Link>
            <Link href="/privacy" className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
              プライバシーポリシー
            </Link>
            <Link href="/tokushoho" className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
              特商法表記
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words font-medium text-slate-950">{value}</p>
    </div>
  );
}

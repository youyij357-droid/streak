import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PublicShopRow = {
  merchant_id: string;
  store_name: string;
  website_url: string | null;
  business_description: string | null;
  public_site_headline: string | null;
  public_site_description: string | null;
  support_email: string | null;
  support_hours: string | null;
  company_name: string | null;
  representative_name: string | null;
  business_address: string | null;
  sales_terms: string | null;
  refund_policy: string | null;
  delivery_timing: string | null;
  accepted_payment_methods: string | null;
  review_notice: string | null;
  product_id: string | null;
  product_name: string | null;
  product_description: string | null;
  price_usdc: number | string | null;
  payment_slug: string | null;
};

export default async function PublicShopPage(props: PageProps<'/shop/[merchantId]'>) {
  const { merchantId } = await props.params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_shop_page', {
    target_merchant_id: merchantId,
  });

  if (error || !data?.[0]) {
    notFound();
  }

  const rows = data as PublicShopRow[];
  const shop = rows[0];
  const products = rows.filter((row) => row.product_id && row.payment_slug);

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-8">
          <p className="text-sm font-medium text-slate-500">STREAK公開ショップ</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {shop.public_site_headline || shop.store_name}
          </h1>
          <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {shop.public_site_description || shop.business_description || '販売者情報は各商品ページをご確認ください。'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {shop.website_url && (
              <a
                href={shop.website_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:border-slate-950"
              >
                公式サイト
              </a>
            )}
            <a
              href={`mailto:${shop.support_email ?? ''}`}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:border-slate-950"
            >
              問い合わせ
            </a>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">商品一覧</h2>
              <p className="mt-1 text-sm text-slate-500">購入したい商品を選んで決済ページへ進めます。</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500">
              現在公開中の商品はありません。
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <Link
                  key={product.product_id}
                  href={`/pay/${product.payment_slug}`}
                  className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-400"
                >
                  <h3 className="text-lg font-semibold text-slate-950">{product.product_name}</h3>
                  {product.product_description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {product.product_description}
                    </p>
                  )}
                  <p className="mt-4 text-xl font-semibold">
                    {Number(product.price_usdc).toFixed(6)} USDC
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <InfoCard title="決済方法" value={shop.accepted_payment_methods || 'Polygon USDC'} />
          <InfoCard title="提供時期" value={shop.delivery_timing || '決済確認後、販売者の案内に従って提供します。'} />
          <InfoCard title="問い合わせ" value={`${shop.support_email || '未設定'}\n${shop.support_hours || ''}`} />
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">事業者情報</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Detail label="ショップ名" value={shop.store_name} />
            <Detail label="法人名・屋号" value={shop.company_name || shop.store_name} />
            <Detail label="代表者" value={shop.representative_name || '未設定'} />
            <Detail label="所在地" value={shop.business_address || '未設定'} />
            <Detail label="販売条件" value={shop.sales_terms || '商品ページの表示内容をご確認ください。'} wide />
            <Detail label="返金・キャンセル" value={shop.refund_policy || '販売者へお問い合わせください。'} wide />
            <Detail
              label="購入前の注意事項"
              value={
                shop.review_notice ||
                'USDC決済では、ウォレット、ネットワーク、送金先アドレスを購入者自身で確認してください。'
              }
              wide
            />
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/terms" className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/tokushoho" className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
            特商法表記
          </Link>
        </footer>
      </div>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-950">{value}</p>
    </div>
  );
}

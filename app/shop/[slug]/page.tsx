import Link from "next/link";
import { notFound } from "next/navigation";
import { formatJpy, formatUsdc } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ShopPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata = {
  title: "ショップ | STREAK",
};

export default async function ShopPage({ params }: ShopPageProps) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase.from("shops").select("*").eq("slug", slug).single();

  if (!shop || shop.public_site_published === false) {
    notFound();
  }

  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, description, price_jpy, price_usdc")
    .eq("shop_id", shop.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  const products = productRows ?? [];
  const paymentNetwork = getPaymentNetwork(shop.payment_network);
  const jpyPerUsdc = Number(shop.jpy_per_usdc ?? 160);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-[#d8dee4] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-[#59636e]">
            <Link className="hover:text-[#1f2328]" href="/legal/usdc-risk">USDC決済の注意事項</Link>
            <Link className="hover:text-[#1f2328]" href="/legal/commercial">特商法表記</Link>
            <Link className="hover:text-[#1f2328]" href="/legal/privacy">プライバシー</Link>
          </nav>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#656d76]">
              STREAK PUBLIC SHOP
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {shop.public_site_headline || shop.name}
            </h1>
            <p className="mt-5 max-w-3xl whitespace-pre-wrap text-base leading-7 text-[#59636e]">
              {shop.public_site_description ||
                "商品を選択して注文を作成し、ウォレットからUSDCで支払います。代金は販売者のウォレットへ直接送金されます。"}
            </p>
          </div>

          <aside className="rounded-lg border border-[#d8dee4] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#656d76]">利用可能な決済方法</p>
            <p className="mt-2 text-lg font-semibold">{shop.accepted_payment_methods || paymentNetwork.label}</p>
            <p className="mt-3 text-sm leading-6 text-[#59636e]">
              決済モード: {paymentNetwork.modeLabel}
            </p>
            <p className="mt-1 text-sm text-[#656d76]">
              自動換算レート: 1 USDC = {formatJpy(jpyPerUsdc)}
            </p>
          </aside>
        </section>

        <section className="grid gap-4 pb-10">
          <div>
            <h2 className="text-2xl font-semibold">商品一覧</h2>
            <p className="mt-1 text-sm text-[#656d76]">商品を選択すると、詳細ページから決済へ進めます。</p>
          </div>

          {products.length ? (
            products.map((product) => {
              const priceJpy = Number(
                product.price_jpy ?? Math.round(Number(product.price_usdc ?? 0) * jpyPerUsdc),
              );

              return (
                <article
                  className="grid gap-5 rounded-lg border border-[#d8dee4] bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"
                  key={product.id}
                >
                  <div>
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    {product.description ? (
                      <p className="mt-2 text-sm leading-6 text-[#656d76]">
                        {product.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-lg font-semibold">{formatJpy(priceJpy)}</p>
                    <p className="mt-1 text-sm text-[#656d76]">
                      USDC決済額: {formatUsdc(product.price_usdc)} USDC
                    </p>
                  </div>
                  <Link
                    className="inline-flex h-12 items-center justify-center rounded-md bg-[#1f2328] px-6 text-sm font-semibold text-white"
                    href={`/product/${product.id}`}
                  >
                    商品詳細を見る
                  </Link>
                </article>
              );
            })
          ) : (
            <article className="rounded-lg border border-[#d8dee4] bg-white p-6 text-sm text-[#656d76]">
              現在、公開中の商品はありません。
            </article>
          )}
        </section>

        <section className="grid gap-4 pb-10 lg:grid-cols-3">
          <InfoCard title="提供時期" value={shop.delivery_timing || "決済確認後、販売者の案内に従って商品またはサービスを提供します。"} />
          <InfoCard title="返金・キャンセル" value={shop.refund_policy || "返金・キャンセル条件は販売者へお問い合わせください。"} />
          <InfoCard title="問い合わせ" value={`${shop.support_email || "未設定"}${shop.support_hours ? `\n${shop.support_hours}` : ""}`} />
        </section>

        <section className="mb-10 rounded-lg border border-[#d8dee4] bg-white p-6">
          <h2 className="text-xl font-semibold">事業者情報</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Detail label="ショップ名" value={shop.name} />
            <Detail label="法人名・屋号" value={shop.company_name || shop.name} />
            <Detail label="代表者" value={shop.representative_name || "未設定"} />
            <Detail label="所在地" value={shop.business_address || "未設定"} />
            <Detail label="販売条件・追加費用" value={shop.sales_terms || "表示価格、決済ネットワーク、ウォレット手数料をご確認ください。"} wide />
            <Detail
              label="購入前の注意事項"
              value={
                shop.review_notice ||
                "ウォレット、USDC、送金先アドレス、利用ネットワークを確認してから決済してください。"
              }
              wide
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#d8dee4] bg-white p-5">
      <p className="text-sm font-semibold text-[#656d76]">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{value}</p>
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <p className="text-sm font-semibold text-[#656d76]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{value}</p>
    </div>
  );
}

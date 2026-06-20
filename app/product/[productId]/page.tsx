import Link from "next/link";
import { notFound } from "next/navigation";
import { formatJpy, formatUsdc } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { productId } = await params;
  return {
    title: `商品詳細 | ${productId} | STREAK`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { productId } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, shops(*)")
    .eq("id", productId)
    .eq("active", true)
    .single();

  if (!product) {
    notFound();
  }

  const paymentNetwork = getPaymentNetwork(product.shops?.payment_network);
  const jpyPerUsdc = Number(product.shops?.jpy_per_usdc ?? 160);
  const priceJpy = Number(
    product.price_jpy ?? Math.round(Number(product.price_usdc ?? 0) * jpyPerUsdc),
  );

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d7d9ce] pb-5">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          {product.shops?.slug ? (
            <Link className="text-sm font-semibold underline" href={`/shop/${product.shops.slug}`}>
              ショップへ戻る
            </Link>
          ) : null}
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <article>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              商品詳細
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              {product.description || "商品の内容を確認してから購入手続きへ進んでください。"}
            </p>
          </article>

          <aside className="border border-[#d7d9ce] bg-white p-6 shadow-[0_24px_80px_rgba(23,26,22,0.08)]">
            <p className="text-sm font-semibold text-[#65705f]">価格</p>
            <p className="mt-2 text-3xl font-semibold">{formatJpy(priceJpy)}</p>
            <p className="mt-1 text-sm text-[#65705f]">
              USDC決済額: {formatUsdc(product.price_usdc)} USDC
            </p>
            <dl className="mt-5 grid gap-3 border-t border-[#edf0e8] pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">販売者</dt>
                <dd className="text-right font-medium">{product.shops?.name ?? "STREAK販売者"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">決済</dt>
                <dd className="text-right font-medium">{paymentNetwork.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">換算</dt>
                <dd className="text-right font-medium">1 USDC = {formatJpy(jpyPerUsdc)}</dd>
              </div>
            </dl>
            <Link
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white"
              href={`/pay/${product.id}`}
            >
              購入手続きへ進む
            </Link>
          </aside>
        </section>
      </section>
    </main>
  );
}

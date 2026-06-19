import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsdc } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ShopPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata = {
  title: "Shop | STREAK",
};

export default async function ShopPage({ params }: ShopPageProps) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, description, price_usdc")
    .eq("shop_id", shop.id)
    .eq("active", true)
    .order("created_at", { ascending: false });

  const products = productRows ?? [];
  const paymentNetwork = getPaymentNetwork(shop.payment_network);

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d7d9ce] pb-5">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <Link className="text-sm font-semibold underline" href="/legal/usdc-risk">
            USDC risk notice
          </Link>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              Select a product
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {shop.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              Choose a product, create an order, then pay with USDC from your
              wallet. Funds are sent directly to the merchant wallet.
            </p>
          </div>
          <aside className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm font-semibold text-[#65705f]">Payment mode</p>
            <p className="mt-2 text-lg font-semibold">{paymentNetwork.modeLabel}</p>
            <p className="mt-1 text-sm leading-6 text-[#4d5548]">{paymentNetwork.label}</p>
          </aside>
        </section>

        <section className="grid gap-4 pb-12">
          {products.length ? (
            products.map((product) => (
              <article
                className="grid gap-5 border border-[#d7d9ce] bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"
                key={product.id}
              >
                <div>
                  <h2 className="text-xl font-semibold">{product.name}</h2>
                  {product.description ? (
                    <p className="mt-2 text-sm leading-6 text-[#65705f]">
                      {product.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm font-semibold">
                    {formatUsdc(product.price_usdc)} USDC
                  </p>
                </div>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#171a16] px-6 text-sm font-semibold text-white"
                  href={`/pay/${product.id}`}
                >
                  Continue
                </Link>
              </article>
            ))
          ) : (
            <article className="border border-[#d7d9ce] bg-white p-6 text-sm text-[#65705f]">
              No active products yet.
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

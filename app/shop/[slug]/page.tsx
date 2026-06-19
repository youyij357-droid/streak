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
      <section className="mx-auto flex w-full max-w-5xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d7d9ce] pb-5">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <Link className="text-sm font-semibold underline" href="/legal/usdc-risk">
            USDC risk notice
          </Link>
        </header>

        <section className="py-12">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
            Public shop
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {shop.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
            Pay with Polygon USDC directly to the merchant wallet. STREAK records the
            order, but does not custody funds or reverse blockchain transactions.
          </p>
          <p className="mt-5 inline-flex border border-[#c3c7b9] bg-white px-3 py-1 text-sm font-semibold">
            {paymentNetwork.modeLabel}: {paymentNetwork.label}
          </p>
        </section>

        <section className="grid gap-4 pb-12">
          {products.length ? (
            products.map((product) => (
              <article
                className="grid gap-4 border border-[#d7d9ce] bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"
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
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white"
                  href={`/pay/${product.id}`}
                >
                  Pay with USDC
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsdc } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "./actions";

type PayPageProps = {
  params: Promise<{
    productId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function PayPage({ params, searchParams }: PayPageProps) {
  const { productId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, shops(name, slug, wallet_address)")
    .eq("id", productId)
    .eq("active", true)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <p className="mt-12 font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
            USDC payment link
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">
            {product.name}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#4d5548]">
            {product.description ||
              "Create an order, then complete payment with Polygon USDC."}
          </p>
          <p className="mt-8 text-4xl font-semibold">
            {formatUsdc(product.price_usdc)} USDC
          </p>
          <p className="mt-3 text-sm text-[#65705f]">
            Merchant: {product.shops?.name ?? "STREAK merchant"}
          </p>
        </div>

        <section className="border border-[#d7d9ce] bg-white p-6 shadow-[0_24px_80px_rgba(23,26,22,0.08)]">
          <h2 className="text-2xl font-semibold">Create order</h2>
          {query.error ? (
            <p className="mt-4 border border-[#e7b8a7] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
              {query.error}
            </p>
          ) : null}
          <form action={createOrder} className="mt-6 grid gap-4">
            <input name="product_id" type="hidden" value={product.id} />
            <input name="shop_id" type="hidden" value={product.shop_id} />
            <input name="amount_usdc" type="hidden" value={product.price_usdc} />
            <label className="grid gap-2 text-sm font-medium">
              Buyer email
              <input
                className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                name="buyer_email"
                placeholder="buyer@example.com"
                type="email"
              />
            </label>
            <div className="border border-[#edf0e8] bg-[#fbfcf7] p-4 text-sm leading-6 text-[#4d5548]">
              Payment wallet:{" "}
              <span className="break-all font-mono">
                {product.shops?.wallet_address || "Merchant wallet not set yet"}
              </span>
            </div>
            <button className="h-12 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
              Create pending order
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

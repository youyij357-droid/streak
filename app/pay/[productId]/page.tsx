import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsdc } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";
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

const errorMessages: Record<string, string> = {
  "invalid-order": "Order could not be created. Please check the product and try again.",
};

export default async function PayPage({ params, searchParams }: PayPageProps) {
  const { productId } = await params;
  const query = await searchParams;
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

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d7d9ce] pb-5">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <Link className="text-sm font-semibold underline" href="/legal/usdc-risk">
            USDC risk notice
          </Link>
        </header>

        <div className="grid flex-1 gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              Checkout
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              {product.description ||
                "Review the order, then continue to wallet payment."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Create order", "Connect wallet", "Pay and verify"].map((step, index) => (
                <div className="border border-[#d7d9ce] bg-white p-4" key={step}>
                  <p className="font-mono text-xs text-[#65705f]">0{index + 1}</p>
                  <p className="mt-3 text-sm font-semibold">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border border-[#d7d9ce] bg-white p-5 text-sm leading-6 text-[#4d5548]">
              <p className="font-semibold text-[#171a16]">Before paying</p>
              <p className="mt-2">
                Confirm the network and merchant wallet. Blockchain transactions
                cannot be reversed after they are submitted.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link className="font-semibold underline" href="/legal/usdc-risk">
                  Risk details
                </Link>
                <Link className="font-semibold underline" href="/legal/terms">
                  Terms
                </Link>
              </div>
            </div>
          </section>

          <section className="border border-[#d7d9ce] bg-white p-6 shadow-[0_24px_80px_rgba(23,26,22,0.08)]">
            <h2 className="text-2xl font-semibold">Order summary</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Merchant</dt>
                <dd className="text-right font-medium">
                  {product.shops?.name ?? "STREAK merchant"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Network</dt>
                <dd className="text-right font-medium">{paymentNetwork.label}</dd>
              </div>
              <div className="border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Merchant wallet</dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {product.shops?.wallet_address || "Merchant wallet not set yet"}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4">
                <dt className="text-[#65705f]">Total</dt>
                <dd className="text-3xl font-semibold">
                  {formatUsdc(product.price_usdc)} USDC
                </dd>
              </div>
            </dl>

          {query.error ? (
            <p className="mt-4 border border-[#e7b8a7] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
              {errorMessages[query.error] ?? query.error}
            </p>
          ) : null}

          <form action={createOrder} className="mt-6 grid gap-4">
            <input name="product_id" type="hidden" value={product.id} />
            <input name="shop_id" type="hidden" value={product.shop_id} />
            <input name="amount_usdc" type="hidden" value={product.price_usdc} />
            <input
              name="payment_network"
              type="hidden"
              value={product.shops?.payment_network ?? "polygon_mainnet"}
            />
            <label className="grid gap-2 text-sm font-medium">
              Buyer email
              <input
                className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                name="buyer_email"
                placeholder="buyer@example.com"
                type="email"
              />
            </label>
            <button className="h-12 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
              Continue to wallet payment
            </button>
          </form>
          </section>
        </div>
      </section>
    </main>
  );
}

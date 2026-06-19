import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsdc } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";
import { createClient } from "@/lib/supabase/server";
import { submitPaymentTxHash } from "./actions";
import { WalletPayment } from "./WalletPayment";

type ThanksPageProps = {
  params: Promise<{
    productId: string;
  }>;
  searchParams: Promise<{
    order?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function ThanksPage({ params, searchParams }: ThanksPageProps) {
  const { productId } = await params;
  const { order: orderId, error, success } = await searchParams;

  if (!orderId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, products(name), shops(*)")
    .eq("id", orderId)
    .eq("product_id", productId)
    .single();

  if (!order) {
    notFound();
  }

  const paymentNetwork = getPaymentNetwork(order.payment_network ?? order.shops?.payment_network);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f3] px-6 text-[#171a16]">
      <section className="w-full max-w-2xl border border-[#d7d9ce] bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
          Order created
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Pending payment</h1>
        <p className="mt-4 text-sm leading-6 text-[#4d5548]">
          Send {formatUsdc(order.amount_usdc)} {paymentNetwork.label} to the merchant
          wallet below. The merchant can mark the order as paid from the admin
          dashboard after confirming the transaction.
        </p>
        <dl className="mt-6 grid gap-3 text-sm">
          <div className="border-b border-[#edf0e8] pb-3">
            <dt className="text-[#65705f]">Order ID</dt>
            <dd className="mt-1 break-all font-mono">{order.id}</dd>
          </div>
          <div className="border-b border-[#edf0e8] pb-3">
            <dt className="text-[#65705f]">Product</dt>
            <dd className="mt-1 font-medium">{order.products?.name}</dd>
          </div>
          <div>
            <dt className="text-[#65705f]">Network</dt>
            <dd className="mt-1 font-medium">{paymentNetwork.label}</dd>
          </div>
          <div>
            <dt className="text-[#65705f]">Wallet</dt>
            <dd className="mt-1 break-all font-mono">
              {order.shops?.wallet_address || "Merchant wallet not set yet"}
            </dd>
          </div>
        </dl>
        {error ? (
          <p className="mt-5 border border-[#e7b8a7] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-5 border border-[#b8d8b5] bg-[#f1faef] p-3 text-sm font-medium text-[#176b32]">
            Transaction hash was saved. The merchant will confirm payment.
          </p>
        ) : null}
        <form action={submitPaymentTxHash}>
          <input name="product_id" type="hidden" value={productId} />
          <input name="order_id" type="hidden" value={order.id} />
          <WalletPayment
            amountUsdc={String(order.amount_usdc)}
            initialTxHash={order.payment_tx_hash ?? ""}
            merchantWallet={order.shops?.wallet_address ?? ""}
            onTxHashName="payment_tx_hash"
            paymentNetwork={order.payment_network ?? order.shops?.payment_network}
          />
          <button className="mt-4 h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
            Save transaction hash
          </button>
        </form>
        <Link
          className="mt-8 inline-flex h-11 items-center rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white"
          href={`/pay/${productId}`}
        >
          Back to product
        </Link>
      </section>
    </main>
  );
}

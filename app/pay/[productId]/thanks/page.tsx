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

const errorMessages: Record<string, string> = {
  "invalid-tx-hash":
    "Transaction hash must start with 0x and contain 64 hexadecimal characters. Do not paste the merchant wallet address here.",
  "merchant-wallet-missing": "The merchant wallet is not set. Please contact the merchant.",
  "order-not-found": "Order was not found. Please create a new order.",
  "tx-failed": "This transaction failed on-chain. Please submit a successful transaction.",
  "tx-hash-required": "Enter the transaction hash from MetaMask after submitting payment.",
  "tx-not-found-or-pending":
    "This transaction was not found on the selected network yet. Check the network or wait a few minutes and try again.",
  "tx-usdc-transfer-not-found":
    "This transaction does not match the order. Confirm the network, recipient wallet, token, and amount.",
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
            {errorMessages[error] ?? error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-5 border border-[#b8d8b5] bg-[#f1faef] p-3 text-sm font-medium text-[#176b32]">
            {success === "payment-verified"
              ? "Payment was verified on-chain and the order was marked as paid."
              : "Transaction hash was saved. The merchant will confirm payment."}
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

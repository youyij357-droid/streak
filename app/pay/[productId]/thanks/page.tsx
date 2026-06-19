import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUsdc, isTransactionHash } from "@/lib/format";
import { getPaymentNetwork, paymentNetworkExplorerTxUrl } from "@/lib/payment-networks";
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
  const isPaid = order.status === "paid";

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-8 text-[#171a16]">
      <section className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between border-b border-[#d7d9ce] pb-5">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <Link className="text-sm font-semibold underline" href={`/pay/${productId}`}>
            Back to product
          </Link>
        </header>

        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              {isPaid ? "Payment complete" : "Payment required"}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {isPaid ? "Payment verified" : "Complete payment with your wallet"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              {isPaid
                ? "The transaction was verified on-chain and this order is marked as paid."
                : `Send ${formatUsdc(order.amount_usdc)} ${paymentNetwork.label} to the merchant wallet. STREAK verifies the transaction before marking the order as paid.`}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Order created", true],
                ["2", "Wallet payment", isPaid],
                ["3", "Verified", isPaid],
              ].map(([number, label, done]) => (
                <div
                  className={`border p-4 ${
                    done
                      ? "border-[#b8d8b5] bg-[#f1faef]"
                      : "border-[#d7d9ce] bg-white"
                  }`}
                  key={String(label)}
                >
                  <p className="font-mono text-xs text-[#65705f]">0{number}</p>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">Order summary</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Product</dt>
                <dd className="mt-1 font-medium">{order.products?.name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Status</dt>
                <dd className="font-semibold">{order.status}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Network</dt>
                <dd className="text-right font-medium">{paymentNetwork.label}</dd>
              </div>
              <div className="border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Merchant wallet</dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {order.shops?.wallet_address || "Merchant wallet not set yet"}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4">
                <dt className="text-[#65705f]">Total</dt>
                <dd className="text-3xl font-semibold">
                  {formatUsdc(order.amount_usdc)} USDC
                </dd>
              </div>
            </dl>
            <p className="mt-5 break-all font-mono text-xs text-[#65705f]">
              Order ID: {order.id}
            </p>
          </aside>
        </div>

        {error ? (
          <p className="border border-[#e7b8a7] bg-[#fff4ef] p-4 text-sm font-medium text-[#8c2f16]">
            {errorMessages[error] ?? error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 border border-[#b8d8b5] bg-[#f1faef] p-4 text-sm font-medium text-[#176b32]">
            {success === "payment-verified"
              ? "Payment was verified on-chain and the order was marked as paid."
              : "Transaction hash was saved. The merchant will confirm payment."}
          </p>
        ) : null}

        {isPaid ? (
          <section className="mt-6 border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-xl font-semibold">Verified transaction</h2>
            {isTransactionHash(order.payment_tx_hash) ? (
              <a
                className="mt-4 inline-flex h-11 items-center rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white"
                href={paymentNetworkExplorerTxUrl(order.payment_network, order.payment_tx_hash)}
              >
                View on explorer
              </a>
            ) : null}
          </section>
        ) : (
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
        )}
      </section>
    </main>
  );
}

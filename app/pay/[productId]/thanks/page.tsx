import Link from "next/link";
import { notFound } from "next/navigation";
import { formatJpy, formatUsdc, isTransactionHash } from "@/lib/format";
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
  "invalid-tx-hash": "Tx hashは0xから始まる64文字の英数字です。",
  "merchant-wallet-missing": "受取ウォレットが設定されていません。販売者へお問い合わせください。",
  "order-not-found": "注文が見つかりません。もう一度注文を作成してください。",
  "tx-failed": "この取引はブロックチェーン上で失敗しています。",
  "tx-hash-required": "MetaMaskで送金後に発行されるTx hashを入力してください。",
  "tx-not-found-or-pending":
    "選択中のネットワークでこの取引が見つかりません。ネットワークを確認するか、数分待って再度お試しください。",
  "tx-usdc-transfer-not-found":
    "この取引は注文の送金先・トークン・金額と一致しません。",
};

const statusLabels: Record<string, string> = {
  cancelled: "キャンセル",
  expired: "期限切れ",
  paid: "支払い済み",
  pending: "未払い",
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
            商品ページへ戻る
          </Link>
        </header>

        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              {isPaid ? "支払い完了" : "支払い待ち"}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {isPaid ? "支払いが確認されました" : "ウォレットで支払いを完了してください"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              {isPaid
                ? "ブロックチェーン上で取引を確認し、この注文を支払い済みにしました。"
                : `${formatJpy(order.amount_jpy ?? 0)}を、${paymentNetwork.label}で支払います。送金後、STREAKが取引内容を自動確認します。`}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "注文作成", true],
                ["2", "ウォレット支払い", isPaid],
                ["3", "自動確認", isPaid],
              ].map(([number, label, done]) => (
                <div
                  className={`border p-4 ${
                    done ? "border-[#b8d8b5] bg-[#f1faef]" : "border-[#d7d9ce] bg-white"
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
            <h2 className="text-2xl font-semibold">注文内容</h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <div className="border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">商品</dt>
                <dd className="mt-1 font-medium">{order.products?.name}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">ステータス</dt>
                <dd className="font-semibold">{statusLabels[order.status] ?? order.status}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">ネットワーク</dt>
                <dd className="text-right font-medium">{paymentNetwork.label}</dd>
              </div>
              <div className="border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">受取ウォレット</dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {order.shops?.wallet_address || "受取ウォレット未設定"}
                </dd>
              </div>
              <div className="flex items-end justify-between gap-4">
                <dt className="text-[#65705f]">支払い金額</dt>
                <dd className="text-right">
                  <p className="text-3xl font-semibold">{formatJpy(order.amount_jpy ?? 0)}</p>
                  <p className="mt-1 text-sm text-[#65705f]">
                    {formatUsdc(order.amount_usdc)} USDC
                  </p>
                </dd>
              </div>
            </dl>
            <p className="mt-5 break-all font-mono text-xs text-[#65705f]">
              注文ID: {order.id}
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
              ? "支払いをブロックチェーン上で確認し、注文を支払い済みにしました。"
              : "Tx hashを保存しました。販売者が支払いを確認します。"}
          </p>
        ) : null}

        {isPaid ? (
          <section className="mt-6 border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-xl font-semibold">確認済みの取引</h2>
            {isTransactionHash(order.payment_tx_hash) ? (
              <a
                className="mt-4 inline-flex h-11 items-center rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white"
                href={paymentNetworkExplorerTxUrl(order.payment_network, order.payment_tx_hash)}
              >
                エクスプローラーで確認
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

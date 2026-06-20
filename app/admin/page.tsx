import Link from "next/link";
import { redirect } from "next/navigation";
import { formatJpy, formatUsdc, isTransactionHash, isWalletAddress } from "@/lib/format";
import { getPaymentNetwork, paymentNetworkExplorerTxUrl } from "@/lib/payment-networks";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAdmin } from "./login/actions";
import {
  createProduct,
  createShop,
  toggleProduct,
  updateOrderStatus,
  updateProduct,
  updateShop,
} from "./actions";
import { CopyPathButton } from "./CopyPathButton";

export const metadata = {
  title: "管理画面 | STREAK",
};

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "order-updated": "注文を更新しました。",
  "product-created": "商品を作成しました。",
  "product-updated": "商品を保存しました。",
  "shop-created": "店舗を作成しました。",
  "shop-updated": "店舗設定を保存しました。",
};

const errorMessages: Record<string, string> = {
  "exchange-rate-required": "為替レートを正しく入力してください。",
  "invalid-tx-hash": "Tx hashは0xから始まる64文字の英数字です。",
  "merchant-wallet-missing": "受取ウォレットが設定されていません。",
  "order-not-found": "注文が見つかりません。",
  "order-status-required": "注文ステータスを正しく選択してください。",
  "tx-failed": "この取引はブロックチェーン上で失敗しています。",
  "tx-not-found-or-pending":
    "選択中のネットワークでこの取引が見つかりません。ネットワークを確認するか、数分待ってください。",
  "tx-usdc-transfer-not-found": "この取引は注文の送金先・トークン・金額と一致しません。",
};

const statusLabels: Record<string, string> = {
  cancelled: "キャンセル",
  expired: "期限切れ",
  paid: "支払い済み",
  pending: "未払い",
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=supabase-env-missing");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: shopRows, error: shopsError } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: true });
  const shops = shopRows ?? [];
  const activeShop = shops[0] ?? null;

  const { data: productRows, error: productsError } = activeShop
    ? await supabase
        .from("products")
        .select("*")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const products = productRows ?? [];

  const { data: orderRows, error: ordersError } = activeShop
    ? await supabase
        .from("orders")
        .select("*, products(name)")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };
  const orders = orderRows ?? [];

  const paidTotal = orders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + Number(order.amount_usdc ?? 0), 0);
  const activeNetwork = getPaymentNetwork(activeShop?.payment_network);
  const jpyPerUsdc = Number(activeShop?.jpy_per_usdc ?? 160);

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-4 border-b border-[#d7d9ce] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
              STREAK
            </Link>
            <p className="mt-2 text-sm text-[#65705f]">管理画面</p>
          </div>
          <form action={signOutAdmin}>
            <button className="inline-flex h-11 items-center justify-center rounded-md border border-[#c3c7b9] px-5 text-sm font-semibold transition hover:border-[#171a16]">
              ログアウト
            </button>
          </form>
        </header>

        {params.error ? (
          <p className="mt-6 border border-[#e7b8a7] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
            {errorMessages[params.error] ?? params.error}
          </p>
        ) : null}

        {params.success ? (
          <p className="mt-6 border border-[#b8d8b5] bg-[#f1faef] p-3 text-sm font-medium text-[#176b32]">
            {successMessages[params.success] ?? "保存しました。"}
          </p>
        ) : null}

        {shopsError || productsError || ordersError ? (
          <section className="mt-6 border border-[#e7b8a7] bg-[#fff4ef] p-4 text-sm text-[#8c2f16]">
            <p className="font-semibold">データベース読み込みエラー</p>
            <ul className="mt-2 grid gap-1">
              {shopsError ? <li>shops: {shopsError.message}</li> : null}
              {productsError ? <li>products: {productsError.message}</li> : null}
              {ordersError ? <li>orders: {ordersError.message}</li> : null}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-4 py-8 md:grid-cols-4">
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">店舗</p>
            <p className="mt-3 text-2xl font-semibold">{shops.length}</p>
          </article>
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">商品</p>
            <p className="mt-3 text-2xl font-semibold">{products.length}</p>
          </article>
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">注文</p>
            <p className="mt-3 text-2xl font-semibold">{orders.length}</p>
          </article>
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">支払い済みUSDC</p>
            <p className="mt-3 text-2xl font-semibold">{formatUsdc(paidTotal)}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="border border-[#d7d9ce] bg-white p-6">
            <h1 className="text-2xl font-semibold">店舗設定</h1>
            {activeShop ? (
              <form action={updateShop} className="mt-5 grid gap-4">
                <input name="shop_id" type="hidden" value={activeShop.id} />
                <label className="grid gap-2 text-sm font-medium">
                  店舗名
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.name}
                    name="name"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  受取ウォレット
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.wallet_address ?? ""}
                    name="wallet_address"
                    placeholder="0x..."
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  決済ネットワーク
                  <select
                    className="h-11 border border-[#c3c7b9] bg-white px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.payment_network ?? "polygon_mainnet"}
                    name="payment_network"
                  >
                    <option value="polygon_mainnet">本番 - Polygon USDC</option>
                    <option value="polygon_amoy">テスト - Polygon Amoy USDC</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  為替レート（1 USDC = 何円）
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.jpy_per_usdc ?? 160}
                    min="1"
                    name="jpy_per_usdc"
                    step="0.000001"
                    type="number"
                    required
                  />
                </label>
                <p className="text-sm font-medium text-[#65705f]">
                  現在のモード: {activeNetwork.modeLabel}
                </p>
                <p className="text-sm text-[#65705f]">
                  公開ショップID: <span className="font-mono">{activeShop.slug}</span>
                </p>
                <Link className="inline-flex text-sm font-semibold underline" href={`/shop/${activeShop.slug}`}>
                  公開ショップを開く
                </Link>
                <CopyPathButton label="公開ショップリンクをコピー" path={`/shop/${activeShop.slug}`} />
                <button className="h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
                  店舗設定を保存
                </button>
              </form>
            ) : (
              <form action={createShop} className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  店舗名
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="name"
                    placeholder="STREAK demo shop"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  公開ショップID
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="slug"
                    placeholder="streak-demo"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  受取ウォレット
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="wallet_address"
                    placeholder="0x..."
                  />
                </label>
                <button className="h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
                  店舗を作成
                </button>
              </form>
            )}
          </article>

          <article className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">商品を作成</h2>
            {activeShop ? (
              <form action={createProduct} className="mt-5 grid gap-4 md:grid-cols-2">
                <input name="shop_id" type="hidden" value={activeShop.id} />
                <label className="grid gap-2 text-sm font-medium">
                  商品名
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="name"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  価格（円）
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    min="1"
                    name="price_jpy"
                    step="1"
                    type="number"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium md:col-span-2">
                  商品説明
                  <textarea
                    className="min-h-24 border border-[#c3c7b9] p-3 outline-none focus:border-[#171a16]"
                    name="description"
                  />
                </label>
                <p className="text-sm text-[#65705f] md:col-span-2">
                  保存時に {formatJpy(jpyPerUsdc)} = 1 USDC として決済額を換算します。
                </p>
                <button className="h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white md:col-span-2">
                  商品を作成
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-[#65705f]">先に店舗を作成してください。</p>
            )}
          </article>
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_1fr]">
          <article className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">商品一覧</h2>
            <div className="mt-5 grid gap-3">
              {products.length ? (
                products.map((product) => (
                  <div className="grid gap-4 border border-[#edf0e8] p-4" key={product.id}>
                    <form action={updateProduct} className="grid gap-3">
                      <input name="product_id" type="hidden" value={product.id} />
                      <label className="grid gap-2 text-sm font-medium">
                        商品名
                        <input
                          className="h-10 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                          defaultValue={product.name}
                          name="name"
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        価格（円）
                        <input
                          className="h-10 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                          defaultValue={
                            product.price_jpy ??
                            Math.round(Number(product.price_usdc ?? 0) * jpyPerUsdc)
                          }
                          min="1"
                          name="price_jpy"
                          step="1"
                          type="number"
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        商品説明
                        <textarea
                          className="min-h-20 border border-[#c3c7b9] p-3 outline-none focus:border-[#171a16]"
                          defaultValue={product.description ?? ""}
                          name="description"
                        />
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid gap-2 text-sm text-[#65705f]">
                          <span>{product.active ? "公開中" : "非公開"}</span>
                          <span>
                            {formatJpy(product.price_jpy ?? 0)} / 決済額{" "}
                            {formatUsdc(product.price_usdc)} USDC
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              className="inline-flex h-10 items-center rounded-md border border-[#c3c7b9] px-4 font-semibold text-[#171a16]"
                              href={`/pay/${product.id}`}
                            >
                              決済ページを開く
                            </Link>
                            <CopyPathButton path={`/pay/${product.id}`} />
                          </div>
                        </div>
                        <button className="h-10 rounded-md bg-[#171a16] px-4 text-sm font-semibold text-white">
                          商品を保存
                        </button>
                      </div>
                    </form>
                    <form action={toggleProduct}>
                      <input name="product_id" type="hidden" value={product.id} />
                      <input name="active" type="hidden" value={product.active ? "false" : "true"} />
                      <button className="h-10 rounded-md border border-[#c3c7b9] px-4 text-sm font-semibold">
                        {product.active ? "非公開にする" : "公開する"}
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#65705f]">商品はまだありません。</p>
              )}
            </div>
          </article>

          <article className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">注文一覧</h2>
            <div className="mt-5 grid gap-3">
              {orders.length ? (
                orders.map((order) => (
                  <form action={updateOrderStatus} className="grid gap-3 border border-[#edf0e8] p-4" key={order.id}>
                    <input name="order_id" type="hidden" value={order.id} />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold">{order.products?.name ?? "削除済み商品"}</h3>
                        <p className="mt-1 text-sm text-[#65705f]">
                          {order.amount_jpy ? `${formatJpy(order.amount_jpy)} / ` : ""}
                          {formatUsdc(order.amount_usdc)} USDC ・{" "}
                          {statusLabels[order.status] ?? order.status}
                        </p>
                        <p className="mt-1 text-xs text-[#65705f]">
                          {order.buyer_email || "購入者メールなし"}
                        </p>
                      </div>
                      <select
                        className="h-10 border border-[#c3c7b9] bg-white px-3 text-sm"
                        defaultValue={order.status}
                        name="status"
                      >
                        <option value="pending">未払い</option>
                        <option value="paid">支払い済み</option>
                        <option value="expired">期限切れ</option>
                        <option value="cancelled">キャンセル</option>
                      </select>
                    </div>
                    <input
                      className="h-10 border border-[#c3c7b9] px-3 text-sm outline-none focus:border-[#171a16]"
                      defaultValue={order.payment_tx_hash ?? ""}
                      name="payment_tx_hash"
                      placeholder="Tx hash"
                    />
                    {isTransactionHash(order.payment_tx_hash) ? (
                      <a
                        className="inline-flex break-all text-xs font-semibold underline"
                        href={paymentNetworkExplorerTxUrl(
                          order.payment_network ?? activeShop?.payment_network,
                          order.payment_tx_hash,
                        )}
                      >
                        エクスプローラーで確認
                      </a>
                    ) : order.payment_tx_hash ? (
                      <p className="text-xs font-medium text-[#8c2f16]">
                        {isWalletAddress(order.payment_tx_hash)
                          ? "これはウォレットアドレスです。削除して、支払い後のTx hashを保存してください。"
                          : "保存されている値は正しいTx hashではありません。"}
                      </p>
                    ) : null}
                    <button className="h-10 rounded-md bg-[#171a16] px-4 text-sm font-semibold text-white">
                      注文を更新
                    </button>
                  </form>
                ))
              ) : (
                <p className="text-sm text-[#65705f]">注文はまだありません。</p>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

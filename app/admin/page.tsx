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
    "選択中のネットワークでこの取引が見つかりません。ネットワークを確認するか、少し待ってから再確認してください。",
  "tx-usdc-transfer-not-found": "この取引は注文の送金先、トークン、金額と一致しません。",
};

const statusLabels: Record<string, string> = {
  cancelled: "キャンセル",
  expired: "期限切れ",
  paid: "支払い済み",
  pending: "未払い",
};

const fieldClassName =
  "h-10 w-full rounded-md border border-[#d8dee4] bg-white px-3 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";
const textareaClassName =
  "min-h-20 w-full rounded-md border border-[#d8dee4] bg-white p-3 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";

function statusBadgeClassName(status: string) {
  if (status === "paid") return "bg-[#e9f8ef] text-[#176b32]";
  if (status === "pending") return "bg-[#fff7e6] text-[#8a5a00]";
  return "bg-[#f1f3f5] text-[#59636e]";
}

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
    : { data: [], error: null };
  const products = productRows ?? [];

  const { data: orderRows, error: ordersError } = activeShop
    ? await supabase
        .from("orders")
        .select("*, products(name)")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [], error: null };
  const orders = orderRows ?? [];

  const paidOrders = orders.filter((order) => order.status === "paid");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const paidTotal = paidOrders.reduce((sum, order) => sum + Number(order.amount_usdc ?? 0), 0);
  const activeNetwork = getPaymentNetwork(activeShop?.payment_network);
  const jpyPerUsdc = Number(activeShop?.jpy_per_usdc ?? 160);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#d8dee4] bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="block text-lg font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <p className="mt-1 text-xs text-[#656d76]">管理コンソール</p>
          <nav className="mt-8 grid gap-1 text-sm font-medium">
            <a className="rounded-md bg-[#f0f3ff] px-3 py-2 text-[#3431a8]" href="#overview">
              概要
            </a>
            <a className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="#products">
              商品
            </a>
            <a className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="#orders">
              注文
            </a>
            <a className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="#settings">
              店舗設定
            </a>
          </nav>
          {activeShop ? (
            <div className="mt-8 border-t border-[#d8dee4] pt-5 text-xs text-[#656d76]">
              <p className="font-semibold text-[#1f2328]">{activeShop.name}</p>
              <p className="mt-2 break-all">/{activeShop.slug}</p>
              <p className="mt-2">{activeNetwork.label}</p>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#d8dee4] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">ダッシュボード</h1>
                <p className="mt-1 text-sm text-[#656d76]">
                  商品、決済URL、注文ステータスを管理します。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeShop ? (
                  <>
                    <Link
                      className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]"
                      href={`/shop/${activeShop.slug}`}
                    >
                      公開ショップ
                    </Link>
                    <CopyPathButton label="ショップURLをコピー" path={`/shop/${activeShop.slug}`} />
                  </>
                ) : null}
                <form action={signOutAdmin}>
                  <button className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]">
                    ログアウト
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="grid gap-6 px-5 py-6 sm:px-8">
            {params.error ? (
              <p className="rounded-md border border-[#ffd2c2] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
                {errorMessages[params.error] ?? params.error}
              </p>
            ) : null}

            {params.success ? (
              <p className="rounded-md border border-[#b8d8b5] bg-[#f1faef] p-3 text-sm font-medium text-[#176b32]">
                {successMessages[params.success] ?? "保存しました。"}
              </p>
            ) : null}

            {shopsError || productsError || ordersError ? (
              <section className="rounded-md border border-[#ffd2c2] bg-[#fff4ef] p-4 text-sm text-[#8c2f16]">
                <p className="font-semibold">データベース読み込みエラー</p>
                <ul className="mt-2 grid gap-1">
                  {shopsError ? <li>shops: {shopsError.message}</li> : null}
                  {productsError ? <li>products: {productsError.message}</li> : null}
                  {ordersError ? <li>orders: {ordersError.message}</li> : null}
                </ul>
              </section>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" id="overview">
              {[
                ["売上", `${formatUsdc(paidTotal)} USDC`, `${paidOrders.length}件の支払い済み注文`],
                ["未払い注文", String(pendingOrders.length), "確認待ちの注文"],
                ["商品", String(products.length), "公開/非公開の商品数"],
                ["換算レート", `1 USDC = ${formatJpy(jpyPerUsdc)}`, activeNetwork.modeLabel],
              ].map(([label, value, note]) => (
                <article className="rounded-lg border border-[#d8dee4] bg-white p-5" key={label}>
                  <p className="text-sm font-medium text-[#656d76]">{label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-2 text-xs text-[#656d76]">{note}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="grid gap-6">
                <section className="rounded-lg border border-[#d8dee4] bg-white" id="products">
                  <div className="flex flex-col gap-3 border-b border-[#d8dee4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold">商品</h2>
                      <p className="mt-1 text-sm text-[#656d76]">
                        商品ごとに決済URLが自動生成されます。
                      </p>
                    </div>
                    {activeShop ? (
                      <CopyPathButton label="ショップURLをコピー" path={`/shop/${activeShop.slug}`} />
                    ) : null}
                  </div>

                  {products.length ? (
                    <div className="divide-y divide-[#edf0f2]">
                      <div className="hidden grid-cols-[1.4fr_150px_90px_220px_84px] gap-4 bg-[#f6f8fa] px-5 py-3 text-xs font-semibold text-[#656d76] xl:grid">
                        <span>商品</span>
                        <span>価格</span>
                        <span>状態</span>
                        <span>決済URL</span>
                        <span className="text-right">操作</span>
                      </div>
                      {products.map((product) => {
                        const paymentPath = `/pay/${product.id}`;
                        const displayPriceJpy = Number(
                          product.price_jpy ??
                            Math.round(Number(product.price_usdc ?? 0) * jpyPerUsdc),
                        );

                        return (
                          <div className="grid gap-4 px-5 py-4" key={product.id}>
                            <form
                              action={updateProduct}
                              className="grid gap-4 xl:grid-cols-[1.4fr_150px_90px_220px_84px] xl:items-start"
                            >
                              <input name="product_id" type="hidden" value={product.id} />
                              <div className="grid gap-2">
                                <input
                                  className={fieldClassName}
                                  defaultValue={product.name}
                                  name="name"
                                  required
                                />
                                <textarea
                                  className={textareaClassName}
                                  defaultValue={product.description ?? ""}
                                  name="description"
                                  placeholder="商品説明"
                                />
                              </div>
                              <div className="grid gap-2">
                                <input
                                  className={fieldClassName}
                                  defaultValue={displayPriceJpy}
                                  min="1"
                                  name="price_jpy"
                                  step="1"
                                  type="number"
                                  required
                                />
                                <p className="text-xs text-[#656d76]">
                                  {formatUsdc(product.price_usdc)} USDC
                                </p>
                              </div>
                              <span
                                className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  product.active
                                    ? "bg-[#e9f8ef] text-[#176b32]"
                                    : "bg-[#f1f3f5] text-[#59636e]"
                                }`}
                              >
                                {product.active ? "公開中" : "非公開"}
                              </span>
                              <div className="grid gap-2">
                                <p className="truncate font-mono text-xs text-[#59636e]">{paymentPath}</p>
                                <div className="flex flex-wrap gap-2">
                                  <Link
                                    className="inline-flex h-9 items-center rounded-md border border-[#d8dee4] px-3 text-xs font-semibold hover:bg-[#f6f8fa]"
                                    href={paymentPath}
                                  >
                                    開く
                                  </Link>
                                  <CopyPathButton label="コピー" path={paymentPath} />
                                </div>
                              </div>
                              <button className="h-9 rounded-md bg-[#635bff] px-3 text-xs font-semibold text-white xl:justify-self-end">
                                保存
                              </button>
                            </form>
                            <form action={toggleProduct} className="xl:ml-auto">
                              <input name="product_id" type="hidden" value={product.id} />
                              <input name="active" type="hidden" value={product.active ? "false" : "true"} />
                              <button className="h-9 rounded-md border border-[#d8dee4] px-3 text-xs font-semibold hover:bg-[#f6f8fa]">
                                {product.active ? "非公開にする" : "公開する"}
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-sm text-[#656d76]">
                      商品はまだありません。右側のフォームから作成すると、決済URLが自動生成されます。
                    </p>
                  )}
                </section>

                <section className="rounded-lg border border-[#d8dee4] bg-white" id="orders">
                  <div className="border-b border-[#d8dee4] px-5 py-4">
                    <h2 className="text-base font-semibold">注文</h2>
                    <p className="mt-1 text-sm text-[#656d76]">直近30件の注文とTx hashを確認できます。</p>
                  </div>
                  {orders.length ? (
                    <div className="divide-y divide-[#edf0f2]">
                      <div className="hidden grid-cols-[1.2fr_180px_110px_1.2fr_74px] gap-4 bg-[#f6f8fa] px-5 py-3 text-xs font-semibold text-[#656d76] xl:grid">
                        <span>注文</span>
                        <span>金額</span>
                        <span>状態</span>
                        <span>Tx hash</span>
                        <span className="text-right">更新</span>
                      </div>
                      {orders.map((order) => (
                        <form
                          action={updateOrderStatus}
                          className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_180px_110px_1.2fr_74px] xl:items-start"
                          key={order.id}
                        >
                          <input name="order_id" type="hidden" value={order.id} />
                          <div>
                            <p className="font-medium">{order.products?.name ?? "削除済み商品"}</p>
                            <p className="mt-1 text-xs text-[#656d76]">
                              {order.buyer_email || "購入者メールなし"}
                            </p>
                          </div>
                          <p className="text-sm font-medium">
                            {order.amount_jpy ? `${formatJpy(order.amount_jpy)} / ` : ""}
                            {formatUsdc(order.amount_usdc)} USDC
                          </p>
                          <div className="grid gap-2">
                            <span
                              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClassName(order.status)}`}
                            >
                              {statusLabels[order.status] ?? order.status}
                            </span>
                            <select className={fieldClassName} defaultValue={order.status} name="status">
                              <option value="pending">未払い</option>
                              <option value="paid">支払い済み</option>
                              <option value="expired">期限切れ</option>
                              <option value="cancelled">キャンセル</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <input
                              className={fieldClassName}
                              defaultValue={order.payment_tx_hash ?? ""}
                              name="payment_tx_hash"
                              placeholder="Tx hash"
                            />
                            {isTransactionHash(order.payment_tx_hash) ? (
                              <a
                                className="break-all text-xs font-semibold text-[#3431a8] underline"
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
                                  ? "これはウォレットアドレスです。Tx hashを保存してください。"
                                  : "保存されている値は正しいTx hashではありません。"}
                              </p>
                            ) : null}
                          </div>
                          <button className="h-9 rounded-md bg-[#1f2328] px-3 text-xs font-semibold text-white xl:justify-self-end">
                            保存
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-sm text-[#656d76]">注文はまだありません。</p>
                  )}
                </section>
              </div>

              <aside className="grid gap-6 xl:sticky xl:top-24 xl:self-start">
                <section className="rounded-lg border border-[#d8dee4] bg-white" id="settings">
                  <div className="border-b border-[#d8dee4] px-5 py-4">
                    <h2 className="text-base font-semibold">店舗設定</h2>
                    <p className="mt-1 text-sm text-[#656d76]">決済に使う基本情報です。</p>
                  </div>
                  {activeShop ? (
                    <form action={updateShop} className="grid gap-4 p-5">
                      <input name="shop_id" type="hidden" value={activeShop.id} />
                      <label className="grid gap-2 text-sm font-medium">
                        店舗名
                        <input className={fieldClassName} defaultValue={activeShop.name} name="name" required />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        受取ウォレット
                        <input
                          className={fieldClassName}
                          defaultValue={activeShop.wallet_address ?? ""}
                          name="wallet_address"
                          placeholder="0x..."
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        決済ネットワーク
                        <select
                          className={fieldClassName}
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
                          className={fieldClassName}
                          defaultValue={activeShop.jpy_per_usdc ?? 160}
                          min="1"
                          name="jpy_per_usdc"
                          step="0.000001"
                          type="number"
                          required
                        />
                      </label>
                      <p className="rounded-md bg-[#f6f8fa] p-3 text-sm text-[#656d76]">
                        公開ショップID: <span className="font-mono">{activeShop.slug}</span>
                      </p>
                      <button className="h-10 rounded-md bg-[#635bff] px-4 text-sm font-semibold text-white">
                        店舗設定を保存
                      </button>
                    </form>
                  ) : (
                    <form action={createShop} className="grid gap-4 p-5">
                      <label className="grid gap-2 text-sm font-medium">
                        店舗名
                        <input className={fieldClassName} name="name" placeholder="STREAK demo shop" required />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        公開ショップID
                        <input className={fieldClassName} name="slug" placeholder="streak-demo" />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        受取ウォレット
                        <input className={fieldClassName} name="wallet_address" placeholder="0x..." />
                      </label>
                      <button className="h-10 rounded-md bg-[#635bff] px-4 text-sm font-semibold text-white">
                        店舗を作成
                      </button>
                    </form>
                  )}
                </section>

                <section className="rounded-lg border border-[#d8dee4] bg-white">
                  <div className="border-b border-[#d8dee4] px-5 py-4">
                    <h2 className="text-base font-semibold">商品を作成</h2>
                    <p className="mt-1 text-sm text-[#656d76]">円で登録するとUSDC決済額を自動計算します。</p>
                  </div>
                  {activeShop ? (
                    <form action={createProduct} className="grid gap-4 p-5">
                      <input name="shop_id" type="hidden" value={activeShop.id} />
                      <label className="grid gap-2 text-sm font-medium">
                        商品名
                        <input className={fieldClassName} name="name" required />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        価格（円）
                        <input className={fieldClassName} min="1" name="price_jpy" step="1" type="number" required />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        商品説明
                        <textarea className={textareaClassName} name="description" />
                      </label>
                      <p className="text-xs text-[#656d76]">
                        現在の換算: 1 USDC = {formatJpy(jpyPerUsdc)}
                      </p>
                      <button className="h-10 rounded-md bg-[#1f2328] px-4 text-sm font-semibold text-white">
                        商品を作成
                      </button>
                    </form>
                  ) : (
                    <p className="p-5 text-sm text-[#656d76]">先に店舗を作成してください。</p>
                  )}
                </section>
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

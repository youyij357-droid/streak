import Link from "next/link";
import { redirect } from "next/navigation";
import { formatJpy, formatUsdc, isTransactionHash, isWalletAddress } from "@/lib/format";
import { paymentNetworkExplorerTxUrl } from "@/lib/payment-networks";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateOrderStatus } from "./actions";
import { signOutAdmin } from "./login/actions";

export const metadata = {
  title: "ダッシュボード | STREAK",
};

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "order-updated": "注文を更新しました。",
};

const errorMessages: Record<string, string> = {
  "invalid-tx-hash": "Tx hashは0xから始まる64文字の英数字です。",
  "order-not-found": "注文が見つかりません。",
  "order-status-required": "注文ステータスを正しく選択してください。",
  "tx-failed": "この取引はブロックチェーン上で失敗しています。",
  "tx-not-found-or-pending": "選択中のネットワークでこの取引が見つかりません。",
  "tx-usdc-transfer-not-found": "この取引は注文内容と一致しません。",
};

const statusLabels: Record<string, string> = {
  cancelled: "キャンセル",
  expired: "期限切れ",
  paid: "支払い済み",
  pending: "未払い",
};

const fieldClassName =
  "h-10 w-full rounded-md border border-[#d8dee4] bg-white px-3 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";

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
  const activeShop = shopRows?.[0] ?? null;

  const { data: products } = activeShop
    ? await supabase.from("products").select("*").eq("shop_id", activeShop.id)
    : { data: [] };

  const { data: orders, error: ordersError } = activeShop
    ? await supabase
        .from("orders")
        .select("*, products(name)")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [], error: null };

  const orderRows = orders ?? [];
  const paidOrders = orderRows.filter((order) => order.status === "paid");
  const pendingOrders = orderRows.filter((order) => order.status === "pending");
  const paidTotal = paidOrders.reduce((sum, order) => sum + Number(order.amount_usdc ?? 0), 0);
  const jpyPerUsdc = Number(activeShop?.jpy_per_usdc ?? 160);
  const recentOrders = [...orderRows].reverse().slice(-8);
  const maxRecentAmount = Math.max(...recentOrders.map((order) => Number(order.amount_usdc ?? 0)), 1);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#d8dee4] bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="block text-lg font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <p className="mt-1 text-xs text-[#656d76]">管理コンソール</p>
          <nav className="mt-8 grid gap-1 text-sm font-medium">
            <Link className="rounded-md bg-[#f0f3ff] px-3 py-2 text-[#3431a8]" href="/admin">
              ダッシュボード
            </Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/products">
              商品
            </Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/settings">
              店舗設定
            </Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/payment-methods">
              決済手段
            </Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#d8dee4] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">ダッシュボード</h1>
                <p className="mt-1 text-sm text-[#656d76]">売上、注文、決済状況を確認します。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]" href="/admin/products">
                  商品管理
                </Link>
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
            {shopsError || ordersError ? (
              <p className="rounded-md border border-[#ffd2c2] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
                データの読み込みに失敗しました。
              </p>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["売上", `${formatUsdc(paidTotal)} USDC`, `${paidOrders.length}件の支払い済み注文`],
                ["未払い注文", String(pendingOrders.length), "確認待ちの注文"],
                ["商品", String(products?.length ?? 0), "公開/非公開の商品"],
                ["自動換算レート", `1 USDC = ${formatJpy(jpyPerUsdc)}`, "商品作成時に自動取得"],
              ].map(([label, value, note]) => (
                <article className="rounded-lg border border-[#d8dee4] bg-white p-5" key={label}>
                  <p className="text-sm font-medium text-[#656d76]">{label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-2 text-xs text-[#656d76]">{note}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-lg border border-[#d8dee4] bg-white p-5">
                <h2 className="text-base font-semibold">売上の推移</h2>
                <p className="mt-1 text-sm text-[#656d76]">直近注文のUSDC金額を表示します。</p>
                <div className="mt-6 flex h-36 items-end gap-2">
                  {recentOrders.length ? (
                    recentOrders.map((order, index) => {
                      const amount = Number(order.amount_usdc ?? 0);
                      const height = Math.max(8, Math.round((amount / maxRecentAmount) * 100));

                      return (
                        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={order.id ?? index}>
                          <div
                            className={`w-full rounded-t-md ${order.status === "paid" ? "bg-[#635bff]" : "bg-[#c9d1d9]"}`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="truncate text-[10px] text-[#656d76]">{statusLabels[order.status] ?? order.status}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-md bg-[#f6f8fa] text-sm text-[#656d76]">
                      注文データはまだありません。
                    </div>
                  )}
                </div>
              </article>

              <article className="rounded-lg border border-[#d8dee4] bg-white p-5">
                <h2 className="text-base font-semibold">注文ステータス</h2>
                <div className="mt-5 grid gap-3">
                  {[
                    ["支払い済み", paidOrders.length, "bg-[#176b32]"],
                    ["未払い", pendingOrders.length, "bg-[#bf8700]"],
                    ["その他", Math.max(orderRows.length - paidOrders.length - pendingOrders.length, 0), "bg-[#656d76]"],
                  ].map(([label, count, color]) => {
                    const width = orderRows.length ? Math.max(6, (Number(count) / orderRows.length) * 100) : 0;

                    return (
                      <div key={String(label)}>
                        <div className="mb-1 flex justify-between text-xs text-[#656d76]">
                          <span>{label}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#eef1f4]">
                          <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>

            <section className="rounded-lg border border-[#d8dee4] bg-white">
              <div className="border-b border-[#d8dee4] px-5 py-4">
                <h2 className="text-base font-semibold">注文</h2>
                <p className="mt-1 text-sm text-[#656d76]">直近30件の注文とTx hashを確認できます。</p>
              </div>
              {orderRows.length ? (
                <div className="divide-y divide-[#edf0f2]">
                  {orderRows.map((order) => (
                    <form
                      action={updateOrderStatus}
                      className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_180px_110px_1.2fr_74px] xl:items-start"
                      key={order.id}
                    >
                      <input name="next" type="hidden" value="/admin" />
                      <input name="order_id" type="hidden" value={order.id} />
                      <div>
                        <p className="font-medium">{order.products?.name ?? "削除済み商品"}</p>
                        <p className="mt-1 text-xs text-[#656d76]">{order.buyer_email || "購入者メールなし"}</p>
                      </div>
                      <p className="text-sm font-medium">
                        {order.amount_jpy ? `${formatJpy(order.amount_jpy)} / ` : ""}
                        {formatUsdc(order.amount_usdc)} USDC
                      </p>
                      <div className="grid gap-2">
                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClassName(order.status)}`}>
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
                        <input className={fieldClassName} defaultValue={order.payment_tx_hash ?? ""} name="payment_tx_hash" placeholder="Tx hash" />
                        {isTransactionHash(order.payment_tx_hash) ? (
                          <a
                            className="break-all text-xs font-semibold text-[#3431a8] underline"
                            href={paymentNetworkExplorerTxUrl(order.payment_network ?? activeShop?.payment_network, order.payment_tx_hash)}
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
        </section>
      </div>
    </main>
  );
}

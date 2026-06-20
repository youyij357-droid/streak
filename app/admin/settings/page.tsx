import Link from "next/link";
import { redirect } from "next/navigation";
import { formatJpy } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createShop, updateShop } from "../actions";
import { CopyPathButton } from "../CopyPathButton";
import { signOutAdmin } from "../login/actions";

export const metadata = {
  title: "店舗設定 | STREAK",
};

export const dynamic = "force-dynamic";

const fieldClassName =
  "h-10 w-full rounded-md border border-[#d8dee4] bg-white px-3 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";

export default async function SettingsPage() {
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

  const { data: shops } = await supabase.from("shops").select("*").order("created_at", { ascending: true });
  const activeShop = shops?.[0] ?? null;
  const activeNetwork = getPaymentNetwork(activeShop?.payment_network);
  const jpyPerUsdc = Number(activeShop?.jpy_per_usdc ?? 160);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#d8dee4] bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="block text-lg font-semibold tracking-[0.18em]" href="/">STREAK</Link>
          <p className="mt-1 text-xs text-[#656d76]">管理コンソール</p>
          <nav className="mt-8 grid gap-1 text-sm font-medium">
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin">ダッシュボード</Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/products">商品</Link>
            <Link className="rounded-md bg-[#f0f3ff] px-3 py-2 text-[#3431a8]" href="/admin/settings">店舗設定</Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/payment-methods">決済手段</Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#d8dee4] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">店舗設定</h1>
                <p className="mt-1 text-sm text-[#656d76]">公開ページとUSDC決済に使う設定です。</p>
              </div>
              <form action={signOutAdmin}>
                <button className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]">ログアウト</button>
              </form>
            </div>
          </header>

          <div className="mx-auto grid max-w-4xl gap-6 px-5 py-6 sm:px-8">
            <section className="overflow-hidden rounded-lg border border-[#d8dee4] bg-white">
              {activeShop ? (
                <form action={updateShop}>
                  <input name="next" type="hidden" value="/admin/settings" />
                  <input name="shop_id" type="hidden" value={activeShop.id} />
                  <div className="border-b border-[#edf0f2] bg-[#fbfcfd] px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">{activeShop.name}</p>
                        <p className="mt-1 break-all font-mono text-xs text-[#656d76]">/shop/{activeShop.slug}</p>
                      </div>
                      <span className="w-fit rounded-full bg-[#f0f3ff] px-2.5 py-1 text-xs font-semibold text-[#3431a8]">
                        {activeNetwork.modeLabel}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link className="inline-flex h-9 items-center rounded-md border border-[#d8dee4] bg-white px-3 text-xs font-semibold hover:bg-[#f6f8fa]" href={`/shop/${activeShop.slug}`}>公開ページを開く</Link>
                      <CopyPathButton label="公開URLをコピー" path={`/shop/${activeShop.slug}`} />
                    </div>
                  </div>

                  <div className="grid gap-6 p-5">
                    <section className="grid gap-3">
                      <h2 className="text-sm font-semibold">基本情報</h2>
                      <label className="grid gap-2 text-sm font-medium">店舗名<input className={fieldClassName} defaultValue={activeShop.name} name="name" required /></label>
                    </section>
                    <section className="grid gap-3 border-t border-[#edf0f2] pt-5">
                      <h2 className="text-sm font-semibold">決済設定</h2>
                      <label className="grid gap-2 text-sm font-medium">受取ウォレット<input className={fieldClassName} defaultValue={activeShop.wallet_address ?? ""} name="wallet_address" placeholder="0x..." /></label>
                      <label className="grid gap-2 text-sm font-medium">
                        決済ネットワーク
                        <select className={fieldClassName} defaultValue={activeShop.payment_network ?? "polygon_mainnet"} name="payment_network">
                          <option value="polygon_mainnet">本番 - Polygon USDC</option>
                          <option value="polygon_amoy">テスト - Polygon Amoy USDC</option>
                        </select>
                      </label>
                      <div className="rounded-md border border-[#d8dee4] bg-[#f6f8fa] p-3">
                        <p className="text-xs font-medium text-[#656d76]">自動換算レート</p>
                        <p className="mt-1 text-sm font-semibold">1 USDC = {formatJpy(jpyPerUsdc)}</p>
                        <p className="mt-1 text-xs text-[#656d76]">商品作成・更新時にSTREAK側で自動取得します。</p>
                      </div>
                    </section>
                    <button className="h-10 rounded-md bg-[#635bff] px-4 text-sm font-semibold text-white">店舗設定を保存</button>
                  </div>
                </form>
              ) : (
                <form action={createShop} className="grid gap-5 p-5">
                  <input name="next" type="hidden" value="/admin/settings" />
                  <h2 className="text-base font-semibold">店舗を作成</h2>
                  <label className="grid gap-2 text-sm font-medium">店舗名<input className={fieldClassName} name="name" placeholder="STREAK demo shop" required /></label>
                  <label className="grid gap-2 text-sm font-medium">公開ショップID<input className={fieldClassName} name="slug" placeholder="streak-demo" /></label>
                  <label className="grid gap-2 text-sm font-medium">受取ウォレット<input className={fieldClassName} name="wallet_address" placeholder="0x..." /></label>
                  <button className="h-10 rounded-md bg-[#635bff] px-4 text-sm font-semibold text-white">店舗を作成</button>
                </form>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

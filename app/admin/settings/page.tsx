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

const textareaClassName =
  "min-h-24 w-full rounded-md border border-[#d8dee4] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";

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
                <p className="mt-1 text-sm text-[#656d76]">
                  審査で確認される販売者情報と公開ショップページを管理します。
                </p>
              </div>
              <form action={signOutAdmin}>
                <button className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]">ログアウト</button>
              </form>
            </div>
          </header>

          <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 sm:px-8">
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
                      <div className="flex flex-wrap gap-2">
                        <CopyPathButton label="URLコピー" path={`/shop/${activeShop.slug}`} />
                        <Link
                          className="inline-flex h-9 items-center rounded-md border border-[#d8dee4] bg-white px-3 text-xs font-semibold hover:bg-[#f6f8fa]"
                          href={`/shop/${activeShop.slug}`}
                          target="_blank"
                        >
                          公開ページを見る
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 p-5">
                    <section className="grid gap-4">
                      <SectionTitle title="基本情報" body="ショップ名、受取ウォレット、決済ネットワークを設定します。" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="ショップ名">
                          <input className={fieldClassName} defaultValue={activeShop.name ?? ""} name="name" required />
                        </Field>
                        <Field label="受取ウォレット">
                          <input className={`${fieldClassName} font-mono`} defaultValue={activeShop.wallet_address ?? ""} name="wallet_address" placeholder="0x..." />
                        </Field>
                        <Field label="決済ネットワーク">
                          <select className={fieldClassName} defaultValue={activeShop.payment_network ?? "polygon-mainnet"} name="payment_network">
                            <option value="polygon-mainnet">Polygon Mainnet USDC</option>
                            <option value="polygon-amoy">Polygon Amoy Testnet USDC</option>
                          </select>
                        </Field>
                        <Field label="現在の自動換算レート">
                          <div className="flex h-10 items-center rounded-md border border-[#d8dee4] bg-[#f6f8fa] px-3 text-sm">
                            1 USDC = {formatJpy(jpyPerUsdc)}
                          </div>
                        </Field>
                      </div>
                      <p className="text-xs leading-5 text-[#656d76]">
                        現在の設定: {activeNetwork.modeLabel} / {activeNetwork.label}
                      </p>
                    </section>

                    <section className="grid gap-4">
                      <SectionTitle title="公開ショップページ" body="Wert等の審査で提出できる販売サイト情報を整えます。" />
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          defaultChecked={activeShop.public_site_published ?? true}
                          name="public_site_published"
                          type="checkbox"
                        />
                        公開ショップページを表示する
                      </label>
                      <Field label="ページ見出し">
                        <input className={fieldClassName} defaultValue={activeShop.public_site_headline ?? ""} name="public_site_headline" placeholder="安心して購入できるUSDC決済ショップ" />
                      </Field>
                      <Field label="ショップ紹介文">
                        <textarea className={textareaClassName} defaultValue={activeShop.public_site_description ?? ""} name="public_site_description" placeholder="販売している商品、サービス内容、購入後の流れを説明してください。" />
                      </Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="問い合わせメール">
                          <input className={fieldClassName} defaultValue={activeShop.support_email ?? ""} name="support_email" type="email" />
                        </Field>
                        <Field label="問い合わせ対応時間">
                          <input className={fieldClassName} defaultValue={activeShop.support_hours ?? ""} name="support_hours" placeholder="平日 10:00-18:00" />
                        </Field>
                      </div>
                    </section>

                    <section className="grid gap-4">
                      <SectionTitle title="事業者・法務表示" body="購入者と審査担当者が確認する表示項目です。" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="法人名・屋号">
                          <input className={fieldClassName} defaultValue={activeShop.company_name ?? ""} name="company_name" />
                        </Field>
                        <Field label="代表者名">
                          <input className={fieldClassName} defaultValue={activeShop.representative_name ?? ""} name="representative_name" />
                        </Field>
                      </div>
                      <Field label="所在地">
                        <textarea className={textareaClassName} defaultValue={activeShop.business_address ?? ""} name="business_address" />
                      </Field>
                      <Field label="販売条件・追加費用">
                        <textarea className={textareaClassName} defaultValue={activeShop.sales_terms ?? ""} name="sales_terms" placeholder="表示価格、決済時のネットワーク手数料、購入者が負担する費用など。" />
                      </Field>
                      <Field label="返金・キャンセル方針">
                        <textarea className={textareaClassName} defaultValue={activeShop.refund_policy ?? ""} name="refund_policy" placeholder="デジタル商品、サービス提供後、誤送金時などの取り扱い。" />
                      </Field>
                      <Field label="提供時期">
                        <textarea className={textareaClassName} defaultValue={activeShop.delivery_timing ?? ""} name="delivery_timing" placeholder="決済確認後すぐ、または何営業日以内に提供するか。" />
                      </Field>
                      <Field label="利用可能な決済方法">
                        <textarea className={textareaClassName} defaultValue={activeShop.accepted_payment_methods ?? "Polygon USDC"} name="accepted_payment_methods" />
                      </Field>
                      <Field label="購入前の注意事項">
                        <textarea className={textareaClassName} defaultValue={activeShop.review_notice ?? ""} name="review_notice" placeholder="ウォレット、USDC、ネットワーク、返金条件など購入者に事前確認してほしい内容。" />
                      </Field>
                    </section>
                  </div>

                  <div className="flex justify-end border-t border-[#edf0f2] px-5 py-4">
                    <button className="h-10 rounded-md bg-[#635bff] px-4 text-sm font-semibold text-white hover:bg-[#5149d8]">
                      店舗設定を保存
                    </button>
                  </div>
                </form>
              ) : (
                <form action={createShop} className="grid gap-4 p-5">
                  <input name="next" type="hidden" value="/admin/settings" />
                  <SectionTitle title="ショップを作成" body="最初の公開ショップを作成します。" />
                  <Field label="ショップ名">
                    <input className={fieldClassName} name="name" required />
                  </Field>
                  <Field label="公開スラッグ">
                    <input className={fieldClassName} name="slug" placeholder="my-shop" />
                  </Field>
                  <Field label="受取ウォレット">
                    <input className={`${fieldClassName} font-mono`} name="wallet_address" placeholder="0x..." />
                  </Field>
                  <button className="w-fit rounded-md bg-[#635bff] px-4 py-2 text-sm font-semibold text-white">
                    ショップを作成
                  </button>
                </form>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#656d76]">{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

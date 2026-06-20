import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAdmin } from "../login/actions";

export const metadata = {
  title: "決済手段 | STREAK",
};

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
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

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#d8dee4] bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="block text-lg font-semibold tracking-[0.18em]" href="/">STREAK</Link>
          <p className="mt-1 text-xs text-[#656d76]">管理コンソール</p>
          <nav className="mt-8 grid gap-1 text-sm font-medium">
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin">ダッシュボード</Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/products">商品</Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/settings">店舗設定</Link>
            <Link className="rounded-md bg-[#f0f3ff] px-3 py-2 text-[#3431a8]" href="/admin/payment-methods">決済手段</Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#d8dee4] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">決済手段</h1>
                <p className="mt-1 text-sm text-[#656d76]">現在利用できる決済と、申請が必要な決済を整理します。</p>
              </div>
              <form action={signOutAdmin}>
                <button className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]">ログアウト</button>
              </form>
            </div>
          </header>

          <div className="grid gap-6 px-5 py-6 sm:px-8">
            <section className="rounded-lg border border-[#d8dee4] bg-white">
              <div className="border-b border-[#d8dee4] px-5 py-4">
                <h2 className="text-base font-semibold">現在、実際に決済可能な方法</h2>
                <p className="mt-1 text-sm text-[#656d76]">すぐに利用できる非カストディ型の決済です。</p>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <article className="rounded-lg border border-[#d8dee4] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Polygon Mainnet USDC</h3>
                      <p className="mt-2 text-sm leading-6 text-[#656d76]">
                        購入者がMetaMask等のウォレットから、販売者ウォレットへUSDCを直接送金します。
                      </p>
                    </div>
                    <span className="rounded-full bg-[#e9f8ef] px-2.5 py-1 text-xs font-semibold text-[#176b32]">利用可能</span>
                  </div>
                </article>
                <article className="rounded-lg border border-[#d8dee4] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Polygon Amoy Testnet USDC</h3>
                      <p className="mt-2 text-sm leading-6 text-[#656d76]">
                        本番資金を使わずに、ウォレット接続、注文作成、Tx hash保存の流れを確認できます。
                      </p>
                    </div>
                    <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-xs font-semibold text-[#3431a8]">テスト用</span>
                  </div>
                </article>
              </div>
            </section>

            <section className="rounded-lg border border-[#d8dee4] bg-white">
              <div className="border-b border-[#d8dee4] px-5 py-4">
                <h2 className="text-base font-semibold">申請・審査が必要な決済</h2>
                <p className="mt-1 text-sm text-[#656d76]">導入前に事業者審査、KYC/KYB、法務確認が必要になる可能性があります。</p>
              </div>
              <div className="grid gap-4 p-5">
                {[
                  ["カード決済からUSDCへのオンランプ", "Wert、Transak、MoonPay等。購入者はカード等で支払い、裏側で暗号資産/ステーブルコイン処理を行う方式です。事業者審査、対象国、取扱商材、KYC要件の確認が必要です。"],
                  ["埋め込みウォレット", "Privy、Dynamic、Magic、Web3Auth等。購入者がメールやSNSログインでウォレットを使えるようにする方式です。秘密鍵管理、カストディ性、利用規約の確認が必要です。"],
                  ["法定通貨決済の収納代行", "Stripe等の通常カード決済。STREAK上で円決済を扱う場合、資金の流れ、販売者への精算、手数料、返金対応の設計が必要です。"],
                  ["日本向けステーブルコイン関連サービス", "電子決済手段、暗号資産、資金移動、媒介該当性などの論点があります。STREAKが資金を預かるか、送金を指図するかで確認範囲が変わります。"],
                ].map(([title, body]) => (
                  <article className="rounded-lg border border-[#d8dee4] p-4" key={title}>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#656d76]">{body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d8dee4] bg-white p-5">
              <h2 className="text-base font-semibold">現時点の推奨</h2>
              <p className="mt-2 text-sm leading-6 text-[#656d76]">
                まずは現在完成している非カストディ型USDC決済を正式なMVPとして扱い、カード決済・オンランプ・埋め込みウォレットは申請と法務確認を経て段階的に追加するのが安全です。
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

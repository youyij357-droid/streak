import Link from "next/link";

export const metadata = {
  title: "利用規約 | STREAK",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">利用規約</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            STREAKは、販売者が商品ページとUSDC決済リンクを作成するための管理ツールです。
            本サービスはMVP検証段階であり、正式な商用利用前には運用条件と法務確認が必要です。
          </p>
          <p>
            支払いは購入者ウォレットから販売者ウォレットへ直接送金されます。
            STREAKは原則として購入代金を預かりません。
          </p>
          <p>
            ブロックチェーン取引は送信後に取り消せない場合があります。
            購入者は、ネットワーク、送金先ウォレット、金額を確認したうえで支払いを行ってください。
          </p>
        </div>
      </article>
    </main>
  );
}

import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー | STREAK",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">プライバシーポリシー</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            STREAKは、決済リンクの運用に必要なアカウント情報、店舗情報、商品情報、注文情報を保存します。
            購入者メールアドレスは任意であり、注文識別のために利用されます。
          </p>
          <p>
            ウォレットアドレスやTx hashは、ブロックチェーン上で公開される情報です。
            商品、注文、ウォレット欄には不要な個人情報を入力しないでください。
          </p>
          <p>
            認証とデータベース保存にはSupabase、ホスティングにはVercelを利用しています。
          </p>
        </div>
      </article>
    </main>
  );
}

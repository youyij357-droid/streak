import Link from "next/link";

export const metadata = {
  title: "USDCリスク説明 | STREAK",
};

export default function UsdcRiskPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">USDCリスク説明</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            USDCはブロックチェーン上で移転されるデジタル資産です。
            送金先、ネットワーク、金額を誤ると、資金を取り戻せない場合があります。
          </p>
          <p>
            STREAKでは、商品価格を円で登録し、設定された為替レートをもとにUSDC決済額へ換算します。
            為替レートは変動する可能性があるため、支払い前に表示金額を確認してください。
          </p>
          <p>
            ウォレットの秘密鍵やシードフレーズは絶対に共有しないでください。
            STREAKが秘密鍵やシードフレーズの入力を求めることはありません。
          </p>
          <p>
            法令、規制、ウォレット、ネットワーク混雑、スマートコントラクト、取引所等の事情により、
            送金や確認に遅延・失敗が発生する可能性があります。
          </p>
        </div>
      </article>
    </main>
  );
}

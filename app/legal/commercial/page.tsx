import Link from "next/link";

export const metadata = {
  title: "特定商取引法に基づく表記 | STREAK",
};

export default function CommercialPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">特定商取引法に基づく表記</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            販売者名、所在地、連絡先、販売価格、商品引渡時期、返品・キャンセル条件、
            サポート窓口などは、各販売者が公開前に記載する必要があります。
          </p>
          <p>
            このページはMVP検証用の仮表示です。実際に商品販売を開始する前に、
            販売者情報と取引条件を確定し、法令に沿った内容へ更新してください。
          </p>
        </div>
      </article>
    </main>
  );
}

import Link from 'next/link';

export default function TokushohoPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-950">
          STREAK
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">特定商取引法に基づく表記</h1>
        <p className="mt-2 text-sm text-slate-500">販売者ごとの詳細は、各公開ショップページおよび商品ページに表示されます。</p>

        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-700">
          <Info label="販売事業者" value="各ショップページに記載の販売者" />
          <Info label="運営責任者" value="各ショップページに記載の担当者または代表者" />
          <Info label="所在地" value="各ショップページに記載の所在地" />
          <Info label="問い合わせ先" value="各ショップページに記載のメールアドレスまたは問い合わせ先" />
          <Info label="販売価格" value="各商品ページにUSDC建てで表示します。円表示を併記する場合があります。" />
          <Info label="商品代金以外の必要料金" value="ウォレットやブロックチェーンネットワークの手数料が発生する場合があります。" />
          <Info label="支払方法" value="Polygon USDCなど、各ショップページに表示される決済方法。" />
          <Info label="提供時期" value="各ショップページまたは商品ページに記載の提供時期に従います。" />
          <Info label="返品・キャンセル" value="デジタル商品・サービスの性質上、提供後の返金可否は各販売者の表示条件に従います。" />
        </div>
      </article>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-b border-slate-200 pb-4 md:grid-cols-[180px_1fr]">
      <dt className="font-semibold text-slate-950">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

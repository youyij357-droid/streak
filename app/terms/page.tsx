import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-950">
          STREAK
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">利用規約</h1>
        <p className="mt-2 text-sm text-slate-500">最終更新日: 2026年6月20日</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
          <Section title="1. サービス内容">
            STREAKは、事業者が商品ページおよびUSDC決済導線を作成するための管理ツールです。STREAKは原則として購入者の資金を預からず、購入者から販売者のウォレットへ直接送金されます。
          </Section>
          <Section title="2. 利用対象">
            本サービスは、事業者または事業利用を目的とするユーザー向けです。利用者は、登録情報が正確であること、適用される法令および規約を遵守することを確認します。
          </Section>
          <Section title="3. 決済に関する注意">
            USDC決済では、ウォレット、送金先アドレス、ネットワーク、手数料を利用者自身で確認する必要があります。ブロックチェーン上の送金は取り消しできない場合があります。
          </Section>
          <Section title="4. 禁止事項">
            違法な商品・サービスの販売、虚偽表示、第三者の権利侵害、不正アクセス、マネーロンダリングその他不正な取引は禁止します。
          </Section>
          <Section title="5. 返金・キャンセル">
            個別の商品・サービスの返金、キャンセル、提供条件は、各販売者が公開ショップページまたは商品ページで表示する条件に従います。
          </Section>
          <Section title="6. 免責">
            STREAKは、ブロックチェーンネットワーク、ウォレット、外部決済プロバイダー、販売者と購入者間の個別取引について、STREAKの責に帰すべき場合を除き責任を負いません。
          </Section>
          <Section title="7. 規約変更">
            STREAKは、必要に応じて本規約を変更できます。重要な変更がある場合は、サービス上での表示その他適切な方法により通知します。
          </Section>
        </div>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}

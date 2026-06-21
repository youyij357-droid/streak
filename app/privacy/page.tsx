import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-slate-950">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-950">
          STREAK
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-slate-500">最終更新日: 2026年6月20日</p>

        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
          <Section title="1. 取得する情報">
            STREAKは、アカウント情報、店舗情報、商品情報、注文情報、ウォレットアドレス、問い合わせ情報、アクセスログなど、サービス提供に必要な情報を取得します。
          </Section>
          <Section title="2. 利用目的">
            取得した情報は、アカウント管理、決済導線の提供、注文管理、本人確認、審査対応、不正利用防止、サービス改善、問い合わせ対応のために利用します。
          </Section>
          <Section title="3. 外部サービスの利用">
            STREAKは、データ保管、認証、メール送信、決済、ブロックチェーン確認などの目的で外部サービスを利用する場合があります。
          </Section>
          <Section title="4. 第三者提供">
            法令に基づく場合、利用者の同意がある場合、決済事業者や審査機関への必要な提供を行う場合を除き、個人情報を不必要に第三者へ提供しません。
          </Section>
          <Section title="5. 安全管理">
            STREAKは、取得した情報について、アクセス制限、通信の保護、権限管理など合理的な安全管理措置を講じます。
          </Section>
          <Section title="6. 問い合わせ">
            個人情報の開示、訂正、削除、利用停止などのご相談は、サービス上の問い合わせ先または各販売者の問い合わせ先へご連絡ください。
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

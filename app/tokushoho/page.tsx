'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image 
              src="/images/logo.png" 
              alt="STREAK Logo" 
              width={120} 
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <Link href="/" className="text-gray-700 hover:text-gray-900 transition font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Specified Commercial Transaction Act Disclosure</h1>
          <p className="text-gray-600 font-light">特定商取引法に基づく表記</p>
        </div>

        <div className="space-y-6 text-gray-700">
          <InfoItem label="販売業者名" value="Streak" />
          <InfoItem label="運営責任者" value="（運営者名）" />
          <InfoItem label="所在地" value="（住所）" />
          <InfoItem label="電話番号" value="（電話番号）" />
          <InfoItem label="メールアドレス" value="support@streak.io" />
          
          <Section title="Service Charges" titleJa="サービス料金">
            <ul className="list-disc list-inside space-y-2">
              <li>Free プラン：取引手数料 2.5%</li>
              <li>Starter プラン：取引手数料 2.0%（月額 ¥9.80）</li>
              <li>Pro プラン：取引手数料 1.5%（月額 ¥49.80）</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              手数料はスマートコントラクトにより自動計算・控除されます。
            </p>
          </Section>

          <Section title="Payment Methods" titleJa="支払い方法">
            <ul className="list-disc list-inside space-y-2">
              <li>暗号資産（USDC）</li>
              <li>クレジットカード（Crossmint経由）</li>
              <li>Apple Pay</li>
              <li>Google Pay</li>
            </ul>
          </Section>

          <Section title="Service Provision Timing" titleJa="サービス提供時期">
            <p>
              加盟店登録が完了後、即座に決済リンク生成機能が利用可能となります。購入者による決済完了後、即座に資金がウォレットに送付されます。
            </p>
          </Section>

          <Section title="Refund and Cancellation Policy" titleJa="返金・キャンセルポリシー">
            <p className="mb-4">
              本サービスは継続的なプラットフォーム利用を前提としているため、以下のポリシーを適用します：
            </p>
            <ul className="list-disc list-inside space-y-3">
              <li>
                <strong>取引のキャンセル：</strong>購入者による決済後のキャンセルは、加盟店の判断に基づいて行われます。当社は加盟店とのウォレット間で完了した取引に対して責任を負いません。
              </li>
              <li>
                <strong>プラン変更：</strong>プラン変更はいつでも可能です。変更後、新プランの手数料が翌月より適用されます。
              </li>
              <li>
                <strong>サービス解約：</strong>加盟店がアカウントを削除する場合、保留中の資金がある場合は当該資金がウォレットに送付されます。解約後、新規取引は発生しません。
              </li>
              <li>
                <strong>返金請求：</strong>本サービスは取引仲介サービスのため、取引に関する返金は購入者と加盟店との直接交渉により決定されます。当社は仲介を行わず、加盟店の意思に基づいて返金が実施されます。
              </li>
            </ul>
          </Section>

          <Section title="Compliance" titleJa="法令遵守">
            <p>
              本サービスの利用にあたり、加盟店は適用される全ての法令（資金決済法、金融商品取引法、マネーロンダリング防止法等）を遵守するものとします。不正な取引が検出された場合、当社はアカウントを停止し、関連情報を法執行機関に提供することがあります。
            </p>
          </Section>

          <Section title="Important Notice" titleJa="重要な通知">
            <p>
              本サービスはWEB3決済プラットフォームであり、ユーザーは暗号資産の取引に関連するリスク（価格変動、技術的障害、セキュリティ脅威）を理解した上で利用するものとします。当社は、これらのリスクに起因する損害について、法律で定められた場合を除き、責任を負わないものとします。
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-light">
            本表記は特定商取引法第11条に基づいて作成されています。
          </p>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 border-b border-gray-200">
      <p className="font-bold tracking-tight text-gray-900">{label}</p>
      <p className="md:col-span-2 text-gray-700 font-light">{value}</p>
    </div>
  );
}

function Section({ title, titleJa, children }: { title: string; titleJa: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-200 py-6">
      <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
        {title}
      </h2>
      <p className="text-sm text-gray-600 font-light mb-4">{titleJa}</p>
      <div className="space-y-3 text-gray-700 font-light leading-relaxed">
        {children}
      </div>
    </section>
  );
}

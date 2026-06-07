'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600 font-light">利用規約（事業者向け）</p>
          <p className="text-sm text-gray-500 mt-4">制定日：2026年6月1日</p>
          <div className="mt-6 p-4 bg-gray-100 rounded-2xl border border-gray-300">
            <p className="text-sm font-light text-gray-800">
              <strong>重要：</strong>本サービスは個人事業主および法人（BtoB）のみを対象としています。消費者向けサービスではありません。
            </p>
          </div>
        </div>

        <div className="space-y-8 text-gray-700">
          <Section number="1" title="Scope of Application" titleJa="適用・対象">
            <p>
              本規約は、Streak（以下「当社」）が提供するWEB3決済プラットフォーム（以下「本サービス」）の利用に関する一切の事項について適用される。本サービスは個人事業主および法人を対象とした事業者向けサービスであり、消費者個人による利用は想定されていない。
            </p>
            <p className="mt-4">
              本サービスの利用申込の際、利用者は事業者であることを確認するチェックボックスにチェックを入れることにより、本規約に同意したものとみなされる。
            </p>
          </Section>

          <Section number="2" title="Definitions" titleJa="定義">
            <ul className="list-disc list-inside space-y-2">
              <li>「事業者」：本サービスの利用申込を行う個人事業主または法人</li>
              <li>「顧客」：事業者を通じて商品・サービスの購入を行う消費者</li>
              <li>「ウォレット」：暗号資産を管理するデジタルウォレット（MetaMask等）</li>
              <li>「スマートコントラクト」：ブロックチェーン上で自動実行されるプログラム</li>
              <li>「USDC」：ポリゴン上で利用可能なステーブルコイン</li>
            </ul>
          </Section>

          <Section number="3" title="Service Content" titleJa="サービスの内容">
            <p>
              当社は、事業者がホワイトラベル型のWEB3決済環境を導入し、スマートコントラクトを通じて自動的に手数料を受け取り、資金を即座にウォレットに送付するSaaSを提供する。当社は顧客資金を直接預からず、スマートコントラクトは自律的に動作するプログラムであり、当社の介入を受けない。
            </p>
          </Section>

          <Section number="4" title="Registration" titleJa="利用登録">
            <p>
              本サービスの利用を希望する事業者は、当社が指定する方法で利用申込を行うものとする。申込の際、事業者は自身が個人事業主または法人であることを確認するチェックボックスにチェックを入れるものとする。当社は、申込内容が虚偽・不正・違法であると判断した場合、当該申込を拒否することができる。
            </p>
          </Section>

          <Section number="5" title="Fees and Charges" titleJa="手数料">
            <p className="mb-4">本サービスの取引手数料は以下の通りである：</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Free プラン：取引手数料 2.5%、月額料金なし</li>
              <li>Starter プラン：取引手数料 2.0%、月額 ¥9.80</li>
              <li>Pro プラン：取引手数料 1.5%、月額 ¥49.80</li>
            </ul>
            <p className="mt-4">
              手数料はスマートコントラクトにより自動的に計算・控除され、当社のウォレットに送付される。事業者の受取金は売上金額から当社手数料を差し引いた額となる。
            </p>
          </Section>

          <Section number="6" title="Prohibited Conduct" titleJa="禁止事項">
            <p>事業者は、以下の行為を行ってはならない：</p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>違法な商品・サービスの販売</li>
              <li>詐欺、詐欺的表示等の不誠実な商取引</li>
              <li>資金洗浄（マネーロンダリング）その他の犯罪行為</li>
              <li>知的財産権の侵害</li>
              <li>本サービスのセキュリティを害する行為</li>
              <li>スマートコントラクトの改ざん等の試み</li>
              <li>本規約に違反する行為</li>
            </ul>
          </Section>

          <Section number="7" title="Disclaimer" titleJa="免責事項">
            <p className="mb-4">
              当社は以下の点について責任を負わないものとする：
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>スマートコントラクトの自律動作により生じた損害</li>
              <li>暗号資産相場の変動による損害</li>
              <li>事業者の顧客との紛争に関する損害</li>
              <li>ブロックチェーンネットワークの障害による遅延</li>
              <li>天災・不可抗力等による損害</li>
            </ul>
            <p className="mt-4">
              当社は顧客資金を預かっておらず、スマートコントラクトは当社の制御下にない自律プログラムであることを認識した上で本サービスを利用するものとする。
            </p>
          </Section>

          <Section number="8" title="Service Modification and Suspension" titleJa="サービスの変更・停止">
            <p>
              当社は、事業者に事前通知をもって、本サービスの内容を変更し、またはサービスの全部もしくは一部を停止することができる。ただし、セキュリティ上の理由がある場合は、事前通知なく停止することができる。
            </p>
          </Section>

          <Section number="9" title="Account Suspension and Termination" titleJa="アカウントの停止・解除">
            <p>
              事業者が本規約に違反する行為を行った場合、または違法な商取引に従事していると判断される場合、当社は当該事業者のアカウントを停止または解除することができる。アカウント停止時、未決済の資金があれば、スマートコントラクトの自動実行に基づきウォレットに送付される。
            </p>
          </Section>

          <Section number="10" title="Governing Law and Jurisdiction" titleJa="準拠法・管轄裁判所">
            <p>
              本規約は日本法に準拠し、本サービスに関する紛争については東京地方裁判所を専属的合意管轄裁判所とする。
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-light">
            本規約は予告なく変更される場合があります。変更後のサービス利用により、変更条項に同意したものとみなされます。本規約は日本法に準拠し、作成日は2026年6月1日です。
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ number, title, titleJa, children }: { number: string; title: string; titleJa: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
        {title}
      </h2>
      <p className="text-sm text-gray-600 font-light mb-4">第{number}条 {titleJa}</p>
      <div className="space-y-3 text-gray-700 font-light leading-relaxed">
        {children}
      </div>
    </section>
  );
}

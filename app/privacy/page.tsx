'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 font-light">プライバシーポリシー</p>
          <p className="text-sm text-gray-500 mt-4">制定日：2026年6月1日</p>
        </div>

        <div className="space-y-8 text-gray-700">
          <Section title="Operator Information" titleJa="事業者情報">
            <p>
              本プライバシーポリシーの対象となる個人情報を管理する事業者は以下の通りです：
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-2xl">
              <p><strong>事業者名：Streak</strong></p>
              <p className="text-sm text-gray-700 mt-2">お問い合わせ先：support@streak.io</p>
            </div>
          </Section>
            <p>
              当社は、本サービスの提供に必要な限度において、以下の個人情報を収集します：
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>ウォレットアドレス</li>
              <li>メールアドレス</li>
              <li>ショップ名・事業者情報</li>
              <li>決済履歴・取引情報</li>
              <li>IPアドレス・アクセスログ</li>
            </ul>
          </Section>

          <Section title="Purpose of Use" titleJa="利用目的">
            <ul className="list-disc list-inside space-y-2">
              <li>本サービスの提供・管理</li>
              <li>アカウント認証・本人確認</li>
              <li>手数料・料金の計算・請求</li>
              <li>不正検知・セキュリティ対策</li>
              <li>利用統計・サービス改善</li>
              <li>法令遵守・政府要請への対応</li>
            </ul>
          </Section>

          <Section title="Third-Party Provision" titleJa="第三者提供">
            <p>
              当社は、本サービスの提供に必要な範囲において、以下の第三者に個人情報を提供します：
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>Supabase（データベース管理）</li>
              <li>Crossmint（決済処理）</li>
              <li>Alchemy（ブロックチェーンインフラ）</li>
              <li>RainbowKit（ウォレット接続）</li>
            </ul>
            <p className="mt-4">
              これらのサービスプロバイダーは、本サービス提供の目的でのみ情報を利用します。
            </p>
          </Section>

          <Section title="Cookie Usage" titleJa="Cookieの使用">
            <p>
              当社は、ユーザー体験の向上およびサービス改善のため、Cookieを使用しています。ユーザーはブラウザ設定でCookieを無効にできますが、本サービスの一部機能が利用できなくなる場合があります。
            </p>
          </Section>

          <Section title="Data Retention Period" titleJa="保存期間">
            <p>
              当社が収集した個人情報は、以下の期間保存されます：
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>取引履歴・支払い情報：最後の取引から7年間（法令遵守）</li>
              <li>メールアドレス・ウォレットアドレス：アカウント有効期間及び解除後1年間</li>
              <li>アクセスログ・Cookieデータ：最後のアクセスから90日間</li>
            </ul>
            <p className="mt-4">
              ユーザーは、データ削除の請求により、法令上保持の必要がない情報については削除を求めることができます。
            </p>
          </Section>

          <Section title="Disclosure, Correction, and Deletion" titleJa="個人情報の開示・訂正・削除">
            <p>
              ユーザーは、当社が保有する自身の個人情報について、以下の権利を行使できます：
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4">
              <li>開示：当社が保有する個人情報の開示を請求できます</li>
              <li>訂正：個人情報が誤っている場合、訂正を請求できます</li>
              <li>削除：個人情報の削除を請求できます（法令上必要な情報を除く）</li>
              <li>利用停止：個人情報の利用停止を請求できます</li>
            </ul>
            <p className="mt-4">
              詳細は以下の問い合わせ先にご連絡ください。
            </p>
          </Section>

          <Section title="Contact Information" titleJa="お問い合わせ先">
            <p>
              個人情報に関するご質問・ご要望については、以下の連絡先までお問い合わせください：
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-2xl">
              <p><strong>Streak</strong></p>
              <p>Email: support@streak.io</p>
              <p className="text-sm text-gray-600 mt-2">
                お問い合わせ内容の確認に時間をいただく場合があります。
              </p>
            </div>
          </Section>

          <Section title="Updates to Policy" titleJa="ポリシーの変更">
            <p>
              本ポリシーは予告なく変更される場合があります。変更後のサービス利用により、変更内容に同意したものとみなされます。
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-light">
            本ポリシーは個人情報保護法及び関連法令に準拠しています。
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, titleJa, children }: { title: string; titleJa: string; children: React.ReactNode }) {
  return (
    <section>
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

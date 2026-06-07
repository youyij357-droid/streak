import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/">
            <Image 
              src="/images/logo.png" 
              alt="STREAK Logo" 
              width={120} 
              height={40}
              priority
              className="h-10 w-auto"
            />
          </a>
          <a href="/" className="text-gray-700 hover:text-gray-900 transition font-medium">
            Back to Home
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-24">
        {/* Mission Section */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Our Mission
            </h1>
            <p className="text-2xl text-gray-700 font-light leading-relaxed">
              Payments should be instant, borderless, and free from reserve.
            </p>
            <p className="text-lg text-gray-500 font-light mt-4">
              決済は即座で、ボーダーレスで、リザーブから自由であるべき。
            </p>
          </div>
        </section>

        {/* Why Streak Section */}
        <section className="mb-24 pt-24 border-t border-gray-200">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-8">
            Why Streak?
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">The Problem with Traditional Payments</h3>
              <p className="text-gray-700 font-light leading-relaxed">
                Traditional payment processors hold your funds in reserve, freezing your capital for weeks or months. 
                High chargeback rates trigger account suspensions. Businesses wait endlessly for settlement while 
                intermediaries take their cut.
              </p>
              <p className="text-gray-600 font-light mt-3">
                従来の決済プロセッサーはリザーブで資金を拘束し、数週間から数ヶ月間あなたの資本をロック。
                高いチャージバック率でアカウント停止。ビジネスは決済完了を待つ間、仲介者が手数料を取る。
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Web3 as Solution</h3>
              <p className="text-gray-700 font-light leading-relaxed">
                Blockchain technology eliminates the need for intermediaries. Smart contracts execute instantly, 
                distributing funds autonomously without reserve periods or chargeback risks. Your wallet receives 
                payments immediately.
              </p>
              <p className="text-gray-600 font-light mt-3">
                ブロックチェーン技術は仲介者を排除。スマートコントラクトは瞬時に実行され、
                リザーブ期間やチャージバック風険なしに資金を自動分配。ウォレットは支払いを即座に受け取る。
              </p>
            </div>
          </div>
        </section>

        {/* How We Work Section */}
        <section className="mb-24 pt-24 border-t border-gray-200">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-8">
            How We Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Smart Contract</h3>
              <p className="text-gray-700 font-light">
                Automatic execution and fund distribution via blockchain. No intermediaries, no delays.
              </p>
              <p className="text-gray-600 font-light mt-3">
                ブロックチェーン経由で自動実行・資金分配。仲介者なし、遅延なし。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">White Label</h3>
              <p className="text-gray-700 font-light">
                Each merchant gets an independent environment. Customize the payment experience to match your brand.
              </p>
              <p className="text-gray-600 font-light mt-3">
                各加盟店が独立した環境。支払い体験をブランドに合わせてカスタマイズ。
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">2.5% Fee</h3>
              <p className="text-gray-700 font-light">
                Transparent pricing. No hidden charges, no reserve, no minimum volume requirements.
              </p>
              <p className="text-gray-600 font-light mt-3">
                透明な価格設定。隠れた料金なし、リザーブなし、最小取引量要件なし。
              </p>
            </div>
          </div>
        </section>

        {/* Supported Region Section */}
        <section className="mb-24 pt-24 border-t border-gray-200">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-8">
            Supported Region
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Japan</h3>
              <p className="text-gray-700 font-light mb-4">
                Fully compliant with Japanese regulations including 特定商取引法 and 個人情報保護法.
              </p>
              <p className="text-sm text-gray-600 font-light">
                Support: support@streak.io
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Global</h3>
              <p className="text-gray-700 font-light mb-4">
                Coming soon. We're expanding to serve merchants worldwide with cross-border Web3 payments.
              </p>
              <p className="text-sm text-gray-600 font-light">
                Contact us for partnerships and early access.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pt-24 border-t border-gray-200">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 font-light mb-8">
              Have questions? We'd love to hear from you.
            </p>
            <a
              href="mailto:support@streak.io"
              className="inline-block px-8 py-4 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/30 transition-all duration-300 text-lg"
            >
              support@streak.io
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 font-light">
              © 2026 Streak. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

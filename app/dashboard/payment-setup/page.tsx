'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function StepNum({ n, done }: { n: number; done?: boolean }) {
  if (done) {
    return (
      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
      {n}
    </div>
  );
}

export default function PaymentSetupPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [shopName, setShopName] = useState('');
  const [crossmintKey, setCrossmintKey] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const wallet = localStorage.getItem('streak-wallet') ?? '';
    const shopId = localStorage.getItem('streak-shop-id');
    setWalletAddress(wallet);

    if (!shopId) return;
    const supabase = createClient();
    supabase
      .from('shops')
      .select('shop_name, crossmint_api_key')
      .eq('id', shopId)
      .single()
      .then(({ data }) => {
        if (data?.shop_name) setShopName(data.shop_name);
        setCrossmintKey(data?.crossmint_api_key ?? '');
      });
  }, []);

  const isCrossmintConfigured = /^(ck|sk)/.test(crossmintKey ?? '');

  const collectionDescription =
    `Collection Name: ${shopName || 'My Shop'} Payments\n` +
    `Network: Polygon\n` +
    `Type: Imported Collection (BYOC)\n` +
    `Recipient Address: ${walletAddress || '0x...'}\n` +
    `Currency: USDC\n\n` +
    `Description: USDC payment gateway for ${shopName || 'My Shop'}. ` +
    `Customers pay via credit card, Apple Pay, or Google Pay. ` +
    `Funds settle instantly to the wallet address above. Powered by Streak.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(collectionDescription).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Payment Setup</h1>
        <p className="text-gray-600 font-light mt-2">対応する決済方法を設定してください</p>
      </div>

      {/* ─── Step 1: MetaMask ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">MetaMask / SafePal</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                設定済み
              </span>
            </div>
            <p className="text-sm text-gray-500 font-light mt-1">
              ウォレット直接送金 · 手数料 2.5% のみ · 即時着金
            </p>
            {walletAddress && (
              <p className="text-xs font-mono text-gray-400 mt-3 bg-gray-50 rounded-lg px-3 py-2 break-all border border-gray-100">
                {walletAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Step 2: Crossmint ────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCrossmintConfigured ? 'bg-green-100' : 'bg-orange-50'}`}>
            {isCrossmintConfigured ? (
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-orange-500 font-bold text-sm">2</span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">クレカ / Apple Pay / Google Pay</h2>
              {isCrossmintConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                  設定済み
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold border border-orange-100">
                  設定が必要
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500 font-light space-y-0.5">
              <p>Powered by Crossmint</p>
              <p>手数料：Streak 2.5% + Crossmint 約 3〜4%</p>
            </div>

            {!isCrossmintConfigured && (
              <button
                onClick={() => setGuideOpen(!guideOpen)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-black transition"
              >
                Crossmintの登録手順を見る
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${guideOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 展開ガイド */}
        {guideOpen && (
          <div className="mt-2 pt-4 border-t border-gray-100 space-y-6">
            <ol className="space-y-5">

              {/* 1. アカウント作成 */}
              <li className="flex gap-3">
                <StepNum n={1} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">アカウント作成</p>
                  <p className="text-sm text-gray-500 font-light mt-0.5 leading-relaxed">
                    <a
                      href="https://staging.crossmint.com/console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-gray-900 font-medium"
                    >
                      staging.crossmint.com/console
                    </a>
                    {' '}でアカウントを作成してください。
                  </p>
                </div>
              </li>

              {/* 2. KYC */}
              <li className="flex gap-3">
                <StepNum n={2} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">KYC 認証</p>
                  <p className="text-sm text-gray-500 font-light mt-0.5 leading-relaxed">
                    身分証（パスポートまたは運転免許証）と自撮り写真で本人確認を完了してください。審査は通常 1〜3 営業日です。
                  </p>
                </div>
              </li>

              {/* 3. BYOC登録 */}
              <li className="flex gap-3">
                <StepNum n={3} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Imported Collection（BYOC）を登録</p>
                  <p className="text-sm text-gray-500 font-light mt-0.5 leading-relaxed">
                    コンソールの Collections ページで「Imported Collection」を選択し、以下の情報を入力してください。
                  </p>
                  <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        コレクション情報
                      </p>
                      <button
                        onClick={handleCopy}
                        className={`text-xs font-medium px-3 py-1 rounded-full border transition ${
                          copied
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                        }`}
                      >
                        {copied ? 'Copied!' : 'コピー'}
                      </button>
                    </div>
                    <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-all leading-relaxed">
                      {collectionDescription}
                    </pre>
                  </div>
                </div>
              </li>

              {/* 4. APIキー入力 */}
              <li className="flex gap-3">
                <StepNum n={4} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">APIキーを入力</p>
                  <p className="text-sm text-gray-500 font-light mt-0.5 leading-relaxed">
                    コンソールの API Keys ページから本番用 API キー（<code className="text-gray-700">ck_</code> または <code className="text-gray-700">sk_</code> で始まる）を取得し、設定画面に入力してください。
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 mt-2 underline hover:no-underline"
                  >
                    設定画面でAPIキーを入力する →
                  </Link>
                </div>
              </li>

            </ol>
          </div>
        )}
      </div>

      {/* ─── Step 3: 銀行振込 ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 p-6 opacity-50">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-gray-400 font-bold text-sm">3</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-gray-900">銀行振込</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                準備中
              </span>
            </div>
            <p className="text-sm text-gray-500 font-light mt-1">近日対応予定</p>
          </div>
        </div>
      </div>
    </div>
  );
}

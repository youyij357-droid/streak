'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

const COUNTRIES = [
  { value: 'JP', label: '日本' },
  { value: 'US', label: 'アメリカ' },
  { value: 'SG', label: 'シンガポール' },
  { value: 'HK', label: '香港' },
  { value: 'OTHER', label: 'その他' },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 必須項目
  const [shopName, setShopName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');

  // 任意項目
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  // 同意チェックボックス
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedBusiness, setAgreedBusiness] = useState(false);
  const [agreedAntisocial, setAgreedAntisocial] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  useEffect(() => {
    const walletParam = searchParams.get('wallet');
    const storedWallet = localStorage.getItem('streak-wallet');
    setWalletAddress(walletParam ?? storedWallet ?? '');
  }, [searchParams]);

  const validateWallet = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shopName.trim()) { setError('ショップ名を入力してください'); return; }
    if (!accountName.trim()) { setError('担当者名を入力してください'); return; }
    if (!email.trim()) { setError('メールアドレスを入力してください'); return; }
    if (!phone.trim()) { setError('電話番号を入力してください'); return; }
    if (!country) { setError('国・地域を選択してください'); return; }
    if (!validateWallet(walletAddress)) {
      setError('有効なウォレットアドレスを入力してください（0x から始まる42文字）');
      return;
    }
    if (!agreedTerms) { setError('利用規約およびプライバシーポリシーへの同意が必要です'); return; }
    if (!agreedBusiness) { setError('事業者利用の確認が必要です'); return; }
    if (!agreedAntisocial) { setError('反社会的勢力でないことの確認が必要です'); return; }

    const shopId = localStorage.getItem('streak-shop-id');
    if (!shopId) {
      setError('セッションが見つかりません。ウォレットを再接続してください。');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/shops/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          shopName: shopName.trim(),
          walletAddress: walletAddress.toLowerCase(),
          accountName: accountName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country,
          websiteUrl: websiteUrl.trim() || null,
          businessDescription: businessDescription.trim() || null,
          agreedTerms: true,
          agreedAntisocial: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // 409: 重複登録エラーはそのままメッセージを表示
        if (response.status === 409) {
          throw new Error(result.error);
        }
        throw new Error(result.detail ?? result.error ?? 'ショップの作成に失敗しました');
      }

      setSubmittedEmail(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">登録が完了しました！</h2>
        <p className="text-gray-500 font-light leading-relaxed">
          <strong className="text-gray-900 font-semibold">{submittedEmail}</strong> に確認メールを送信しました。<br />
          メール内のリンクをクリックしてメールアドレスを認証してください。
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-8 py-3 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/20 transition-all"
        >
          ダッシュボードへ →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">ショップをオープン</h1>
        <p className="text-gray-500 font-light">
          ショップ設定を完了して決済受け付けを開始しましょう
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ショップ名 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            ショップ名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="例：My Awesome Shop"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* 担当者名 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            担当者名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="例：山田 太郎"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900"
          />
          <p className="text-xs text-gray-500 font-light mt-2">確認メールを送信します</p>
        </div>

        {/* 電話番号 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例：080-1234-5678"
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* 国・地域 */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            国・地域 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light text-gray-900 bg-white appearance-none cursor-pointer"
            >
              <option value="">選択してください</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
          </div>
        </div>

        {/* 受取ウォレットアドレス */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            受取ウォレットアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            required
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 font-mono text-sm text-gray-900"
          />
          <p className="text-xs text-gray-500 font-light mt-2">
            売上はこのウォレットに直接送金されます（MetaMask のアドレスが自動入力されています）
          </p>
        </div>

        {/* ブロックチェーン（読み取り専用） */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">ブロックチェーン</label>
          <div className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 font-light text-gray-500">
            Polygon（USDC）
          </div>
        </div>

        {/* ウェブサイトURL（任意） */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            ウェブサイトURL
            <span className="ml-2 text-xs font-normal text-gray-400">任意</span>
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900"
          />
        </div>

        {/* 事業内容の説明（任意） */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            事業内容の説明
            <span className="ml-2 text-xs font-normal text-gray-400">任意</span>
          </label>
          <textarea
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="事業内容を簡単にご説明ください"
            rows={4}
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900 resize-none"
          />
        </div>

        {/* 同意チェックボックス */}
        <div className="space-y-4">
          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200">
            <input
              type="checkbox"
              id="agreedTerms"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-0 cursor-pointer mt-0.5 flex-shrink-0"
            />
            <label htmlFor="agreedTerms" className="text-sm text-gray-700 font-light cursor-pointer leading-relaxed">
              <a href="/terms" target="_blank" className="underline text-gray-900 hover:text-black">利用規約</a>および
              <a href="/privacy" target="_blank" className="underline text-gray-900 hover:text-black">プライバシーポリシー</a>
              に同意します <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200">
            <input
              type="checkbox"
              id="agreedBusiness"
              checked={agreedBusiness}
              onChange={(e) => setAgreedBusiness(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-0 cursor-pointer mt-0.5 flex-shrink-0"
            />
            <label htmlFor="agreedBusiness" className="text-sm text-gray-700 font-light cursor-pointer leading-relaxed">
              本サービスを事業者（個人事業主または法人）として利用します <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200">
            <input
              type="checkbox"
              id="agreedAntisocial"
              checked={agreedAntisocial}
              onChange={(e) => setAgreedAntisocial(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-0 cursor-pointer mt-0.5 flex-shrink-0"
            />
            <label htmlFor="agreedAntisocial" className="text-sm text-gray-700 font-light cursor-pointer leading-relaxed">
              反社会的勢力ではないことを確認します <span className="text-red-500">*</span>
            </label>
          </div>
        </div>

        {/* エラー */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-light">{error}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-full bg-black text-white font-semibold text-lg hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? '送信中...' : 'Launch My Shop'}
        </button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><p className="text-gray-400 font-light">Loading...</p></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

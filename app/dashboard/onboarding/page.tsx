'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shopName, setShopName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [email, setEmail] = useState('');
  const [businessConfirmed, setBusinessConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // URL パラメータからウォレットアドレスを取得（フォールバック: localStorage）
    const walletParam = searchParams.get('wallet');
    const storedWallet = localStorage.getItem('streak-wallet');
    setWalletAddress(walletParam ?? storedWallet ?? '');
  }, [searchParams]);

  const validateWallet = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shopName.trim()) {
      setError('ショップ名を入力してください');
      return;
    }
    if (!validateWallet(walletAddress)) {
      setError('有効なウォレットアドレスを入力してください（0x から始まる42文字）');
      return;
    }
    if (!businessConfirmed) {
      setError('事業者確認のチェックボックスにチェックを入れてください');
      return;
    }

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
          email: email.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Onboarding] API error:', result);
        throw new Error(result.detail ?? result.error ?? 'ショップの作成に失敗しました');
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      console.error('[Onboarding] Submit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">ショップをオープンしました！</h2>
        <p className="text-gray-500 font-light">ダッシュボードへ移動中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">ショップをオープン</h1>
        <p className="text-gray-500 font-light">
          ショップ設定を完了して決済受け付けを開始しましょう
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Shop Name */}
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

        {/* Receiving Wallet Address */}
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

        {/* Email（任意） */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            メールアドレス
            <span className="ml-2 text-xs font-normal text-gray-400">任意</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="notifications@example.com"
            className="w-full px-5 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 text-gray-900"
          />
          <p className="text-xs text-gray-500 font-light mt-2">取引通知に使用されます</p>
        </div>

        {/* Blockchain（読み取り専用） */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">ブロックチェーン</label>
          <div className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 font-light text-gray-500">
            Polygon（USDC）
          </div>
        </div>

        {/* Business Confirmation */}
        <div className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-200">
          <input
            type="checkbox"
            id="business"
            checked={businessConfirmed}
            onChange={(e) => setBusinessConfirmed(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-0 cursor-pointer mt-0.5 flex-shrink-0"
          />
          <label htmlFor="business" className="text-sm text-gray-700 font-light cursor-pointer leading-relaxed">
            本サービスを事業用（個人事業主または法人）として利用することを確認します。
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-light">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-full bg-black text-white font-semibold text-lg hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'オープン中...' : 'Launch My Shop'}
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

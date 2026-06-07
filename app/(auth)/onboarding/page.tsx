'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Language = 'EN' | 'JP';

const translations = {
  EN: {
    heading: 'Launch Your Shop',
    subheading: 'Complete your shop setup to start accepting payments',
    form: {
      shopName: 'Shop Name',
      shopNamePlaceholder: 'My Awesome Shop',
      walletAddress: 'Receiving Wallet Address',
      walletAddressPlaceholder: '0x...',
      email: 'Email Address (Optional)',
      emailPlaceholder: 'notifications@example.com',
      chain: 'Blockchain Network',
      chainValue: 'Polygon',
      businessConfirmation: 'I confirm that I am using this service as a business entity (sole proprietor or corporation).',
      launchButton: 'Launch My Shop',
      savingButton: 'Launching...',
      requiredField: 'This field is required',
      invalidWallet: 'Please enter a valid wallet address',
    },
    success: 'Shop launched successfully!',
    error: 'Failed to launch shop',
  },
  JP: {
    heading: 'ショップをオープン',
    subheading: 'ショップ設定を完了して決済受け付けを開始',
    form: {
      shopName: 'ショップ名',
      shopNamePlaceholder: '私のショップ',
      walletAddress: '受取ウォレットアドレス',
      walletAddressPlaceholder: '0x...',
      email: 'メールアドレス（任意）',
      emailPlaceholder: 'notifications@example.com',
      chain: 'ブロックチェーン',
      chainValue: 'Polygon',
      businessConfirmation: '本サービスを事業用（個人事業主または法人）として利用することを確認します。',
      launchButton: 'ショップをオープン',
      savingButton: 'オープン中...',
      requiredField: 'このフィールドは必須です',
      invalidWallet: '有効なウォレットアドレスを入力してください',
    },
    success: 'ショップがオープンしました！',
    error: 'ショップのオープンに失敗しました',
  },
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletAddress = searchParams.get('wallet') || '';

  const [language, setLanguage] = useState<Language>('EN');
  const [shopName, setShopName] = useState('');
  const [receivingWallet, setReceivingWallet] = useState(walletAddress);
  const [email, setEmail] = useState('');
  const [businessConfirmed, setBusinessConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const t = translations[language];

  const validateWallet = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!shopName.trim()) {
      setError(t.form.requiredField);
      return;
    }

    if (!receivingWallet.trim()) {
      setError(t.form.requiredField);
      return;
    }

    if (!validateWallet(receivingWallet)) {
      setError(t.form.invalidWallet);
      return;
    }

    if (!businessConfirmed) {
      setError(t.form.requiredField);
      return;
    }

    try {
      setIsLoading(true);

      // localStorage からショップIDを取得
      const shopId = localStorage.getItem('streak-shop-id');
      if (!shopId) {
        throw new Error('セッションが見つかりません。再度ウォレットを接続してください。');
      }

      const response = await fetch('/api/shops/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          shopName: shopName.trim(),
          walletAddress: receivingWallet.toLowerCase(),
          email: email.trim() || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail ?? result.error ?? t.error);
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <div className="flex gap-2 border border-gray-300 rounded-full p-1">
            <button
              onClick={() => setLanguage('EN')}
              className={`px-4 py-1 rounded-full transition-all font-medium text-sm ${
                language === 'EN'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('JP')}
              className={`px-4 py-1 rounded-full transition-all font-medium text-sm ${
                language === 'JP'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              JP
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {t.heading}
          </h1>
          <p className="text-lg text-gray-600 font-light">
            {t.subheading}
          </p>
        </div>

        {success ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t.success}
            </h2>
            <p className="text-gray-600 font-light">
              {language === 'EN' ? 'Redirecting to dashboard...' : 'ダッシュボードへリダイレクト中...'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t.form.shopName}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t.form.shopNamePlaceholder}
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400"
              />
            </div>

            {/* Receiving Wallet */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t.form.walletAddress}
              </label>
              <input
                type="text"
                value={receivingWallet}
                onChange={(e) => setReceivingWallet(e.target.value)}
                placeholder={t.form.walletAddressPlaceholder}
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 font-light mt-2">
                {language === 'EN' 
                  ? 'Funds will be sent to this wallet' 
                  : '資金はこのウォレットに送付されます'}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t.form.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.form.emailPlaceholder}
                className="w-full px-6 py-4 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 font-light mt-2">
                {language === 'EN' 
                  ? 'For transaction notifications and support' 
                  : '取引通知とサポートのため'}
              </p>
            </div>

            {/* Chain (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {t.form.chain}
              </label>
              <div className="w-full px-6 py-4 rounded-2xl border border-gray-300 bg-gray-50 font-light text-gray-700">
                {t.form.chainValue}
              </div>
            </div>

            {/* Business Confirmation Checkbox */}
            <div className="flex gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <input
                type="checkbox"
                id="business"
                checked={businessConfirmed}
                onChange={(e) => setBusinessConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-0 cursor-pointer mt-1 flex-shrink-0"
              />
              <label htmlFor="business" className="text-sm text-gray-900 font-light cursor-pointer">
                {t.form.businessConfirmation}
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-light">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg"
            >
              {isLoading ? t.form.savingButton : t.form.launchButton}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400 font-light">Loading...</p></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

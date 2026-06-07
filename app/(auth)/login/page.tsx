'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

type Language = 'EN' | 'JP';

const translations = {
  EN: {
    heading: 'Connect Your Wallet',
    subheading: 'Sign up or log in to start accepting payments',
    walletOption: 'Connect Wallet',
    emailOption: 'Sign up with Email',
    wallets: {
      metamask: 'MetaMask',
      walletconnect: 'WalletConnect',
      safepal: 'SafePal',
    },
    email: {
      label: 'Email Address',
      placeholder: 'you@example.com',
      button: 'Continue with Email',
      notice: "We'll send you a verification link",
    },
    footer: 'By continuing, you agree to our Terms of Service and Privacy Policy',
    errors: {
      walletNotConnected: 'Wallet not found. Please install MetaMask.',
      walletRejected: 'Wallet connection rejected',
      authError: 'Authentication failed',
    },
  },
  JP: {
    heading: 'ウォレットを接続',
    subheading: '決済受け付けを開始するには登録またはログイン',
    walletOption: 'ウォレットを接続',
    emailOption: 'メールで登録',
    wallets: {
      metamask: 'MetaMask',
      walletconnect: 'WalletConnect',
      safepal: 'SafePal',
    },
    email: {
      label: 'メールアドレス',
      placeholder: 'your@example.com',
      button: 'メールで続行',
      notice: '確認リンクをお送りします',
    },
    footer: '続行すると、利用規約とプライバシーポリシーに同意したものとみなされます',
    errors: {
      walletNotConnected: 'ウォレットが見つかりません。MetaMaskをインストールしてください。',
      walletRejected: 'ウォレット接続がキャンセルされました',
      authError: '認証に失敗しました',
    },
  },
};

// wagmi の connect/account フックを使う内部コンポーネント
function LoginInner({ language }: { language: Language }) {
  const router = useRouter();
  const t = translations[language];

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet');
  const [email, setEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // 接続完了後に API を呼ぶ（二重呼び出し防止）
  const calledRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !address || calledRef.current) return;
    calledRef.current = true;
    callWalletAuthAPI(address);
  }, [isConnected, address]);

  const callWalletAuthAPI = async (walletAddr: string) => {
    try {
      setIsAuthLoading(true);
      setError('');

      console.log('[Login] Calling /api/auth/wallet with address:', walletAddr);

      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddr }),
      });

      const data = await response.json();
      console.log('[Login] API response:', data);

      if (!response.ok) {
        throw new Error(data?.error ?? t.errors.authError);
      }

      // セッションを localStorage + Cookie に保存
      localStorage.setItem('streak-wallet', walletAddr);
      localStorage.setItem('streak-shop-id', data.shopId);
      const expires = new Date(Date.now() + 86_400_000).toUTCString();
      document.cookie = `streak-session=${data.shopId}; path=/; expires=${expires}; SameSite=Lax`;

      if (data.isNewUser) {
        router.push(`/dashboard/onboarding?wallet=${encodeURIComponent(walletAddr)}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('[Login] Auth error:', err);
      setError(err instanceof Error ? err.message : t.errors.authError);
      calledRef.current = false; // 再試行可能にする
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleWalletButtonClick = (walletName: string) => {
    setError('');
    calledRef.current = false;

    // すでに接続済みの場合は直接 API を呼ぶ
    if (isConnected && address) {
      calledRef.current = true;
      callWalletAuthAPI(address);
      return;
    }

    // walletName に対応する wagmi コネクターを探す
    const nameMap: Record<string, string[]> = {
      MetaMask: ['MetaMask', 'Injected'],
      WalletConnect: ['WalletConnect'],
      SafePal: ['SafePal', 'Injected'],
    };
    const candidates = nameMap[walletName] ?? [walletName];
    const connector = connectors.find((c) =>
      candidates.some((n) => c.name.toLowerCase().includes(n.toLowerCase()))
    );

    if (!connector) {
      setError(t.errors.walletNotConnected);
      return;
    }

    connect({ connector });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email signup:', email);
  };

  const isLoading = isConnecting || isAuthLoading;

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 pb-4 font-semibold text-sm transition-colors ${
            activeTab === 'wallet'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 border-b-2 border-transparent'
          }`}
        >
          {t.walletOption}
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 pb-4 font-semibold text-sm transition-colors ${
            activeTab === 'email'
              ? 'text-gray-900 border-b-2 border-black'
              : 'text-gray-500 border-b-2 border-transparent'
          }`}
        >
          {t.emailOption}
        </button>
      </div>

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-4 mb-8">
          {Object.entries(t.wallets).map(([key, name]) => (
            <button
              key={key}
              onClick={() => handleWalletButtonClick(name)}
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl border border-gray-300 hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-left font-semibold text-gray-900 flex items-center justify-between group"
            >
              <span>{name}</span>
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-gray-400 group-hover:text-gray-900 transition">→</span>
              )}
            </button>
          ))}

          {/* 接続済みアドレス表示 */}
          {isConnected && address && (
            <p className="text-xs text-gray-500 font-mono text-center pt-2">
              Connected: {address.slice(0, 6)}…{address.slice(-4)}
            </p>
          )}
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t.email.label}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email.placeholder}
              required
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 font-light mt-2">{t.email.notice}</p>
          </div>
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/30 transition-all duration-300"
          >
            {t.email.button}
          </button>
        </form>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-700 font-medium">エラー</p>
          <p className="text-xs text-red-600 font-light mt-1 whitespace-pre-wrap">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 font-light leading-relaxed text-center">
        {t.footer}
      </p>
    </>
  );
}

export default function LoginPage() {
  const [language, setLanguage] = useState<Language>('EN');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
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
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center gap-2 mb-12 border border-gray-300 rounded-full p-1 w-fit mx-auto">
          <button
            onClick={() => setLanguage('EN')}
            className={`px-4 py-1 rounded-full transition-all font-medium text-sm ${
              language === 'EN' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('JP')}
            className={`px-4 py-1 rounded-full transition-all font-medium text-sm ${
              language === 'JP' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            JP
          </button>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {translations[language].heading}
          </h1>
          <p className="text-lg text-gray-600 font-light">
            {translations[language].subheading}
          </p>
        </div>

        {/* wagmi hooks を使う内部コンポーネント（Provider の内側で呼ぶ必要がある） */}
        <LoginInner language={language} />
      </div>
    </div>
  );
}

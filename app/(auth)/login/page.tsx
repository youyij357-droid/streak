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
    wallets: {
      metamask: 'MetaMask',
      walletconnect: 'WalletConnect',
      safepal: 'SafePal',
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
    wallets: {
      metamask: 'MetaMask',
      walletconnect: 'WalletConnect',
      safepal: 'SafePal',
    },
    footer: '続行すると、利用規約とプライバシーポリシーに同意したものとみなされます',
    errors: {
      walletNotConnected: 'ウォレットが見つかりません。MetaMaskをインストールしてください。',
      walletRejected: 'ウォレット接続がキャンセルされました',
      authError: '認証に失敗しました',
    },
  },
};

function LoginInner({ language }: { language: Language }) {
  const router = useRouter();
  const t = translations[language];

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState('');

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

      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddr }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? t.errors.authError);
      }

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
      setError(err instanceof Error ? err.message : t.errors.authError);
      calledRef.current = false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleWalletButtonClick = (walletName: string) => {
    setError('');
    calledRef.current = false;

    if (isConnected && address) {
      calledRef.current = true;
      callWalletAuthAPI(address);
      return;
    }

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

  const isLoading = isConnecting || isAuthLoading;

  return (
    <>
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

        {isConnected && address && (
          <p className="text-xs text-gray-500 font-mono text-center pt-2">
            Connected: {address.slice(0, 6)}…{address.slice(-4)}
          </p>
        )}
      </div>

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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {translations[language].heading}
          </h1>
          <p className="text-lg text-gray-600 font-light">
            {translations[language].subheading}
          </p>
        </div>

        <LoginInner language={language} />
      </div>
    </div>
  );
}

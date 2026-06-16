'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

type Language = 'EN' | 'JP';

type WalletError = {
  message: string;
  link?: string;
  linkLabel?: string;
} | null;

// ─── ウォレット定義 ──────────────────────────────────────────

const WALLETS = [
  {
    key: 'metamask',
    name: 'MetaMask',
    subtitle: { EN: 'Browser Extension', JP: 'ブラウザ拡張機能' },
    type: 'injected' as const,
  },
  {
    key: 'safepal',
    name: 'SafePal',
    subtitle: { EN: 'SafePal App / Extension', JP: 'SafePalアプリ・拡張機能' },
    type: 'injected' as const,
  },
];

// ─── LoginInner ──────────────────────────────────────────────

function LoginInner({ language }: { language: Language }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState<WalletError>(null);
  // bool ではなく address 単位で「呼び出し済みか」を追跡する。
  // bool だと address が途中で変わった場合（再接続直後の一時値→確定値など）に
  // 二度目以降の呼び出しがブロックされたままになり、isConnected/address が
  // 揃っているのに遷移しない不具合の原因になっていた。
  const calledForRef = useRef<string | null>(null);

  const callWalletAuthAPI = async (walletAddr: string) => {
    try {
      setIsAuthLoading(true);
      setError(null);

      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddr }),
      });

      const data = await response.json();
      console.log('[login] /api/auth/wallet response', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data?.error ?? (language === 'EN' ? 'Authentication failed' : '認証に失敗しました'));
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
      console.error('[login] callWalletAuthAPI failed', err);
      setError({ message: err instanceof Error ? err.message : (language === 'EN' ? 'Authentication failed' : '認証に失敗しました') });
      calledForRef.current = null;
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    console.log('[login] wallet state changed', { isConnected, address, calledFor: calledForRef.current });
    if (!isConnected || !address) return;
    if (calledForRef.current === address) return;
    calledForRef.current = address;
    callWalletAuthAPI(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleConnect = (walletKey: string) => {
    setError(null);

    // 接続済みの場合は直接 API を呼ぶ
    if (isConnected && address) {
      calledForRef.current = address;
      callWalletAuthAPI(address);
      return;
    }

    calledForRef.current = null;

    // ウォレットが一切検出されない場合
    if (connectors.length === 0) {
      setError({
        message: language === 'EN'
          ? 'No wallet detected. Make sure MetaMask is installed and unlocked.'
          : 'ウォレットが検出されませんでした。MetaMaskがロック解除されているか確認してください。',
        link: 'https://metamask.io',
        linkLabel: '→ metamask.io',
      });
      return;
    }

    let connector;

    if (walletKey === 'safepal') {
      // SafePal: 名前・IDで優先検索、なければ injected にフォールバック
      connector = connectors.find((c) =>
        c.name.toLowerCase().includes('safepal') ||
        c.id.toLowerCase().includes('safepal')
      ) ?? connectors.find((c) =>
        c.type === 'injected' ||
        c.id === 'injected'
      );
    } else {
      // MetaMask: 名前・IDで優先検索、なければ injected にフォールバック
      connector = connectors.find((c) =>
        c.name.toLowerCase().includes('metamask') ||
        c.id.toLowerCase().includes('metamask')
      ) ?? connectors.find((c) =>
        c.type === 'injected' ||
        c.id === 'injected'
      );
    }

    if (!connector) {
      if (walletKey === 'safepal') {
        setError({
          message: language === 'EN'
            ? 'SafePal is not installed. Please install SafePal.'
            : 'SafePalをインストールしてください',
          link: 'https://safepal.io',
          linkLabel: '→ safepal.io',
        });
      } else {
        setError({
          message: language === 'EN'
            ? 'MetaMask is not installed. Please install MetaMask.'
            : 'MetaMaskをインストールしてください',
          link: 'https://metamask.io',
          linkLabel: '→ metamask.io',
        });
      }
      return;
    }

    connect({ connector });
  };

  const isLoading = isConnecting || isAuthLoading;

  return (
    <>
      <div className="space-y-3 mb-8">
        {WALLETS.map((wallet) => (
          <button
            key={wallet.key}
            onClick={() => handleConnect(wallet.key)}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl border border-gray-300 hover:border-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-left font-semibold text-gray-900 flex items-center justify-between group"
          >
            <span className="flex flex-col gap-0.5">
              <span>{wallet.name}</span>
              <span className="text-xs font-normal text-gray-400 group-hover:text-gray-500">
                {wallet.subtitle[language]}
              </span>
            </span>
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <span className="text-gray-400 group-hover:text-gray-900 transition flex-shrink-0">→</span>
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
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 space-y-1">
          <p className="text-sm text-red-600 font-light">{error.message}</p>
          {error.link && (
            <a
              href={error.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-red-700 underline hover:text-red-900"
            >
              {error.linkLabel ?? error.link}
            </a>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 font-light leading-relaxed text-center">
        {language === 'EN'
          ? 'By continuing, you agree to our Terms of Service and Privacy Policy'
          : '続行すると、利用規約とプライバシーポリシーに同意したものとみなされます'}
      </p>
    </>
  );
}

// ─── LoginPage ───────────────────────────────────────────────

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
            {language === 'EN' ? 'Connect Your Wallet' : 'ウォレットを接続'}
          </h1>
          <p className="text-lg text-gray-600 font-light">
            {language === 'EN'
              ? 'Sign up or log in to start accepting payments'
              : '決済受け付けを開始するには登録またはログイン'}
          </p>
        </div>

        <LoginInner language={language} />
      </div>
    </div>
  );
}

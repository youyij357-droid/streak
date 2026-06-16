'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyReady } from '@/app/providers';
import { CrossmintProvider, CrossmintHostedCheckout } from '@crossmint/client-sdk-react-ui';

const USDC_POLYGON = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359') as `0x${string}`;

const STREAK_CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  '0x78E11bf03f113526fd48c661811Bca1c23bC4F15') as `0x${string}`;

// USDC.approve(spender, amount)
const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// StreakPayment.pay(merchant, totalPrice) → 97.5% / 2.5% 自動分配
const STREAK_PAYMENT_ABI = [
  {
    name: 'pay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'merchant', type: 'address' },
      { name: 'totalPrice', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

interface Shop {
  id: string;
  shop_name: string;
  wallet_address: string;
  crossmint_api_key?: string;
}

interface Product {
  id: string;
  name: string;
  price_usdc: number;
  price_jpy: number | null;
  description?: string;
  category: string;
  is_published: boolean;
}

// ─── 決済完了画面 ────────────────────────────────────────────

function ThankYouView({ shopName, txHash }: { shopName: string; txHash: string }) {
  const polygonScanUrl = `https://polygonscan.com/tx/${txHash}`;
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Complete</h1>
          <p className="text-gray-500 font-light mt-2">
            Thank you for your purchase from{' '}
            <span className="text-gray-900 font-medium">{shopName}</span>.
          </p>
          <p className="text-gray-400 font-light text-sm mt-1">
            Your transaction has been confirmed on the blockchain.
          </p>
        </div>
        <a
          href={polygonScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition"
        >
          PolygonScanで確認 →
        </a>
      </div>
    </div>
  );
}

// ─── ウォレット決済（approve → pay 2ステップ）──────────────

function WalletPayment({
  shop,
  product,
  priceUsdc,
  priceJpy,
  onSuccess,
}: {
  shop: Shop;
  product: Product;
  priceUsdc: number;
  priceJpy: number | null;
  onSuccess: (txHash: string) => void;
}) {
  const payTriggered = useRef(false);
  const orderSaved = useRef(false);
  const [error, setError] = useState('');

  const amount = BigInt(Math.round(priceUsdc * 1_000_000));

  // ── Step 1: USDC approve ──────────────────────────────────
  const {
    writeContract: approveWrite,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // ── Step 2: StreakPayment.pay() ───────────────────────────
  const {
    writeContract: payWrite,
    data: payTxHash,
    isPending: isPayPending,
    error: payError,
  } = useWriteContract();

  const { isLoading: isPayConfirming, isSuccess: isPayConfirmed } =
    useWaitForTransactionReceipt({ hash: payTxHash });

  // approve 確認済み → pay() を自動発火
  useEffect(() => {
    if (isApproveConfirmed && !payTriggered.current) {
      payTriggered.current = true;
      payWrite({
        address: STREAK_CONTRACT,
        abi: STREAK_PAYMENT_ABI,
        functionName: 'pay',
        args: [shop.wallet_address as `0x${string}`, amount],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveConfirmed]);

  // pay 確認済み → 注文保存 → 完了画面
  useEffect(() => {
    if (isPayConfirmed && payTxHash && !orderSaved.current) {
      orderSaved.current = true;
      saveOrderAndNotify(payTxHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPayConfirmed, payTxHash]);

  // approve エラー
  useEffect(() => {
    if (approveError) setError(approveError.message.split('\n')[0]);
  }, [approveError]);

  // pay エラー
  useEffect(() => {
    if (payError) {
      setError(payError.message.split('\n')[0]);
      payTriggered.current = false;
    }
  }, [payError]);

  const saveOrderAndNotify = async (hash: string) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shop.id,
          productId: product.id,
          txHash: hash,
          paymentMethod: 'wallet',
          amountUsdc: priceUsdc,
        }),
      });
    } catch {
      // order save failure does not block the thank-you flow
    }
    onSuccess(hash);
  };

  const handlePay = () => {
    setError('');
    payTriggered.current = false;
    orderSaved.current = false;
    approveWrite({
      address: USDC_POLYGON,
      abi: ERC20_APPROVE_ABI,
      functionName: 'approve',
      args: [STREAK_CONTRACT, amount],
    });
  };

  // ── 状態の集約 ────────────────────────────────────────────
  const isApproving = isApprovePending || isApproveConfirming;
  const isPaying = isPayPending || isPayConfirming;
  const isBusy = isApproving || isPaying;

  let stepLabel = '';
  if (isApprovePending)    stepLabel = 'ウォレットでUSDCの承認を確認してください';
  else if (isApproveConfirming) stepLabel = 'USDCの承認を確認中...';
  else if (isPayPending)   stepLabel = 'ウォレットで決済を確認してください';
  else if (isPayConfirming) stepLabel = '決済を処理中...';

  // ── ローディング（2ステップ表示）─────────────────────────
  if (isBusy) {
    return (
      <div className="space-y-6 text-center py-2">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />

        <div className="space-y-3 max-w-xs mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                isApproveConfirmed
                  ? 'bg-green-500 text-white'
                  : isApproving
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isApproveConfirmed ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : '1'}
            </div>
            <p className={`text-sm text-left ${
              isApproveConfirmed ? 'text-gray-400 line-through' : isApproving ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}>
              Step 1/2: USDCの承認
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                isPaying ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              2
            </div>
            <p className={`text-sm text-left ${isPaying ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              Step 2/2: 決済処理
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 font-light">{stepLabel}</p>

        {(payTxHash ?? approveTxHash) && (
          <p className="text-xs text-gray-300 font-mono break-all">
            {payTxHash ?? approveTxHash}
          </p>
        )}
      </div>
    );
  }

  // ── 決済ボタン ────────────────────────────────────────────
  const payLabel = priceJpy
    ? `Pay ¥${priceJpy.toLocaleString('ja-JP')} (${priceUsdc.toFixed(4)} USDC)`
    : `Pay ${priceUsdc.toFixed(2)} USDC`;

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-500 text-center font-light">{error}</p>
      )}
      <button
        onClick={handlePay}
        className="w-full py-4 rounded-xl bg-black text-white font-semibold text-lg hover:shadow-lg hover:shadow-black/20 transition-all"
      >
        {payLabel}
      </button>
      <p className="text-xs text-gray-400 font-light text-center">
        Powered by StreakPayment · 2.5% fee settled on-chain
      </p>
    </div>
  );
}

// ─── クレカ / Apple / Google Pay ─────────────────────────────

function CrossmintPayment({
  shop,
  product,
  priceUsdc,
  language,
}: {
  shop: Shop;
  product: Product;
  priceUsdc: number;
  language: 'ja' | 'en';
}) {
  const apiKey = shop.crossmint_api_key || process.env.NEXT_PUBLIC_CROSSMINT_API_KEY || '';
  const collectionLocator = process.env.NEXT_PUBLIC_CROSSMINT_COLLECTION_LOCATOR || '';

  const isConfigured = /^(ck|sk)/.test(apiKey) && collectionLocator.length > 0;

  if (!isConfigured) {
    return (
      <div className="p-5 rounded-xl border border-gray-100 bg-gray-50 text-center space-y-1">
        <p className="text-sm text-gray-500 font-medium">
          {language === 'ja' ? 'クレジットカード決済は現在準備中です。' : 'Credit card payment is coming soon.'}
        </p>
        <p className="text-sm text-gray-400 font-light">
          {language === 'ja'
            ? 'MetaMaskまたはウォレットでのお支払いをご利用ください。'
            : 'Please use MetaMask or your wallet to pay.'}
        </p>
      </div>
    );
  }

  return (
    <CrossmintProvider apiKey={apiKey}>
      <div className="space-y-3">
        <CrossmintHostedCheckout
          lineItems={{
            collectionLocator,
            callData: {
              totalPrice: priceUsdc.toFixed(6),
              recipient: shop.wallet_address,
            },
          }}
          payment={{
            fiat: { enabled: true, defaultCurrency: 'usd' },
            crypto: { enabled: false },
          }}
          recipient={{ walletAddress: shop.wallet_address }}
          className="w-full py-4 rounded-xl bg-white border-2 border-black text-black font-semibold text-lg hover:bg-gray-50 transition-all"
        />
        <p className="text-xs text-gray-400 font-light text-center">
          Credit card · Apple Pay · Google Pay via Crossmint
        </p>
      </div>
    </CrossmintProvider>
  );
}

// ─── ウォレット接続オプション ─────────────────────────────────

function WalletConnectOptions({
  shopId,
  productId,
  language,
  onPrivyLogin,
}: {
  shopId: string;
  productId: string;
  language: 'ja' | 'en';
  onPrivyLogin?: () => void;
}) {
  const metamaskDeepLink = `https://metamask.app.link/dapp/streak-kohl.vercel.app/pay/${shopId}/${productId}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 font-light text-center">
        {language === 'ja'
          ? 'Polygon上のUSDCでお支払いください'
          : 'Pay with USDC on Polygon'}
      </p>

      {onPrivyLogin && (
        <button
          type="button"
          onClick={onPrivyLogin}
          className="w-full py-4 rounded-xl bg-black text-white font-semibold text-base hover:shadow-lg hover:shadow-black/20 transition-all"
        >
          {language === 'ja' ? 'メール・Googleでログイン' : 'Sign in with Email / Google'}
        </button>
      )}

      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-light text-center">
          {language === 'ja' ? 'または MetaMask で接続' : 'Or connect with MetaMask'}
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>

      <a
        href={metamaskDeepLink}
        className="block w-full py-4 rounded-xl border-2 border-black text-black font-semibold text-base text-center hover:bg-gray-50 transition-all"
      >
        {language === 'ja' ? 'MetaMaskアプリ（スマホ）' : 'MetaMask App (Mobile)'}
      </a>
    </div>
  );
}

// ─── ウォレット接続（Privy対応）─────────────────────────────────

function PrivyWalletConnect({
  shop,
  product,
  shopId,
  productId,
  priceUsdc,
  priceJpy,
  language,
  onSuccess,
}: {
  shop: Shop;
  product: Product;
  shopId: string;
  productId: string;
  priceUsdc: number;
  priceJpy: number | null;
  language: 'ja' | 'en';
  onSuccess: (txHash: string) => void;
}) {
  const { login, authenticated, user } = usePrivy();
  const { isConnected } = useAccount();

  const hasPrivyWallet = authenticated && !!user?.wallet?.address;
  const isWalletReady = hasPrivyWallet || isConnected;

  if (isWalletReady) {
    return (
      <WalletPayment
        shop={shop}
        product={product}
        priceUsdc={priceUsdc}
        priceJpy={priceJpy}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <WalletConnectOptions
      shopId={shopId}
      productId={productId}
      language={language}
      onPrivyLogin={login}
    />
  );
}

function WalletConnectSection({
  shop,
  product,
  shopId,
  productId,
  priceUsdc,
  priceJpy,
  language,
  onSuccess,
}: {
  shop: Shop;
  product: Product;
  shopId: string;
  productId: string;
  priceUsdc: number;
  priceJpy: number | null;
  language: 'ja' | 'en';
  onSuccess: (txHash: string) => void;
}) {
  const privyReady = usePrivyReady();
  const { isConnected } = useAccount();

  if (privyReady) {
    return (
      <PrivyWalletConnect
        shop={shop}
        product={product}
        shopId={shopId}
        productId={productId}
        priceUsdc={priceUsdc}
        priceJpy={priceJpy}
        language={language}
        onSuccess={onSuccess}
      />
    );
  }

  if (isConnected) {
    return (
      <WalletPayment
        shop={shop}
        product={product}
        priceUsdc={priceUsdc}
        priceJpy={priceJpy}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <WalletConnectOptions
      shopId={shopId}
      productId={productId}
      language={language}
    />
  );
}

// ─── メインコンポーネント ─────────────────────────────────────

export default function PaymentClient({
  shopId,
  productId,
  shop,
  product,
  priceJpy,
  priceUsdc,
  rateJpy,
  rateUpdatedAt,
}: {
  shopId: string;
  productId: string;
  shop: Shop;
  product: Product;
  priceJpy: number | null;
  priceUsdc: number;
  rateJpy: number | null;
  rateUpdatedAt: string | null;
}) {
  const [method, setMethod] = useState<'wallet' | 'crossmint'>('wallet');
  const [doneTxHash, setDoneTxHash] = useState<string | null>(null);

  const language: 'ja' | 'en' =
    typeof navigator !== 'undefined' && navigator.language.startsWith('ja') ? 'ja' : 'en';

  if (doneTxHash) {
    return <ThankYouView shopName={shop.shop_name} txHash={doneTxHash} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-12 space-y-8">

        {/* Shop Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            {shop.shop_name}
          </p>
        </div>

        {/* Product Card */}
        <div className="rounded-2xl border border-gray-200 p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-sm text-gray-500 font-light leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right space-y-0.5">
              {priceJpy != null ? (
                <>
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    ¥{priceJpy.toLocaleString('ja-JP')}
                  </p>
                  <p className="text-sm text-gray-500">≈ {priceUsdc.toFixed(2)} USDC</p>
                  {rateJpy != null && (
                    <p className="text-xs text-gray-400">
                      Rate: 1 USDC = ¥{rateJpy.toFixed(2)}
                      {rateUpdatedAt && (
                        <span className="ml-1 text-gray-300">({rateUpdatedAt})</span>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold tracking-tight text-gray-900">
                    ${priceUsdc.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 font-light">USDC</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="space-y-4">
          <div className="flex rounded-xl border border-gray-200 p-1 gap-1">
            <button
              onClick={() => setMethod('wallet')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'wallet' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => setMethod('crossmint')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'crossmint' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Card / Apple / Google Pay
            </button>
          </div>

          <div className="py-2">
            {method === 'wallet' ? (
              <WalletConnectSection
                shop={shop}
                product={product}
                shopId={shopId}
                productId={productId}
                priceUsdc={priceUsdc}
                priceJpy={priceJpy}
                language={language}
                onSuccess={(hash) => setDoneTxHash(hash)}
              />
            ) : (
              <CrossmintPayment
                shop={shop}
                product={product}
                priceUsdc={priceUsdc}
                language={language}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 font-light">
          Powered by Streak · 2.5% fee · Instant settlement
        </p>
      </div>
    </div>
  );
}

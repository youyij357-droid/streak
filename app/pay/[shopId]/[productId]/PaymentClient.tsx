'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CrossmintProvider, CrossmintHostedCheckout } from '@crossmint/client-sdk-react-ui';

const USDC_POLYGON = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as const;

const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
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
  description?: string;
  category: string;
  is_published: boolean;
}

function ThankYouView({ shopName }: { shopName: string }) {
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
            Thank you for your purchase from <span className="text-gray-900 font-medium">{shopName}</span>.
          </p>
          <p className="text-gray-400 font-light text-sm mt-1">
            Your transaction has been confirmed on the blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}

function WalletPayment({
  shop,
  product,
  onSuccess,
}: {
  shop: Shop;
  product: Product;
  onSuccess: (txHash: string) => void;
}) {
  const { isConnected } = useAccount();
  const orderSaved = useRef(false);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConfirmed && txHash && !orderSaved.current) {
      orderSaved.current = true;
      saveOrderAndNotify(txHash);
    }
  }, [isConfirmed, txHash]);

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
          amountUsdc: product.price_usdc,
        }),
      });
    } catch {
      // order save failure does not block the thank-you flow
    }
    onSuccess(hash);
  };

  const handlePay = () => {
    const amount = BigInt(Math.round(product.price_usdc * 1_000_000));
    writeContract({
      address: USDC_POLYGON,
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [shop.wallet_address as `0x${string}`, amount],
    });
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500 font-light text-center">
          Connect your wallet to pay with USDC on Polygon
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isPending || isConfirming) {
    return (
      <div className="space-y-3 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-600 font-light">
          {isPending ? 'Confirm in your wallet…' : 'Waiting for blockchain confirmation…'}
        </p>
        {txHash && (
          <p className="text-xs text-gray-400 font-mono break-all">{txHash}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {writeError && (
        <p className="text-sm text-red-500 text-center font-light">
          {writeError.message.split('\n')[0]}
        </p>
      )}
      <button
        onClick={handlePay}
        className="w-full py-4 rounded-xl bg-black text-white font-semibold text-lg hover:shadow-lg hover:shadow-black/20 transition-all"
      >
        Pay ${product.price_usdc.toFixed(2)} USDC
      </button>
      <p className="text-xs text-gray-400 font-light text-center">
        Sends USDC on Polygon via MetaMask / SafePal
      </p>
    </div>
  );
}

function CrossmintPayment({
  shop,
  product,
  language,
}: {
  shop: Shop;
  product: Product;
  language: 'ja' | 'en';
}) {
  const apiKey = shop.crossmint_api_key || process.env.NEXT_PUBLIC_CROSSMINT_API_KEY || '';
  const collectionLocator = process.env.NEXT_PUBLIC_CROSSMINT_COLLECTION_LOCATOR || '';

  // "ck" または "sk" で始まる場合のみ有効とみなす
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
              totalPrice: product.price_usdc.toString(),
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

export default function PaymentClient({
  shop,
  product,
}: {
  shop: Shop;
  product: Product;
}) {
  const [method, setMethod] = useState<'wallet' | 'crossmint'>('wallet');
  const [isDone, setIsDone] = useState(false);

  // ブラウザ言語を判定（ja → 日本語、それ以外 → 英語）
  const language: 'ja' | 'en' =
    typeof navigator !== 'undefined' && navigator.language.startsWith('ja') ? 'ja' : 'en';

  if (isDone) {
    return <ThankYouView shopName={shop.shop_name} />;
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
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-sm text-gray-500 font-light leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-bold tracking-tight text-gray-900">
                ${product.price_usdc.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 font-light">USDC</p>
            </div>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="space-y-4">
          <div className="flex rounded-xl border border-gray-200 p-1 gap-1">
            <button
              onClick={() => setMethod('wallet')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'wallet'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Wallet
            </button>
            <button
              onClick={() => setMethod('crossmint')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                method === 'crossmint'
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Card / Apple / Google Pay
            </button>
          </div>

          {/* Payment Form */}
          <div className="py-2">
            {method === 'wallet' ? (
              <WalletPayment
                shop={shop}
                product={product}
                onSuccess={() => setIsDone(true)}
              />
            ) : (
              <CrossmintPayment shop={shop} product={product} language={language} />
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

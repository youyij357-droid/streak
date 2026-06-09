'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const COUNTRIES = [
  { value: 'JP', label: '日本' },
  { value: 'US', label: 'アメリカ' },
  { value: 'SG', label: 'シンガポール' },
  { value: 'HK', label: '香港' },
  { value: 'OTHER', label: 'その他' },
];

interface ShopData {
  shop_name: string;
  wallet_address: string;
  email: string | null;
  crossmint_api_key: string | null;
  account_name: string | null;
  phone: string | null;
  country: string | null;
  email_verified: boolean;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function SettingsPage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  // 編集可能フィールド
  const [email, setEmail] = useState('');
  const [crossmintKey, setCrossmintKey] = useState('');
  const [accountName, setAccountName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');

  const [showKey, setShowKey] = useState(false);
  const [notifyPayments, setNotifyPayments] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const sid = localStorage.getItem('streak-shop-id');
    if (!sid) { setIsLoading(false); return; }
    setShopId(sid);

    const notify = localStorage.getItem('streak-notify-payments');
    setNotifyPayments(notify !== 'false');

    const supabase = createClient();
    supabase
      .from('shops')
      .select('shop_name, wallet_address, email, crossmint_api_key, account_name, phone, country, email_verified')
      .eq('id', sid)
      .single<ShopData>()
      .then(({ data }) => {
        if (data) {
          setShop(data);
          setEmail(data.email ?? '');
          setCrossmintKey(data.crossmint_api_key ?? '');
          setAccountName(data.account_name ?? '');
          setPhone(data.phone ?? '');
          setCountry(data.country ?? '');
          setEmailVerified(data.email_verified ?? false);
        }
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!shopId) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/shops/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          email,
          crossmintApiKey: crossmintKey,
          accountName,
          phone,
          country,
        }),
      });

      if (!res.ok) throw new Error('save failed');

      localStorage.setItem('streak-notify-payments', notifyPayments.toString());
      setShop(prev =>
        prev
          ? { ...prev, email, crossmint_api_key: crossmintKey, account_name: accountName, phone, country }
          : prev
      );
      showToast('Saved!');
    } catch {
      showToast('保存に失敗しました。', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!shopId || !email) return;
    setIsResending(true);
    try {
      const res = await fetch('/api/shops/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, email }),
      });
      if (!res.ok) throw new Error();
      showToast('認証メールを再送しました');
    } catch {
      showToast('再送に失敗しました', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const polygonScanUrl = shop?.wallet_address
    ? `https://polygonscan.com/address/${shop.wallet_address}`
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-600 font-light mt-2">Manage your account and preferences</p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600 font-light">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">

          {/* ショップ情報（読み取り専用） */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900">ショップ情報</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                ショップ名
              </label>
              <p className="text-sm font-medium text-gray-900 py-3 px-4 rounded-lg bg-gray-50 border border-gray-200">
                {shop?.shop_name ?? '—'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                ウォレットアドレス
              </label>
              <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm font-mono text-gray-700 truncate flex-1">
                  {shop?.wallet_address ?? '—'}
                </p>
                {polygonScanUrl && (
                  <a
                    href={polygonScanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-gray-500 hover:text-black transition border border-gray-300 rounded-full px-3 py-1"
                  >
                    PolygonScan ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900">連絡先情報</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                担当者名
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition text-sm font-light placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                電話番号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080-1234-5678"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition text-sm font-light placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                国・地域
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition text-sm text-gray-900 bg-white appearance-none cursor-pointer"
                >
                  <option value="">選択してください</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900">通知設定</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition text-sm font-light placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1.5">決済通知・重要なお知らせの送信先</p>

              {/* メール認証ステータス */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    認証済み
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-600">
                      未認証
                    </span>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending || !email}
                      className="text-xs font-medium text-gray-600 underline hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {isResending ? '送信中...' : '認証メールを再送する'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-900">決済完了通知</p>
                <p className="text-xs text-gray-500 font-light mt-0.5">
                  決済が完了するたびにメール通知を受け取る
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyPayments(!notifyPayments)}
                className={`relative w-12 h-6 rounded-full transition-colors ${notifyPayments ? 'bg-black' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifyPayments ? 'translate-x-6' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Crossmint API Key */}
          <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900">Crossmint 設定</h2>
            <p className="text-sm text-gray-500 font-light -mt-2">
              クレジットカード・ApplePay・GooglePayでの決済を有効にする
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                API キー
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={crossmintKey}
                  onChange={(e) => setCrossmintKey(e.target.value)}
                  placeholder="ck_production_..."
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition text-sm font-light placeholder-gray-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                >
                  <EyeIcon open={showKey} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Crossmint ダッシュボードから取得。<code className="text-gray-600">ck</code> または <code className="text-gray-600">sk</code> で始まるキー
              </p>
            </div>
          </div>

          {/* プラン */}
          <div className="rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">プラン</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-900">
                    Free Plan
                  </span>
                  <span className="text-xs text-gray-500 font-light">手数料 2.5% · 上限なし</span>
                </div>
              </div>
              <button
                disabled
                className="px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-400 cursor-not-allowed"
              >
                Upgrade (Coming Soon)
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 rounded-full bg-black text-white font-semibold text-sm hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Saving...' : '設定を保存'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full text-sm font-semibold shadow-lg ${
            toast.type === 'success' ? 'bg-black text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

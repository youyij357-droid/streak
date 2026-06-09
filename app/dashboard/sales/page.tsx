'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Order = {
  id: string;
  created_at: string;
  amount_usdc: number;
  payment_method: string;
  tx_hash: string;
  status: string;
  products: { name: string; price_jpy: number | null } | null;
};

function MethodBadge({ method }: { method: string }) {
  const isWallet = method === 'wallet';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isWallet ? 'bg-gray-100 text-gray-700' : 'bg-gray-900 text-white'
      }`}
    >
      {isWallet ? 'Wallet' : 'Card'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
      {status === 'completed' ? '完了' : status}
    </span>
  );
}

export default function SalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const shopId = localStorage.getItem('streak-shop-id');
    if (!shopId) { setIsLoading(false); return; }

    const supabase = createClient();
    supabase
      .from('orders')
      .select('id, created_at, amount_usdc, payment_method, tx_hash, status, products(name, price_jpy)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (err) { setError('データの取得に失敗しました'); }
        else { setOrders((data ?? []) as unknown as Order[]); }
        setIsLoading(false);
      });
  }, []);

  const totalUsdc = orders.reduce((s, o) => s + (o.amount_usdc ?? 0), 0);
  const hasJpy = orders.some((o) => o.products?.price_jpy != null);
  const totalJpy = hasJpy
    ? orders.reduce((s, o) => s + (o.products?.price_jpy ?? 0), 0)
    : null;

  const fmt = (dt: string) =>
    new Date(dt).toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Sales</h1>
        <p className="text-gray-600 font-light mt-2">取引履歴と売上サマリー</p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 font-light">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600 text-sm font-light">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 p-5 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">総取引数</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">{orders.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-5 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">総売上 (USDC)</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">
                {totalUsdc.toFixed(2)}
                <span className="text-base font-normal text-gray-400 ml-1">USDC</span>
              </p>
            </div>
            {totalJpy != null && (
              <div className="rounded-2xl border border-gray-200 p-5 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">総売上 (円換算)</p>
                <p className="text-3xl font-bold tracking-tight text-gray-900">
                  ¥{totalJpy.toLocaleString('ja-JP')}
                </p>
              </div>
            )}
          </div>

          {/* Table */}
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500 font-light">まだ取引がありません</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">日時</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">商品名</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">金額</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">決済方法</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">TXハッシュ</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-gray-600 font-light whitespace-nowrap text-xs">
                          {fmt(order.created_at)}
                        </td>
                        <td className="px-5 py-4 text-gray-900 font-medium">
                          {order.products?.name ?? '—'}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {order.products?.price_jpy != null ? (
                            <div>
                              <p className="font-semibold text-gray-900">
                                ¥{order.products.price_jpy.toLocaleString('ja-JP')}
                              </p>
                              <p className="text-xs text-gray-400 font-light">
                                {(order.amount_usdc ?? 0).toFixed(2)} USDC
                              </p>
                            </div>
                          ) : (
                            <p className="font-semibold text-gray-900">
                              {(order.amount_usdc ?? 0).toFixed(2)} USDC
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <MethodBadge method={order.payment_method} />
                        </td>
                        <td className="px-5 py-4">
                          {order.tx_hash ? (
                            <a
                              href={`https://polygonscan.com/tx/${order.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-gray-500 hover:text-black transition underline"
                            >
                              {order.tx_hash.slice(0, 8)}…{order.tx_hash.slice(-6)}
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

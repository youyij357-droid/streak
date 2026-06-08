'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Shop {
  id: string;
  shop_name: string;
  wallet_address: string;
  email: string | null;
  crossmint_api_key: string | null;
  is_published: boolean;
  created_at: string;
  product_count: number;
  fee_rate?: number | null;
}

interface Order {
  id: string;
  created_at: string;
  shop_id: string;
  shop_name: string;
  product_name: string;
  amount_usdc: number;
  streak_fee: number;
  payment_method: string;
  tx_hash: string;
  status: string;
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 font-light">{sub}</p>}
    </div>
  );
}

function TxLink({ hash }: { hash: string }) {
  if (!hash) return <span className="text-gray-300">—</span>;
  return (
    <a
      href={`https://polygonscan.com/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-gray-600 hover:text-black transition underline"
    >
      {hash.slice(0, 8)}…{hash.slice(-6)}
    </a>
  );
}

export default function AdminDashboardPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fee edit state
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [feeInput, setFeeInput] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/shops').then((r) => r.json()),
      fetch('/api/admin/orders').then((r) => r.json()),
    ])
      .then(([shopRes, orderRes]) => {
        if (shopRes.error || orderRes.error) {
          setError('データの取得に失敗しました');
        } else {
          setShops(shopRes.data ?? []);
          setOrders(orderRes.data ?? []);
        }
      })
      .catch(() => setError('ネットワークエラー'))
      .finally(() => setLoading(false));
  }, []);

  // ── Summary metrics ────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyOrders = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const monthlyVolume = monthlyOrders.reduce((s, o) => s + (o.amount_usdc || 0), 0);
  const totalRevenue = orders.reduce((s, o) => s + (o.streak_fee || 0), 0);

  // ── Revenue chart (past 30 days) ───────────────────────────
  const chartData = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const dateStr = d.toISOString().slice(0, 10);
    const revenue = orders
      .filter((o) => o.created_at.slice(0, 10) === dateStr)
      .reduce((s, o) => s + (o.streak_fee || 0), 0);
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, revenue };
  });

  // ── Handlers ───────────────────────────────────────────────
  const handleToggleStatus = async (shop: Shop) => {
    const newStatus = !shop.is_published;
    const res = await fetch('/api/admin/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shop.id, updates: { is_published: newStatus } }),
    });
    if (res.ok) {
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, is_published: newStatus } : s))
      );
    }
  };

  const handleSaveFee = async (shopId: string) => {
    const rate = parseFloat(feeInput);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    const res = await fetch('/api/admin/shops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, updates: { fee_rate: rate } }),
    });
    if (res.ok) {
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, fee_rate: rate } : s))
      );
    }
    setEditingFeeId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 font-light mt-1 text-sm">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ① サマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="総加盟店数"
          value={shops.length.toString()}
          sub={`アクティブ: ${shops.filter((s) => s.is_published).length}`}
        />
        <SummaryCard
          label="今月の取引額"
          value={`${monthlyVolume.toFixed(2)} USDC`}
          sub={`${monthlyOrders.length} 件`}
        />
        <SummaryCard
          label="今月の取引件数"
          value={monthlyOrders.length.toString()}
          sub="completed orders"
        />
        <SummaryCard
          label="Streak 総収益"
          value={`${totalRevenue.toFixed(4)} USDC`}
          sub="全取引 streak_fee 合計"
        />
      </div>

      {/* ④ 収益グラフ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">日別 Streak 収益</h2>
        <p className="text-xs text-gray-400 font-light mb-6">過去30日（USDC）</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tickFormatter={(v) => `${Number(v ?? 0).toFixed(2)}`}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              formatter={(value) => [`${Number(value ?? 0).toFixed(4)} USDC`, 'Revenue']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'none' }}
              cursor={{ fill: '#f9fafb' }}
            />
            <Bar dataKey="revenue" fill="#111111" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ② 加盟店一覧 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">加盟店一覧</h2>
          <span className="text-xs text-gray-400">{shops.length} shops</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ショップ名', 'ウォレット', 'メール', '登録日', '商品数', 'ステータス', 'Crossmint', '手数料', 'アクション'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {shop.shop_name || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {shop.wallet_address
                      ? `${shop.wallet_address.slice(0, 6)}…${shop.wallet_address.slice(-4)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{shop.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {shop.created_at
                      ? new Date(shop.created_at).toLocaleDateString('ja-JP')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 font-medium">
                    {shop.product_count}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        shop.is_published
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {shop.is_published ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${/^(ck|sk)/.test(shop.crossmint_api_key ?? '') ? 'text-green-600' : 'text-gray-300'}`}>
                      {/^(ck|sk)/.test(shop.crossmint_api_key ?? '') ? '○' : '×'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editingFeeId === shop.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={feeInput}
                          onChange={(e) => setFeeInput(e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-black"
                        />
                        <button
                          onClick={() => handleSaveFee(shop.id)}
                          className="text-xs font-medium text-white bg-black px-2 py-1 rounded hover:bg-gray-800 transition"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingFeeId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingFeeId(shop.id);
                          setFeeInput(String(shop.fee_rate ?? 2.5));
                        }}
                        className="text-xs text-gray-500 hover:text-black transition underline whitespace-nowrap"
                      >
                        {shop.fee_rate != null ? `${shop.fee_rate}%` : '2.5%'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(shop)}
                      className={`text-xs font-medium px-3 py-1 rounded-full border transition whitespace-nowrap ${
                        shop.is_published
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {shop.is_published ? '停止' : '有効化'}
                    </button>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 font-light text-sm">
                    加盟店なし
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ③ 全取引履歴 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">全取引履歴</h2>
          <span className="text-xs text-gray-400">{orders.length} orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['日時', 'ショップ', '商品', '金額 (USDC)', '手数料 (USDC)', '決済方法', 'TX Hash', 'ステータス'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(order.created_at).toLocaleString('ja-JP', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                    {order.shop_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-light">{order.product_name}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {(order.amount_usdc || 0).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(order.streak_fee || 0).toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{order.payment_method}</td>
                  <td className="px-4 py-3">
                    <TxLink hash={order.tx_hash} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 font-light text-sm">
                    取引なし
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

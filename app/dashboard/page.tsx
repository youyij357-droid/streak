'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
}

interface Transaction {
  id: string;
  date: string;
  product_name: string;
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
}

interface MonthlyData {
  month: string;
  sales: number;
}

interface MethodData {
  name: string;
  value: number;
}

function SummaryCard({ label, value, subtext }: SummaryCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-400 transition-all">
      <p className="text-sm text-gray-600 font-light mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      {subtext && <p className="text-xs text-gray-500 font-light">{subtext}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    success: 'bg-gray-100 text-gray-900',
    pending: 'bg-gray-100 text-gray-600',
    failed: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const DONUT_COLORS = ['#111111', '#CCCCCC', '#888888'];

function jpyFormatter(value: number) {
  if (value >= 10000) return `¥${(value / 10000).toFixed(0)}万`;
  return `¥${value.toLocaleString('ja-JP')}`;
}

export default function DashboardPage() {
  const [shopName, setShopName] = useState('Merchant');
  const [totalVolume, setTotalVolume] = useState('0.00');
  const [transactionCount, setTransactionCount] = useState('0');
  const [activeProducts, setActiveProducts] = useState('0');
  const [successRate, setSuccessRate] = useState('0%');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [methodData, setMethodData] = useState<MethodData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [crossmintConfigured, setCrossmintConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        const shopId = localStorage.getItem('streak-shop-id');

        // Get shop info
        const { data: shopData } = await supabase
          .from('shops')
          .select('shop_name, crossmint_api_key')
          .limit(1)
          .single();

        if (shopData?.shop_name) {
          setShopName(shopData.shop_name);
        }
        setCrossmintConfigured(/^(ck|sk)/.test(shopData?.crossmint_api_key ?? ''));

        // Get orders for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, amount_usdc, payment_method, status, created_at, product_id')
          .gte('created_at', monthStart)
          .order('created_at', { ascending: false })
          .limit(100);

        if (ordersData) {
          const successfulOrders = ordersData.filter(o => o.status === 'completed' || o.status === 'success');
          const totalVol = successfulOrders.reduce((sum, o) => sum + (o.amount_usdc || 0), 0);
          const successRateValue = ordersData.length > 0
            ? Math.round((successfulOrders.length / ordersData.length) * 100)
            : 0;

          setTotalVolume(totalVol.toFixed(2));
          setTransactionCount(ordersData.length.toString());
          setSuccessRate(`${successRateValue}%`);

          // Recent transactions with product names
          const recent = await Promise.all(
            ordersData.slice(0, 5).map(async (order) => {
              const { data: productData } = await supabase
                .from('products')
                .select('name')
                .eq('id', order.product_id)
                .single();

              return {
                id: order.id,
                date: new Date(order.created_at).toLocaleDateString('ja-JP'),
                product_name: productData?.name || 'Unknown Product',
                amount: order.amount_usdc,
                method: order.payment_method,
                status: (order.status === 'completed' ? 'success' : order.status) as Transaction['status'],
              };
            })
          );
          setRecentTransactions(recent);
        }

        // Active products count
        const { data: productsData } = await supabase
          .from('products')
          .select('id')
          .eq('is_published', true);

        if (productsData) {
          setActiveProducts(productsData.length.toString());
        }

        // ── 過去6ヶ月グラフデータ ──────────────────────────────
        if (shopId) {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
          sixMonthsAgo.setDate(1);
          sixMonthsAgo.setHours(0, 0, 0, 0);

          const { data: chartOrders } = await supabase
            .from('orders')
            .select('created_at, amount_usdc, payment_method, product_id')
            .eq('shop_id', shopId)
            .gte('created_at', sixMonthsAgo.toISOString());

          if (chartOrders && chartOrders.length > 0) {
            // 商品価格(JPY)を取得
            const productIds = [...new Set(chartOrders.map(o => o.product_id))];
            const { data: productPrices } = await supabase
              .from('products')
              .select('id, price_jpy')
              .in('id', productIds);

            const priceMap: Record<string, number | null> = Object.fromEntries(
              (productPrices || []).map(p => [p.id, p.price_jpy])
            );

            // 月別集計
            const months = [...Array(6)].map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - 5 + i);
              return { year: d.getFullYear(), month: d.getMonth(), label: `${d.getMonth() + 1}月` };
            });

            const monthly = months.map(({ year, month, label }) => {
              const mo = chartOrders.filter(o => {
                const d = new Date(o.created_at);
                return d.getFullYear() === year && d.getMonth() === month;
              });
              const sales = mo.reduce((sum, o) => {
                const jpy = priceMap[o.product_id];
                return sum + (jpy != null ? jpy : Math.round(o.amount_usdc * 150));
              }, 0);
              return { month: label, sales };
            });
            setMonthlyData(monthly);

            // 決済方法集計
            const methodCounts: Record<string, number> = {};
            chartOrders.forEach(o => {
              const key = o.payment_method === 'wallet' ? 'Wallet' : 'Card';
              methodCounts[key] = (methodCounts[key] || 0) + 1;
            });
            setMethodData(Object.entries(methodCounts).map(([name, value]) => ({ name, value })));
          } else {
            // データなし時もラベルだけ表示
            const months = [...Array(6)].map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - 5 + i);
              return { month: `${d.getMonth() + 1}月`, sales: 0 };
            });
            setMonthlyData(months);
          }
        }
      } catch {
        // fetch failure is silent; UI shows placeholder values
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {greeting}, {shopName}
        </h1>
        <p className="text-gray-600 font-light mt-2">
          Welcome to your Streak dashboard
        </p>
      </div>

      {/* Crossmint 未設定バナー */}
      {crossmintConfigured === false && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-6 py-4 bg-white gap-4">
          <p className="text-sm text-gray-700 font-light">
            <span className="font-semibold text-gray-900">クレカ決済を有効化しませんか？</span>
            {' '}Crossmint を設定するとカード払い・Apple Pay・Google Pay に対応できます。
          </p>
          <a
            href="/dashboard/payment-setup"
            className="shrink-0 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:shadow-lg hover:shadow-black/20 transition-all"
          >
            設定する →
          </a>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          label="Total Volume (This Month)"
          value={`${totalVolume} USDC`}
          subtext="Successful transactions"
        />
        <SummaryCard
          label="Transactions"
          value={transactionCount}
          subtext="This month"
        />
        <SummaryCard
          label="Active Products"
          value={activeProducts}
          subtext="Published and live"
        />
        <SummaryCard
          label="Success Rate"
          value={successRate}
          subtext="Transaction completion"
        />
      </div>

      {/* Charts */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 月間売上グラフ */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 p-6 bg-white">
            <h2 className="text-base font-bold text-gray-900 mb-1">月間売上</h2>
            <p className="text-xs text-gray-400 font-light mb-6">過去6ヶ月（円建て）</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={jpyFormatter}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(value) => [`¥${Number(value ?? 0).toLocaleString('ja-JP')}`, '売上']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'none' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="sales" fill="#111111" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 決済方法の内訳 */}
          <div className="rounded-2xl border border-gray-200 p-6 bg-white">
            <h2 className="text-base font-bold text-gray-900 mb-1">決済方法</h2>
            <p className="text-xs text-gray-400 font-light mb-6">過去6ヶ月</p>
            {methodData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-gray-400 font-light">データなし</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={methodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {methodData.map((_, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [Number(value ?? 0), 'transactions']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 mt-2 justify-center">
                  {methodData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span className="text-xs text-gray-600">{d.name}</span>
                      <span className="text-xs font-semibold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Recent Transactions
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 font-light">Loading...</p>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 font-light">
              No transactions yet. Your first sale will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-light">{tx.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-light">{tx.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {tx.amount.toFixed(2)} USDC
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-light">{tx.method}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

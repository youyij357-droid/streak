'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

export default function DashboardPage() {
  const [shopName, setShopName] = useState('Merchant');
  const [totalVolume, setTotalVolume] = useState('0.00');
  const [transactionCount, setTransactionCount] = useState('0');
  const [activeProducts, setActiveProducts] = useState('0');
  const [successRate, setSuccessRate] = useState('0%');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();

        // Get shop info
        const { data: shopData } = await supabase
          .from('shops')
          .select('shop_name')
          .limit(1)
          .single();

        if (shopData?.shop_name) {
          setShopName(shopData.shop_name);
        }

        // Get orders for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, amount_usdc, method, status, created_at, product_id')
          .gte('created_at', monthStart)
          .order('created_at', { ascending: false })
          .limit(100);

        if (ordersData) {
          // Calculate summary metrics
          const successfulOrders = ordersData.filter(o => o.status === 'success');
          const totalVol = successfulOrders.reduce((sum, o) => sum + (o.amount_usdc || 0), 0);
          const successRateValue = ordersData.length > 0 
            ? Math.round((successfulOrders.length / ordersData.length) * 100)
            : 0;

          setTotalVolume(totalVol.toFixed(2));
          setTransactionCount(ordersData.length.toString());
          setSuccessRate(`${successRateValue}%`);

          // Get recent transactions with product names
          const recentOrdersWithProducts = await Promise.all(
            ordersData.slice(0, 5).map(async (order) => {
              const { data: productData } = await supabase
                .from('products')
                .select('name')
                .eq('id', order.product_id)
                .single();

              return {
                id: order.id,
                date: new Date(order.created_at).toLocaleDateString(),
                product_name: productData?.name || 'Unknown Product',
                amount: order.amount_usdc,
                method: order.method,
                status: order.status,
              };
            })
          );

          setRecentTransactions(recentOrdersWithProducts);
        }

        // Get active products count
        const { data: productsData } = await supabase
          .from('products')
          .select('id')
          .eq('is_published', true);

        if (productsData) {
          setActiveProducts(productsData.length.toString());
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-light">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-light">
                      {tx.product_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {tx.amount.toFixed(2)} USDC
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-light">
                      {tx.method}
                    </td>
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

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { jpyToUsdc } from '@/lib/exchange/rate';

interface Product {
  id: string;
  name: string;
  price_jpy: number | null;
  price_usdc: number;
  category: string;
  description?: string;
  is_published: boolean;
}

function ProductModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    priceJpy: number;
    priceUsdcSnapshot: number;
    description: string;
    category: string;
    is_published: boolean;
  }) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    priceJpy: '',
    description: '',
    category: 'Digital',
    is_published: true,
  });
  const [usdcRate, setUsdcRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRateLoading(true);
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=jpy')
      .then((r) => r.json())
      .then((d) => setUsdcRate(d['usd-coin'].jpy))
      .catch(() => setUsdcRate(null))
      .finally(() => setRateLoading(false));
  }, [isOpen]);

  const priceJpyNum = parseFloat(formData.priceJpy) || 0;
  const priceUsdcPreview =
    usdcRate && priceJpyNum ? jpyToUsdc(priceJpyNum, usdcRate).toFixed(4) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const snapshotRate = usdcRate ?? 150;
    await onSave({
      name: formData.name,
      priceJpy: priceJpyNum,
      priceUsdcSnapshot: jpyToUsdc(priceJpyNum, snapshotRate),
      description: formData.description,
      category: formData.category,
      is_published: formData.is_published,
    });
    setFormData({ name: '', priceJpy: '', description: '', category: 'Digital', is_published: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Product</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Digital Art Collection"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">価格（円）</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium select-none">
                ¥
              </span>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.priceJpy}
                onChange={(e) => setFormData({ ...formData, priceJpy: e.target.value })}
                placeholder="10000"
                required
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              {rateLoading
                ? 'レート取得中...'
                : usdcRate
                ? `現在のレート：1 USDC ≈ ¥${usdcRate.toFixed(0)}${priceUsdcPreview ? ` / ≈ ${priceUsdcPreview} USDC` : ''}`
                : 'レート取得に失敗しました（フォールバック: 1 USDC = ¥150）'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition font-light placeholder-gray-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition font-light"
            >
              <option value="Digital">Digital</option>
              <option value="Physical">Physical</option>
              <option value="Service">Service</option>
              <option value="NFT">NFT</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
            <label className="text-sm font-semibold text-gray-900">Publish Immediately</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
              className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_published ? 'bg-black' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_published ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg bg-black text-white font-semibold hover:shadow-lg disabled:opacity-50 transition"
            >
              {isLoading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopError, setShopError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const storedShopId = localStorage.getItem('streak-shop-id');

    if (!storedShopId) {
      setShopError('セッションが見つかりません。ウォレットを再接続してください。');
      setIsInitialLoad(false);
      return;
    }

    setShopId(storedShopId);
    fetchProducts(storedShopId);
  }, []);

  const fetchProducts = async (sid: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', sid)
        .order('created_at', { ascending: false });

      if (error) {
        setShopError(`商品取得エラー: ${error.message}`);
        return;
      }

      setProducts(data || []);
    } catch {
      setShopError('商品の読み込みに失敗しました。');
    } finally {
      setIsInitialLoad(false);
    }
  };

  const handleCopyLink = async (productId: string) => {
    const link = `${window.location.origin}/pay/${shopId}/${productId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveProduct = async (formData: {
    name: string;
    priceJpy: number;
    priceUsdcSnapshot: number;
    description: string;
    category: string;
    is_published: boolean;
  }) => {
    if (!shopId) return;

    try {
      setIsLoading(true);
      const supabase = createClient();

      const { error } = await supabase.from('products').insert([{
        shop_id: shopId,
        name: formData.name,
        price_jpy: formData.priceJpy,
        price_usdc: formData.priceUsdcSnapshot,
        description: formData.description || null,
        category: formData.category,
        is_published: formData.is_published,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      await fetchProducts(shopId);
    } catch (err: any) {
      setShopError(err?.message ?? '商品の保存に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    if (!shopId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ is_published: !currentStatus })
      .eq('id', productId)
      .eq('shop_id', shopId);

    if (!error) await fetchProducts(shopId);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    if (!shopId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('shop_id', shopId);

    if (!error) await fetchProducts(shopId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-gray-600 font-light mt-2">Manage your products and payment links</p>
        </div>
        <button
          onClick={() => {
            if (!shopId) return;
            setIsModalOpen(true);
          }}
          className="px-6 py-3 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/30 transition-all"
        >
          + Add Product
        </button>
      </div>

      {/* エラーバナー */}
      {shopError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">エラー</p>
            <p className="text-sm text-red-600 font-light mt-1">{shopError}</p>
          </div>
          <a
            href="/login"
            className="shrink-0 px-4 py-2 rounded-full border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
          >
            再ログイン
          </a>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        {isInitialLoad ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 font-light">Loading...</p>
          </div>
        ) : products.length === 0 && !shopError ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 font-light mb-6">
              No products yet. Create your first product to get started.
            </p>
            {shopId && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-block px-6 py-3 rounded-full bg-black text-white font-semibold hover:shadow-lg transition-all"
              >
                Create Product
              </button>
            )}
          </div>
        ) : !shopError ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Payment Link</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{product.name}</td>
                    <td className="px-6 py-4">
                      {product.price_jpy != null ? (
                        <div>
                          <p className="text-sm text-gray-900 font-semibold">
                            ¥{product.price_jpy.toLocaleString('ja-JP')}
                          </p>
                          <p className="text-xs text-gray-400 font-light">
                            ≈ ${product.price_usdc.toFixed(2)} USDC
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-900 font-semibold">
                          ${product.price_usdc.toFixed(2)} USDC
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-light">{product.category}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(product.id, product.is_published)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          product.is_published ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {product.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono truncate max-w-[180px]">
                          /pay/{shopId?.slice(0, 8)}…/{product.id.slice(0, 8)}…
                        </span>
                        <button
                          onClick={() => handleCopyLink(product.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                            copiedId === product.id
                              ? 'bg-black text-white border-black'
                              : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                          }`}
                        >
                          {copiedId === product.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-sm text-gray-600 hover:text-red-600 font-light transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        isLoading={isLoading}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_usdc: number;
  status: 'draft' | 'active' | 'archived';
  payment_links?: Array<{ slug: string; status: 'active' | 'disabled' }>;
};

export default function ProductsPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsdc, setPriceUsdc] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setError('');
    setIsLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('ログインが必要です。');
      setIsLoading(false);
      return;
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (merchantError) {
      setError(merchantError.message);
      setIsLoading(false);
      return;
    }

    if (!merchant) {
      setError('先に加盟店初期設定を完了してください。');
      setIsLoading(false);
      return;
    }

    setMerchantId(merchant.id);

    const { data, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price_usdc, status, payment_links(slug, status)')
      .eq('merchant_id', merchant.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (productsError) {
      setError(productsError.message);
    } else {
      setProducts((data ?? []) as Product[]);
    }

    setIsLoading(false);
  }

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!merchantId) {
      setError('加盟店情報が見つかりません。');
      return;
    }

    const parsedPrice = Number(priceUsdc);
    if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('商品名と0より大きいUSDC価格を入力してください。');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          merchant_id: merchantId,
          status: 'active',
          name: name.trim(),
          description: description.trim() || null,
          price_usdc: parsedPrice,
        })
        .select('id')
        .single();

      if (productError) throw productError;

      const slug = crypto.randomUUID().replaceAll('-', '').slice(0, 20);
      const { error: linkError } = await supabase.from('payment_links').insert({
        merchant_id: merchantId,
        product_id: product.id,
        slug,
        status: 'active',
      });

      if (linkError) throw linkError;

      setName('');
      setDescription('');
      setPriceUsdc('');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveProduct(productId: string) {
    const supabase = createClient();
    const { error: archiveError } = await supabase
      .from('products')
      .update({ status: 'archived' })
      .eq('id', productId);

    if (archiveError) {
      setError(archiveError.message);
      return;
    }

    await loadProducts();
  }

  async function copyPaymentLink(slug: string) {
    const url = `${window.location.origin}/pay/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 1600);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">商品管理</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          MVPではUSDC固定価格の商品を登録し、商品ごとに決済リンクを発行します。
        </p>
      </div>

      <form onSubmit={handleCreateProduct} className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_160px]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-900">商品名</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-input"
              placeholder="オンライン講座"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-900">価格 USDC</span>
            <input
              value={priceUsdc}
              onChange={(event) => setPriceUsdc(event.target.value)}
              type="number"
              min="0"
              step="0.000001"
              className="field-input"
              placeholder="100"
            />
          </label>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium text-slate-900">商品説明</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="field-input resize-none"
          />
        </label>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || !merchantId}
          className="mt-5 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? '保存中...' : '商品を登録してリンクを発行'}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-950">登録済み商品</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">まだ商品がありません。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">商品</th>
                  <th className="px-6 py-3 font-medium">価格</th>
                  <th className="px-6 py-3 font-medium">状態</th>
                  <th className="px-6 py-3 font-medium">決済リンク</th>
                  <th className="px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const activeLink = product.payment_links?.find((link) => link.status === 'active');
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-950">{product.name}</p>
                        {product.description && (
                          <p className="mt-1 max-w-md truncate text-slate-500">{product.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-950">
                        {Number(product.price_usdc).toFixed(6)} USDC
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {activeLink ? (
                          <button
                            type="button"
                            onClick={() => copyPaymentLink(activeLink.slug)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium transition hover:border-slate-950"
                          >
                            {copiedSlug === activeLink.slug ? 'コピー済み' : 'リンクをコピー'}
                          </button>
                        ) : (
                          <span className="text-slate-400">未発行</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => archiveProduct(product.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          停止
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

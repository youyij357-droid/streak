import Link from "next/link";
import { redirect } from "next/navigation";
import { formatJpy, formatUsdc } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createProduct, toggleProduct, updateProduct } from "../actions";
import { CopyPathButton } from "../CopyPathButton";
import { signOutAdmin } from "../login/actions";

export const metadata = {
  title: "商品管理 | STREAK",
};

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const fieldClassName =
  "h-10 w-full rounded-md border border-[#d8dee4] bg-white px-3 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";
const textareaClassName =
  "min-h-20 w-full rounded-md border border-[#d8dee4] bg-white p-3 text-sm outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/15";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=supabase-env-missing");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: shops } = await supabase.from("shops").select("*").order("created_at", { ascending: true });
  const activeShop = shops?.[0] ?? null;
  const { data: products } = activeShop
    ? await supabase.from("products").select("*").eq("shop_id", activeShop.id).order("created_at", { ascending: false })
    : { data: [] };
  const jpyPerUsdc = Number(activeShop?.jpy_per_usdc ?? 160);

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#1f2328]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="border-b border-[#d8dee4] bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="block text-lg font-semibold tracking-[0.18em]" href="/">STREAK</Link>
          <p className="mt-1 text-xs text-[#656d76]">管理コンソール</p>
          <nav className="mt-8 grid gap-1 text-sm font-medium">
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin">ダッシュボード</Link>
            <Link className="rounded-md bg-[#f0f3ff] px-3 py-2 text-[#3431a8]" href="/admin/products">商品</Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/settings">店舗設定</Link>
            <Link className="rounded-md px-3 py-2 text-[#59636e] hover:bg-[#f6f8fa]" href="/admin/payment-methods">決済手段</Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#d8dee4] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold">商品管理</h1>
                <p className="mt-1 text-sm text-[#656d76]">商品ページと決済ページを管理します。</p>
              </div>
              <form action={signOutAdmin}>
                <button className="inline-flex h-10 items-center rounded-md border border-[#d8dee4] bg-white px-4 text-sm font-semibold hover:bg-[#f6f8fa]">ログアウト</button>
              </form>
            </div>
          </header>

          <div className="grid gap-6 px-5 py-6 sm:px-8 xl:grid-cols-[1fr_420px]">
            <section className="rounded-lg border border-[#d8dee4] bg-white">
              <div className="border-b border-[#d8dee4] px-5 py-4">
                <h2 className="text-base font-semibold">商品一覧</h2>
                <p className="mt-1 text-sm text-[#656d76]">商品詳細ページと決済ページは別々に開けます。</p>
              </div>
              {params.success ? <p className="m-5 rounded-md bg-[#f1faef] p-3 text-sm text-[#176b32]">保存しました。</p> : null}
              {params.error ? <p className="m-5 rounded-md bg-[#fff4ef] p-3 text-sm text-[#8c2f16]">{params.error}</p> : null}
              {products?.length ? (
                <div className="divide-y divide-[#edf0f2]">
                  {products.map((product) => {
                    const productPath = `/product/${product.id}`;
                    const paymentPath = `/pay/${product.id}`;
                    const displayPriceJpy = Number(product.price_jpy ?? Math.round(Number(product.price_usdc ?? 0) * jpyPerUsdc));

                    return (
                      <div className="grid gap-4 px-5 py-4" key={product.id}>
                        <form action={updateProduct} className="grid gap-4 xl:grid-cols-[1.2fr_150px_96px_220px_76px] xl:items-start">
                          <input name="next" type="hidden" value="/admin/products" />
                          <input name="product_id" type="hidden" value={product.id} />
                          <div className="grid gap-2">
                            <input className={fieldClassName} defaultValue={product.name} name="name" required />
                            <textarea className={textareaClassName} defaultValue={product.description ?? ""} name="description" placeholder="商品説明" />
                          </div>
                          <div className="grid gap-2">
                            <input className={fieldClassName} defaultValue={displayPriceJpy} min="1" name="price_jpy" step="1" type="number" required />
                            <p className="text-xs text-[#656d76]">{formatUsdc(product.price_usdc)} USDC</p>
                          </div>
                          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${product.active ? "bg-[#e9f8ef] text-[#176b32]" : "bg-[#f1f3f5] text-[#59636e]"}`}>
                            {product.active ? "公開中" : "非公開"}
                          </span>
                          <div className="grid gap-2">
                            <p className="truncate font-mono text-xs text-[#59636e]">{productPath}</p>
                            <div className="flex flex-wrap gap-2">
                              <Link className="inline-flex h-9 items-center rounded-md border border-[#d8dee4] px-3 text-xs font-semibold hover:bg-[#f6f8fa]" href={productPath}>商品</Link>
                              <Link className="inline-flex h-9 items-center rounded-md border border-[#d8dee4] px-3 text-xs font-semibold hover:bg-[#f6f8fa]" href={paymentPath}>決済</Link>
                              <CopyPathButton label="コピー" path={productPath} />
                            </div>
                          </div>
                          <button className="h-9 rounded-md bg-[#635bff] px-3 text-xs font-semibold text-white">保存</button>
                        </form>
                        <form action={toggleProduct}>
                          <input name="next" type="hidden" value="/admin/products" />
                          <input name="product_id" type="hidden" value={product.id} />
                          <input name="active" type="hidden" value={product.active ? "false" : "true"} />
                          <button className="h-9 rounded-md border border-[#d8dee4] px-3 text-xs font-semibold hover:bg-[#f6f8fa]">
                            {product.active ? "非公開にする" : "公開する"}
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-5 py-8 text-sm text-[#656d76]">商品はまだありません。</p>
              )}
            </section>

            <aside className="rounded-lg border border-[#d8dee4] bg-white">
              <div className="border-b border-[#d8dee4] px-5 py-4">
                <h2 className="text-base font-semibold">商品を作成</h2>
                <p className="mt-1 text-sm text-[#656d76]">円で登録するとUSDC決済額を自動計算します。</p>
              </div>
              {activeShop ? (
                <form action={createProduct} className="grid gap-4 p-5">
                  <input name="next" type="hidden" value="/admin/products" />
                  <input name="shop_id" type="hidden" value={activeShop.id} />
                  <label className="grid gap-2 text-sm font-medium">商品名<input className={fieldClassName} name="name" required /></label>
                  <label className="grid gap-2 text-sm font-medium">価格（円）<input className={fieldClassName} min="1" name="price_jpy" step="1" type="number" required /></label>
                  <label className="grid gap-2 text-sm font-medium">商品説明<textarea className={textareaClassName} name="description" /></label>
                  <p className="text-xs text-[#656d76]">現在の自動換算: 1 USDC = {formatJpy(jpyPerUsdc)}</p>
                  <button className="h-10 rounded-md bg-[#1f2328] px-4 text-sm font-semibold text-white">商品を作成</button>
                </form>
              ) : (
                <p className="p-5 text-sm text-[#656d76]">先に店舗設定を作成してください。</p>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

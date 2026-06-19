import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUsdc } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAdmin } from "./login/actions";
import {
  createProduct,
  createShop,
  toggleProduct,
  updateOrderStatus,
  updateShop,
} from "./actions";

export const metadata = {
  title: "Admin Dashboard | STREAK",
};

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
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

  const { data: shopRows } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: true });
  const shops = shopRows ?? [];
  const activeShop = shops[0] ?? null;

  const { data: productRows } = activeShop
    ? await supabase
        .from("products")
        .select("*")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const products = productRows ?? [];

  const { data: orderRows } = activeShop
    ? await supabase
        .from("orders")
        .select("*, products(name)")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };
  const orders = orderRows ?? [];

  const paidTotal = orders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + Number(order.amount_usdc ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-4 border-b border-[#d7d9ce] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
              STREAK
            </Link>
            <p className="mt-2 text-sm text-[#65705f]">Admin dashboard</p>
          </div>
          <form action={signOutAdmin}>
            <button className="inline-flex h-11 items-center justify-center rounded-md border border-[#c3c7b9] px-5 text-sm font-semibold text-[#171a16] transition hover:border-[#171a16]">
              Sign out
            </button>
          </form>
        </header>

        {params.error ? (
          <p className="mt-6 border border-[#e7b8a7] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
            {params.error}
          </p>
        ) : null}

        <section className="grid gap-4 py-8 md:grid-cols-4">
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">Shop</p>
            <p className="mt-3 text-2xl font-semibold">{shops.length}</p>
          </article>
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">Products</p>
            <p className="mt-3 text-2xl font-semibold">{products.length}</p>
          </article>
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">Orders</p>
            <p className="mt-3 text-2xl font-semibold">{orders.length}</p>
          </article>
          <article className="border border-[#d7d9ce] bg-white p-5">
            <p className="text-sm text-[#65705f]">Paid USDC</p>
            <p className="mt-3 text-2xl font-semibold">{formatUsdc(paidTotal)}</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="border border-[#d7d9ce] bg-white p-6">
            <h1 className="text-2xl font-semibold">Shop settings</h1>
            {activeShop ? (
              <form action={updateShop} className="mt-5 grid gap-4">
                <input name="shop_id" type="hidden" value={activeShop.id} />
                <label className="grid gap-2 text-sm font-medium">
                  Shop name
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.name}
                    name="name"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Payment wallet
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.wallet_address ?? ""}
                    name="wallet_address"
                    placeholder="0x..."
                  />
                </label>
                <p className="text-sm text-[#65705f]">
                  Public shop slug: <span className="font-mono">{activeShop.slug}</span>
                </p>
                <button className="h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
                  Save shop
                </button>
              </form>
            ) : (
              <form action={createShop} className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Shop name
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="name"
                    placeholder="STREAK demo shop"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Slug
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="slug"
                    placeholder="streak-demo"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Payment wallet
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="wallet_address"
                    placeholder="0x..."
                  />
                </label>
                <button className="h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white">
                  Create shop
                </button>
              </form>
            )}
          </article>

          <article className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">Create product</h2>
            {activeShop ? (
              <form action={createProduct} className="mt-5 grid gap-4 md:grid-cols-2">
                <input name="shop_id" type="hidden" value={activeShop.id} />
                <label className="grid gap-2 text-sm font-medium">
                  Product name
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    name="name"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Price USDC
                  <input
                    className="h-11 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                    min="0.01"
                    name="price_usdc"
                    step="0.000001"
                    type="number"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium md:col-span-2">
                  Description
                  <textarea
                    className="min-h-24 border border-[#c3c7b9] p-3 outline-none focus:border-[#171a16]"
                    name="description"
                  />
                </label>
                <button className="h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white md:col-span-2">
                  Create product
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-[#65705f]">Create a shop first.</p>
            )}
          </article>
        </section>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_1fr]">
          <article className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">Products</h2>
            <div className="mt-5 grid gap-3">
              {products.length ? (
                products.map((product) => (
                  <div
                    className="grid gap-4 border border-[#edf0e8] p-4 md:grid-cols-[1fr_auto]"
                    key={product.id}
                  >
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-[#65705f]">
                        {formatUsdc(product.price_usdc)} USDC ·{" "}
                        {product.active ? "Active" : "Hidden"}
                      </p>
                      <Link
                        className="mt-3 inline-flex text-sm font-semibold underline"
                        href={`/pay/${product.id}`}
                      >
                        Open payment page
                      </Link>
                    </div>
                    <form action={toggleProduct}>
                      <input name="product_id" type="hidden" value={product.id} />
                      <input
                        name="active"
                        type="hidden"
                        value={product.active ? "false" : "true"}
                      />
                      <button className="h-10 rounded-md border border-[#c3c7b9] px-4 text-sm font-semibold">
                        {product.active ? "Hide" : "Activate"}
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#65705f]">No products yet.</p>
              )}
            </div>
          </article>

          <article className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-2xl font-semibold">Orders</h2>
            <div className="mt-5 grid gap-3">
              {orders.length ? (
                orders.map((order) => (
                  <form
                    action={updateOrderStatus}
                    className="grid gap-3 border border-[#edf0e8] p-4"
                    key={order.id}
                  >
                    <input name="order_id" type="hidden" value={order.id} />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {order.products?.name ?? "Deleted product"}
                        </h3>
                        <p className="mt-1 text-sm text-[#65705f]">
                          {formatUsdc(order.amount_usdc)} USDC · {order.status}
                        </p>
                        <p className="mt-1 text-xs text-[#65705f]">
                          {order.buyer_email || "No buyer email"}
                        </p>
                      </div>
                      <select
                        className="h-10 border border-[#c3c7b9] bg-white px-3 text-sm"
                        defaultValue={order.status}
                        name="status"
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="expired">expired</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                    <input
                      className="h-10 border border-[#c3c7b9] px-3 text-sm outline-none focus:border-[#171a16]"
                      defaultValue={order.payment_tx_hash ?? ""}
                      name="payment_tx_hash"
                      placeholder="Transaction hash"
                    />
                    <button className="h-10 rounded-md bg-[#171a16] px-4 text-sm font-semibold text-white">
                      Update order
                    </button>
                  </form>
                ))
              ) : (
                <p className="text-sm text-[#65705f]">No orders yet.</p>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

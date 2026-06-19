import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatUsdc,
  isTransactionHash,
  isWalletAddress,
} from "@/lib/format";
import { getPaymentNetwork, paymentNetworkExplorerTxUrl } from "@/lib/payment-networks";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAdmin } from "./login/actions";
import {
  createProduct,
  createShop,
  toggleProduct,
  updateProduct,
  updateOrderStatus,
  updateShop,
} from "./actions";

export const metadata = {
  title: "Admin Dashboard | STREAK",
};

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const successMessages: Record<string, string> = {
  "shop-created": "Shop was created.",
  "shop-updated": "Shop settings were saved.",
  "product-created": "Product was created.",
  "product-updated": "Product was updated.",
  "order-updated": "Order was updated.",
};

const errorMessages: Record<string, string> = {
  "invalid-tx-hash":
    "Transaction hash must start with 0x and contain 64 hexadecimal characters. Clear wallet addresses from this field.",
  "merchant-wallet-missing": "Merchant wallet is not set.",
  "order-not-found": "Order was not found.",
  "order-status-required": "Select a valid order status.",
  "tx-failed": "This transaction failed on-chain.",
  "tx-not-found-or-pending":
    "This transaction was not found on the selected network yet. Check the network or wait a few minutes.",
  "tx-usdc-transfer-not-found":
    "This transaction does not match the order recipient, token, or amount.",
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

  const { data: shopRows, error: shopsError } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: true });
  const shops = shopRows ?? [];
  const activeShop = shops[0] ?? null;

  const { data: productRows, error: productsError } = activeShop
    ? await supabase
        .from("products")
        .select("*")
        .eq("shop_id", activeShop.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const products = productRows ?? [];

  const { data: orderRows, error: ordersError } = activeShop
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
  const activeNetwork = getPaymentNetwork(activeShop?.payment_network);

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
            {errorMessages[params.error] ?? params.error}
          </p>
        ) : null}

        {params.success ? (
          <p className="mt-6 border border-[#b8d8b5] bg-[#f1faef] p-3 text-sm font-medium text-[#176b32]">
            {successMessages[params.success] ?? "Saved."}
          </p>
        ) : null}

        {shopsError || productsError || ordersError ? (
          <section className="mt-6 border border-[#e7b8a7] bg-[#fff4ef] p-4 text-sm text-[#8c2f16]">
            <p className="font-semibold">Database read issue</p>
            <ul className="mt-2 grid gap-1">
              {shopsError ? <li>shops: {shopsError.message}</li> : null}
              {productsError ? <li>products: {productsError.message}</li> : null}
              {ordersError ? <li>orders: {ordersError.message}</li> : null}
            </ul>
          </section>
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
                <label className="grid gap-2 text-sm font-medium">
                  Payment network
                  <select
                    className="h-11 border border-[#c3c7b9] bg-white px-3 outline-none focus:border-[#171a16]"
                    defaultValue={activeShop.payment_network ?? "polygon_mainnet"}
                    name="payment_network"
                  >
                    <option value="polygon_mainnet">Mainnet - Polygon USDC</option>
                    <option value="polygon_amoy">Testnet - Polygon Amoy USDC</option>
                  </select>
                </label>
                <p className="text-sm font-medium text-[#65705f]">
                  Current mode: {activeNetwork.modeLabel}
                </p>
                <p className="text-sm text-[#65705f]">
                  Public shop slug: <span className="font-mono">{activeShop.slug}</span>
                </p>
                <Link
                  className="inline-flex text-sm font-semibold underline"
                  href={`/shop/${activeShop.slug}`}
                >
                  Open public shop
                </Link>
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
                    className="grid gap-4 border border-[#edf0e8] p-4"
                    key={product.id}
                  >
                    <form action={updateProduct} className="grid gap-3">
                      <input name="product_id" type="hidden" value={product.id} />
                      <label className="grid gap-2 text-sm font-medium">
                        Product name
                        <input
                          className="h-10 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                          defaultValue={product.name}
                          name="name"
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Price USDC
                        <input
                          className="h-10 border border-[#c3c7b9] px-3 outline-none focus:border-[#171a16]"
                          defaultValue={product.price_usdc}
                          min="0.01"
                          name="price_usdc"
                          step="0.000001"
                          type="number"
                          required
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Description
                        <textarea
                          className="min-h-20 border border-[#c3c7b9] p-3 outline-none focus:border-[#171a16]"
                          defaultValue={product.description ?? ""}
                          name="description"
                        />
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid gap-1 text-sm text-[#65705f]">
                          <span>{product.active ? "Active" : "Hidden"}</span>
                          <Link className="font-semibold underline" href={`/pay/${product.id}`}>
                            Open payment page
                          </Link>
                        </div>
                        <button className="h-10 rounded-md bg-[#171a16] px-4 text-sm font-semibold text-white">
                          Save product
                        </button>
                      </div>
                    </form>
                    <form action={toggleProduct}>
                      <input name="product_id" type="hidden" value={product.id} />
                      <input
                        name="active"
                        type="hidden"
                        value={product.active ? "false" : "true"}
                      />
                      <button className="h-10 rounded-md border border-[#c3c7b9] px-4 text-sm font-semibold">
                        {product.active ? "Hide product" : "Activate product"}
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
                    {isTransactionHash(order.payment_tx_hash) ? (
                      <a
                        className="inline-flex break-all text-xs font-semibold underline"
                        href={paymentNetworkExplorerTxUrl(
                          order.payment_network ?? activeShop?.payment_network,
                          order.payment_tx_hash,
                        )}
                      >
                        Open on explorer
                      </a>
                    ) : order.payment_tx_hash ? (
                      <p className="text-xs font-medium text-[#8c2f16]">
                        {isWalletAddress(order.payment_tx_hash)
                          ? "This is a wallet address. Clear it, then save the actual transaction hash after payment."
                          : "Saved value is not a valid transaction hash."}
                      </p>
                    ) : null}
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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getJpyPerUsdc } from "@/lib/exchange-rate";
import { normalizePaymentNetwork } from "@/lib/payment-networks";
import { createClient } from "@/lib/supabase/server";
import { calculateUsdcFromJpy, isTransactionHash, slugify } from "@/lib/format";
import { verifyPaymentTx } from "@/lib/verify-payment";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  return { supabase, user };
}

function redirectTarget(formData: FormData, fallback = "/admin") {
  const next = String(formData.get("next") ?? "").trim();
  return next.startsWith("/admin") ? next : fallback;
}

export async function createShop(formData: FormData) {
  const { supabase, user } = await requireUser();
  const next = redirectTarget(formData, "/admin/settings");
  const name = String(formData.get("name") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const walletAddress = String(formData.get("wallet_address") ?? "").trim();
  const slug = slugify(requestedSlug || name);
  const rate = await getJpyPerUsdc();

  if (!name || !slug) {
    redirect(`${next}?error=shop-required`);
  }

  const { error } = await supabase.from("shops").insert({
    owner_id: user.id,
    name,
    slug,
    wallet_address: walletAddress || null,
    jpy_per_usdc: rate.jpyPerUsdc,
  });

  if (error) {
    console.error("createShop failed", error);
    redirect(`${next}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect(`${next}?success=shop-created`);
}

export async function updateShop(formData: FormData) {
  const { supabase } = await requireUser();
  const next = redirectTarget(formData, "/admin/settings");
  const shopId = String(formData.get("shop_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const walletAddress = String(formData.get("wallet_address") ?? "").trim();
  const paymentNetwork = normalizePaymentNetwork(String(formData.get("payment_network") ?? ""));

  if (!shopId || !name) {
    redirect(`${next}?error=shop-update-required`);
  }

  const { data: currentShop } = await supabase
    .from("shops")
    .select("jpy_per_usdc")
    .eq("id", shopId)
    .single();
  const rate = await getJpyPerUsdc(currentShop?.jpy_per_usdc);

  const { error } = await supabase
    .from("shops")
    .update({
      name,
      wallet_address: walletAddress || null,
      payment_network: paymentNetwork,
      jpy_per_usdc: rate.jpyPerUsdc,
    })
    .eq("id", shopId);

  if (error) {
    console.error("updateShop failed", error);
    redirect(`${next}?error=${encodeURIComponent(error.message)}`);
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, price_jpy")
    .eq("shop_id", shopId);

  for (const product of products ?? []) {
    await supabase
      .from("products")
      .update({
        price_usdc: calculateUsdcFromJpy(Number(product.price_jpy ?? 0), rate.jpyPerUsdc),
      })
      .eq("id", product.id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  redirect(`${next}?success=shop-updated`);
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const next = redirectTarget(formData, "/admin/products");
  const shopId = String(formData.get("shop_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceJpy = Number(formData.get("price_jpy") ?? 0);

  if (!shopId || !name || !Number.isFinite(priceJpy) || priceJpy <= 0) {
    redirect(`${next}?error=product-required`);
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("jpy_per_usdc")
    .eq("id", shopId)
    .single();
  const rate = await getJpyPerUsdc(shop?.jpy_per_usdc);

  const { error } = await supabase.from("products").insert({
    shop_id: shopId,
    name,
    description: description || null,
    price_jpy: priceJpy,
    price_usdc: calculateUsdcFromJpy(priceJpy, rate.jpyPerUsdc),
    active: true,
  });

  if (error) {
    console.error("createProduct failed", error);
    redirect(`${next}?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("shops").update({ jpy_per_usdc: rate.jpyPerUsdc }).eq("id", shopId);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  redirect(`${next}?success=product-created`);
}

export async function updateProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const next = redirectTarget(formData, "/admin/products");
  const productId = String(formData.get("product_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceJpy = Number(formData.get("price_jpy") ?? 0);

  if (!productId || !name || !Number.isFinite(priceJpy) || priceJpy <= 0) {
    redirect(`${next}?error=product-update-required`);
  }

  const { data: product } = await supabase
    .from("products")
    .select("shop_id, shops(jpy_per_usdc)")
    .eq("id", productId)
    .single();
  const shop = Array.isArray(product?.shops) ? product.shops[0] : product?.shops;
  const rate = await getJpyPerUsdc(shop?.jpy_per_usdc);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      description: description || null,
      price_jpy: priceJpy,
      price_usdc: calculateUsdcFromJpy(priceJpy, rate.jpyPerUsdc),
    })
    .eq("id", productId);

  if (error) {
    console.error("updateProduct failed", error);
    redirect(`${next}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  if (product?.shop_id) {
    await supabase.from("shops").update({ jpy_per_usdc: rate.jpyPerUsdc }).eq("id", product.shop_id);
  }
  redirect(`${next}?success=product-updated`);
}

export async function toggleProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const next = redirectTarget(formData, "/admin/products");
  const productId = String(formData.get("product_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!productId) {
    redirect(`${next}?error=product-id-required`);
  }

  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId);

  if (error) {
    console.error("toggleProduct failed", error);
    redirect(`${next}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  redirect(`${next}?success=product-updated`);
}

export async function updateOrderStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const next = redirectTarget(formData, "/admin");
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentTxHash = String(formData.get("payment_tx_hash") ?? "").trim();

  if (!orderId || !["pending", "paid", "expired", "cancelled"].includes(status)) {
    redirect(`${next}?error=order-status-required`);
  }

  if (paymentTxHash && !isTransactionHash(paymentTxHash)) {
    redirect(`${next}?error=invalid-tx-hash`);
  }

  let nextStatus = status;

  if (paymentTxHash) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("amount_usdc, payment_network, shops(wallet_address)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      redirect(`${next}?error=order-not-found`);
    }

    const shop = Array.isArray(order.shops) ? order.shops[0] : order.shops;
    const verification = await verifyPaymentTx({
      amountUsdc: order.amount_usdc,
      merchantWallet: shop?.wallet_address ?? null,
      paymentNetwork: order.payment_network,
      txHash: paymentTxHash,
    });

    if (!verification.ok) {
      redirect(`${next}?error=${verification.error}`);
    }

    nextStatus = "paid";
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: nextStatus,
      payment_tx_hash: paymentTxHash || null,
    })
    .eq("id", orderId);

  if (error) {
    console.error("updateOrderStatus failed", error);
    redirect(`${next}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect(`${next}?success=order-updated`);
}

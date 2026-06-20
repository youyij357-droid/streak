"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createShop(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const requestedSlug = String(formData.get("slug") ?? "").trim();
  const walletAddress = String(formData.get("wallet_address") ?? "").trim();
  const slug = slugify(requestedSlug || name);

  if (!name || !slug) {
    redirect("/admin?error=shop-required");
  }

  const { error } = await supabase.from("shops").insert({
    owner_id: user.id,
    name,
    slug,
    wallet_address: walletAddress || null,
  });

  if (error) {
    console.error("createShop failed", error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=shop-created");
}

export async function updateShop(formData: FormData) {
  const { supabase } = await requireUser();
  const shopId = String(formData.get("shop_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const walletAddress = String(formData.get("wallet_address") ?? "").trim();
  const paymentNetwork = normalizePaymentNetwork(String(formData.get("payment_network") ?? ""));
  const jpyPerUsdc = Number(formData.get("jpy_per_usdc") ?? 0);

  if (!shopId || !name || !Number.isFinite(jpyPerUsdc) || jpyPerUsdc <= 0) {
    redirect("/admin?error=shop-update-required");
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name,
      wallet_address: walletAddress || null,
      payment_network: paymentNetwork,
      jpy_per_usdc: jpyPerUsdc,
    })
    .eq("id", shopId);

  if (error) {
    console.error("updateShop failed", error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, price_jpy")
    .eq("shop_id", shopId);

  for (const product of products ?? []) {
    await supabase
      .from("products")
      .update({
        price_usdc: calculateUsdcFromJpy(Number(product.price_jpy ?? 0), jpyPerUsdc),
      })
      .eq("id", product.id);
  }

  revalidatePath("/admin");
  redirect("/admin?success=shop-updated");
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const shopId = String(formData.get("shop_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceJpy = Number(formData.get("price_jpy") ?? 0);

  if (!shopId || !name || !Number.isFinite(priceJpy) || priceJpy <= 0) {
    redirect("/admin?error=product-required");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("jpy_per_usdc")
    .eq("id", shopId)
    .single();
  const jpyPerUsdc = Number(shop?.jpy_per_usdc ?? 0);

  if (!Number.isFinite(jpyPerUsdc) || jpyPerUsdc <= 0) {
    redirect("/admin?error=exchange-rate-required");
  }

  const { error } = await supabase.from("products").insert({
    shop_id: shopId,
    name,
    description: description || null,
    price_jpy: priceJpy,
    price_usdc: calculateUsdcFromJpy(priceJpy, jpyPerUsdc),
    active: true,
  });

  if (error) {
    console.error("createProduct failed", error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=product-created");
}

export async function updateProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const productId = String(formData.get("product_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceJpy = Number(formData.get("price_jpy") ?? 0);

  if (!productId || !name || !Number.isFinite(priceJpy) || priceJpy <= 0) {
    redirect("/admin?error=product-update-required");
  }

  const { data: product } = await supabase
    .from("products")
    .select("shops(jpy_per_usdc)")
    .eq("id", productId)
    .single();
  const shop = Array.isArray(product?.shops) ? product.shops[0] : product?.shops;
  const jpyPerUsdc = Number(shop?.jpy_per_usdc ?? 0);

  if (!Number.isFinite(jpyPerUsdc) || jpyPerUsdc <= 0) {
    redirect("/admin?error=exchange-rate-required");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      description: description || null,
      price_jpy: priceJpy,
      price_usdc: calculateUsdcFromJpy(priceJpy, jpyPerUsdc),
    })
    .eq("id", productId);

  if (error) {
    console.error("updateProduct failed", error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=product-updated");
}

export async function toggleProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const productId = String(formData.get("product_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!productId) {
    redirect("/admin?error=product-id-required");
  }

  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId);

  if (error) {
    console.error("toggleProduct failed", error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=product-updated");
}

export async function updateOrderStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentTxHash = String(formData.get("payment_tx_hash") ?? "").trim();

  if (!orderId || !["pending", "paid", "expired", "cancelled"].includes(status)) {
    redirect("/admin?error=order-status-required");
  }

  if (paymentTxHash && !isTransactionHash(paymentTxHash)) {
    redirect("/admin?error=invalid-tx-hash");
  }

  let nextStatus = status;

  if (paymentTxHash) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("amount_usdc, payment_network, shops(wallet_address)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      redirect("/admin?error=order-not-found");
    }

    const shop = Array.isArray(order.shops) ? order.shops[0] : order.shops;
    const verification = await verifyPaymentTx({
      amountUsdc: order.amount_usdc,
      merchantWallet: shop?.wallet_address ?? null,
      paymentNetwork: order.payment_network,
      txHash: paymentTxHash,
    });

    if (!verification.ok) {
      redirect(`/admin?error=${verification.error}`);
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
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=order-updated");
}

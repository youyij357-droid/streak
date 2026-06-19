"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

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

  if (!shopId || !name) {
    redirect("/admin?error=shop-update-required");
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name,
      wallet_address: walletAddress || null,
    })
    .eq("id", shopId);

  if (error) {
    console.error("updateShop failed", error);
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect("/admin?success=shop-updated");
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireUser();
  const shopId = String(formData.get("shop_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceUsdc = Number(formData.get("price_usdc") ?? 0);

  if (!shopId || !name || !Number.isFinite(priceUsdc) || priceUsdc <= 0) {
    redirect("/admin?error=product-required");
  }

  const { error } = await supabase.from("products").insert({
    shop_id: shopId,
    name,
    description: description || null,
    price_usdc: priceUsdc,
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
  const priceUsdc = Number(formData.get("price_usdc") ?? 0);

  if (!productId || !name || !Number.isFinite(priceUsdc) || priceUsdc <= 0) {
    redirect("/admin?error=product-update-required");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      description: description || null,
      price_usdc: priceUsdc,
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

  const { error } = await supabase
    .from("orders")
    .update({
      status,
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

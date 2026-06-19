"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const productId = String(formData.get("product_id") ?? "");
  const shopId = String(formData.get("shop_id") ?? "");
  const buyerEmail = String(formData.get("buyer_email") ?? "").trim();
  const amountUsdc = Number(formData.get("amount_usdc") ?? 0);

  if (!productId || !shopId || !Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    redirect(`/pay/${productId}?error=invalid-order`);
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      shop_id: shopId,
      product_id: productId,
      buyer_email: buyerEmail || null,
      amount_usdc: amountUsdc,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/pay/${productId}?error=${encodeURIComponent(error?.message ?? "order-failed")}`);
  }

  redirect(`/pay/${productId}/thanks?order=${data.id}`);
}

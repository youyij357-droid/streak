"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitPaymentTxHash(formData: FormData) {
  const supabase = await createClient();
  const productId = String(formData.get("product_id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");
  const paymentTxHash = String(formData.get("payment_tx_hash") ?? "").trim();

  if (!productId || !orderId || !paymentTxHash) {
    redirect(`/pay/${productId}/thanks?order=${orderId}&error=tx-hash-required`);
  }

  const { error } = await supabase
    .from("orders")
    .update({ payment_tx_hash: paymentTxHash })
    .eq("id", orderId)
    .eq("product_id", productId)
    .eq("status", "pending");

  if (error) {
    redirect(
      `/pay/${productId}/thanks?order=${orderId}&error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/pay/${productId}/thanks?order=${orderId}&success=tx-recorded`);
}

"use server";

import { redirect } from "next/navigation";
import { isTransactionHash } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { verifyPaymentTx } from "@/lib/verify-payment";

export async function submitPaymentTxHash(formData: FormData) {
  const supabase = await createClient();
  const productId = String(formData.get("product_id") ?? "");
  const orderId = String(formData.get("order_id") ?? "");
  const paymentTxHash = String(formData.get("payment_tx_hash") ?? "").trim();

  if (!productId || !orderId || !paymentTxHash) {
    redirect(`/pay/${productId}/thanks?order=${orderId}&error=tx-hash-required`);
  }

  if (!isTransactionHash(paymentTxHash)) {
    redirect(`/pay/${productId}/thanks?order=${orderId}&error=invalid-tx-hash`);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("amount_usdc, payment_network, shops(wallet_address)")
    .eq("id", orderId)
    .eq("product_id", productId)
    .single();

  if (orderError || !order) {
    redirect(`/pay/${productId}/thanks?order=${orderId}&error=order-not-found`);
  }

  const shop = Array.isArray(order.shops) ? order.shops[0] : order.shops;
  const verification = await verifyPaymentTx({
    amountUsdc: order.amount_usdc,
    merchantWallet: shop?.wallet_address ?? null,
    paymentNetwork: order.payment_network,
    txHash: paymentTxHash,
  });

  if (!verification.ok) {
    redirect(`/pay/${productId}/thanks?order=${orderId}&error=${verification.error}`);
  }

  const { error } = await supabase
    .from("orders")
    .update({ payment_tx_hash: paymentTxHash, status: "paid" })
    .eq("id", orderId)
    .eq("product_id", productId)
    .in("status", ["pending", "paid"]);

  if (error) {
    redirect(
      `/pay/${productId}/thanks?order=${orderId}&error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/pay/${productId}/thanks?order=${orderId}&success=payment-verified`);
}

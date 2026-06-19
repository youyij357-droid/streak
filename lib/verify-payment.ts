import { isTransactionHash } from "@/lib/format";
import { getPaymentNetwork } from "@/lib/payment-networks";

const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

type RpcLog = {
  address?: string;
  data?: string;
  topics?: string[];
};

type RpcReceipt = {
  logs?: RpcLog[];
  status?: string;
};

type VerifyPaymentInput = {
  amountUsdc: number | string;
  merchantWallet: string | null;
  paymentNetwork: string | null | undefined;
  txHash: string;
};

export type VerifyPaymentResult =
  | { ok: true }
  | {
      error:
        | "invalid-tx-hash"
        | "merchant-wallet-missing"
        | "tx-not-found-or-pending"
        | "tx-failed"
        | "tx-usdc-transfer-not-found";
      ok: false;
    };

function normalizeAddress(value: string | null | undefined) {
  return String(value ?? "").toLowerCase();
}

function addressTopic(value: string) {
  return `0x${value.replace(/^0x/i, "").toLowerCase().padStart(64, "0")}`;
}

function parseUsdcUnits(value: number | string) {
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole || "0") * BigInt("1000000") + BigInt(fraction.padEnd(6, "0").slice(0, 6));
}

async function getReceipt(rpcUrl: string, txHash: string) {
  const response = await fetch(rpcUrl, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { result?: RpcReceipt | null };
  return payload.result ?? null;
}

export async function verifyPaymentTx({
  amountUsdc,
  merchantWallet,
  paymentNetwork,
  txHash,
}: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  if (!isTransactionHash(txHash)) {
    return { ok: false, error: "invalid-tx-hash" };
  }

  if (!merchantWallet) {
    return { ok: false, error: "merchant-wallet-missing" };
  }

  const network = getPaymentNetwork(paymentNetwork);
  const expectedRecipient = addressTopic(merchantWallet);
  const expectedAmount = parseUsdcUnits(amountUsdc);
  let receipt: RpcReceipt | null = null;

  for (const rpcUrl of network.rpcUrls) {
    try {
      receipt = await getReceipt(rpcUrl, txHash);
      if (receipt) {
        break;
      }
    } catch (error) {
      console.error("verifyPaymentTx RPC failed", error);
    }
  }

  if (!receipt) {
    return { ok: false, error: "tx-not-found-or-pending" };
  }

  if (receipt.status !== "0x1") {
    return { ok: false, error: "tx-failed" };
  }

  const hasMatchingTransfer = (receipt.logs ?? []).some((log) => {
    const topics = log.topics ?? [];
    if (normalizeAddress(log.address) !== normalizeAddress(network.usdcContract)) {
      return false;
    }

    if (normalizeAddress(topics[0]) !== transferTopic || normalizeAddress(topics[2]) !== expectedRecipient) {
      return false;
    }

    const transferredAmount = BigInt(log.data ?? "0x0");
    return transferredAmount >= expectedAmount;
  });

  if (!hasMatchingTransfer) {
    return { ok: false, error: "tx-usdc-transfer-not-found" };
  }

  return { ok: true };
}

export function formatUsdc(value: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

export function polygonScanTxUrl(txHash: string | null) {
  if (!txHash) {
    return "";
  }

  return `https://polygonscan.com/tx/${txHash}`;
}

export function isTransactionHash(value: string | null) {
  return /^0x[a-fA-F0-9]{64}$/.test(value ?? "");
}

export function isWalletAddress(value: string | null) {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "");
}

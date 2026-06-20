export type PaymentNetwork = "polygon_mainnet" | "polygon_amoy";

export const defaultPaymentNetwork: PaymentNetwork = "polygon_mainnet";

export const paymentNetworks: Record<
  PaymentNetwork,
  {
    blockExplorerUrl: string;
    chainId: string;
    chainName: string;
    label: string;
    modeLabel: string;
    nativeCurrency: {
      decimals: number;
      name: string;
      symbol: string;
    };
    rpcUrls: string[];
    usdcContract: string;
  }
> = {
  polygon_mainnet: {
    blockExplorerUrl: "https://polygonscan.com",
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    label: "Polygonメインネット USDC",
    modeLabel: "本番",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
    usdcContract: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  polygon_amoy: {
    blockExplorerUrl: "https://amoy.polygonscan.com",
    chainId: "0x13882",
    chainName: "Polygon Amoy",
    label: "Polygon Amoyテストネット USDC",
    modeLabel: "テスト",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    usdcContract: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  },
};

export function normalizePaymentNetwork(value: string | null | undefined): PaymentNetwork {
  return value === "polygon_amoy" ? "polygon_amoy" : defaultPaymentNetwork;
}

export function getPaymentNetwork(value: string | null | undefined) {
  return paymentNetworks[normalizePaymentNetwork(value)];
}

export function paymentNetworkExplorerTxUrl(
  value: string | null | undefined,
  txHash: string | null,
) {
  if (!txHash) {
    return "";
  }

  return `${getPaymentNetwork(value).blockExplorerUrl}/tx/${txHash}`;
}

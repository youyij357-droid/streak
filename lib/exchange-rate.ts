const FALLBACK_JPY_PER_USDC = 160;

type ExchangeRateResult = {
  jpyPerUsdc: number;
  source: "coinbase" | "fallback";
};

export async function getJpyPerUsdc(fallback?: number | string | null): Promise<ExchangeRateResult> {
  const fallbackRate = Number(fallback ?? FALLBACK_JPY_PER_USDC);

  try {
    const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDC", {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Exchange rate request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: {
        rates?: {
          JPY?: string;
        };
      };
    };
    const jpyPerUsdc = Number(payload.data?.rates?.JPY);

    if (Number.isFinite(jpyPerUsdc) && jpyPerUsdc > 0) {
      return { jpyPerUsdc, source: "coinbase" };
    }
  } catch (error) {
    console.error("getJpyPerUsdc failed", error);
  }

  return {
    jpyPerUsdc: Number.isFinite(fallbackRate) && fallbackRate > 0 ? fallbackRate : FALLBACK_JPY_PER_USDC,
    source: "fallback",
  };
}

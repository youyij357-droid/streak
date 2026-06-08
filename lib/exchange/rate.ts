export async function getUsdcJpyRate(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=jpy',
    { next: { revalidate: 60 } }
  );
  const data = await res.json();
  return data['usd-coin'].jpy;
}

export function jpyToUsdc(jpy: number, rate: number): number {
  return Math.ceil((jpy / rate) * 1000000) / 1000000;
}

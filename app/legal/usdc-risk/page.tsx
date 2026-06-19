import Link from "next/link";

export const metadata = {
  title: "USDC Risk Notice | STREAK",
};

export default function UsdcRiskPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">USDC Risk Notice</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            Polygon USDC payments are blockchain transactions. They may be
            irreversible once submitted and confirmed.
          </p>
          <p>
            Confirm the network, token contract, amount, and merchant wallet
            address before sending funds. Sending assets to the wrong address
            or network may result in permanent loss.
          </p>
          <p>
            STREAK does not custody funds, does not provide exchange services,
            and does not guarantee settlement, refunds, or merchant performance.
          </p>
        </div>
      </article>
    </main>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Terms | STREAK",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">Terms of Use</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            STREAK provides software tools for merchants to create product pages,
            payment links, and order records. STREAK does not sell the listed
            products and does not custody buyer funds.
          </p>
          <p>
            Payments are made directly between buyer and merchant wallets. Users
            are responsible for confirming wallet addresses, networks, product
            terms, taxes, refunds, and legal obligations.
          </p>
          <p>
            This MVP may change without notice. Do not use it for transactions
            that require regulated custody, escrow, exchange, or fund transfer
            services.
          </p>
        </div>
      </article>
    </main>
  );
}

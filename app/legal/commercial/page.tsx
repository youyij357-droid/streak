import Link from "next/link";

export const metadata = {
  title: "Commercial Disclosure | STREAK",
};

export default function CommercialPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">Commercial Disclosure</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            Merchant name, seller information, delivery terms, refund policy,
            and customer support contact should be provided by each merchant
            before public sales begin.
          </p>
          <p>
            This page is a placeholder for Japanese Specified Commercial
            Transactions Act disclosure requirements and should be completed
            before production commerce use.
          </p>
        </div>
      </article>
    </main>
  );
}

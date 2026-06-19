import Link from "next/link";

export const metadata = {
  title: "Privacy | STREAK",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-6 py-10 text-[#171a16]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
          STREAK
        </Link>
        <h1 className="mt-10 text-4xl font-semibold">Privacy Policy</h1>
        <div className="mt-6 grid gap-5 text-sm leading-7 text-[#4d5548]">
          <p>
            STREAK stores account, shop, product, and order information needed
            to operate payment links. Buyer email is optional and used for order
            identification.
          </p>
          <p>
            Wallet addresses and transaction hashes are public blockchain data.
            Do not enter unnecessary personal information into product,
            order, or wallet fields.
          </p>
          <p>
            Authentication and database storage are provided through Supabase.
            Hosting is provided through Vercel.
          </p>
        </div>
      </article>
    </main>
  );
}

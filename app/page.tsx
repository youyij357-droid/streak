import Link from "next/link";

const steps = [
  "Unify Google, GitHub, and Vercel under the new account",
  "Connect Supabase once project creation is available again",
  "Build non-custodial Polygon USDC payment links",
];

const features = [
  {
    title: "Merchant payment links",
    body: "Create a product URL and let buyers pay directly from their wallet with USDC.",
  },
  {
    title: "Admin dashboard",
    body: "Review merchants, products, orders, and payment state from an internal control surface.",
  },
  {
    title: "Non-custodial flow",
    body: "STREAK does not hold buyer funds. The product focuses on on-chain execution and records.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d7d9ce] pb-5">
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[#596052] sm:flex">
            <a className="transition hover:text-[#171a16]" href="#plan">
              Plan
            </a>
            <a className="transition hover:text-[#171a16]" href="#features">
              Features
            </a>
            <a className="transition hover:text-[#171a16]" href="#status">
              Status
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              Rebuild workspace ready
            </p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-[#11140f] sm:text-6xl lg:text-7xl">
              Rebuilding USDC payment links from a clean foundation.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#4d5548]">
              STREAK is being rebuilt under the new account stack. The first target is a focused MVP: admin login, merchant onboarding, product setup, and Polygon USDC payment links.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#171a16] px-6 text-sm font-semibold text-white transition hover:bg-[#2c3129]"
                href="https://github.com/youyij357-droid/streak"
              >
                GitHub Repository
              </a>
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#c3c7b9] px-6 text-sm font-semibold text-[#171a16] transition hover:border-[#171a16]"
                href="https://docs.google.com/spreadsheets/d/1zZhRnI8YMZbcxuyWH8qs2psYM1t66UNVppRYi95QvLs/edit"
              >
                Project Tracker
              </a>
            </div>
          </div>

          <section
            id="status"
            className="border border-[#d7d9ce] bg-white p-6 shadow-[0_24px_80px_rgba(23,26,22,0.08)]"
          >
            <div className="flex items-start justify-between gap-6 border-b border-[#e5e7dd] pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#65705f]">
                  Current status
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Clean deployment is ready</h2>
              </div>
              <span className="rounded-full bg-[#dff2df] px-3 py-1 text-xs font-semibold text-[#176b32]">
                Ready
              </span>
            </div>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">GitHub</dt>
                <dd className="text-right font-medium">youyij357-droid/streak</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Vercel</dt>
                <dd className="text-right font-medium">Production ready</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Supabase</dt>
                <dd className="text-right font-medium">Waiting for service recovery</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">Next step</dt>
                <dd className="text-right font-medium">Admin login foundation</dd>
              </div>
            </dl>
          </section>
        </div>

        <section id="plan" className="border-t border-[#d7d9ce] py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="border border-[#d7d9ce] bg-white p-5">
                <p className="font-mono text-xs text-[#65705f]">0{index + 1}</p>
                <p className="mt-4 text-base font-semibold leading-7">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="grid gap-5 pb-14 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="bg-[#171a16] p-6 text-white">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-4 text-sm leading-6 text-[#d9ded2]">{feature.body}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
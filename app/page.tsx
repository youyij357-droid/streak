import Link from "next/link";

const steps = [
  "商品を円で登録",
  "為替レートでUSDCへ換算",
  "ウォレットで支払い、自動で取引確認",
];

const features = [
  {
    title: "決済リンク",
    body: "商品ごとに決済URLを作成し、購入者へ共有できます。",
  },
  {
    title: "円建て登録",
    body: "販売者は円で価格を登録し、購入者は換算されたUSDCで支払います。",
  },
  {
    title: "非カストディ型",
    body: "STREAKは資金を預からず、販売者ウォレットへの送金と取引記録を支援します。",
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
            <Link className="transition hover:text-[#171a16]" href="/admin/login">
              管理画面
            </Link>
            <a className="transition hover:text-[#171a16]" href="#flow">
              流れ
            </a>
            <a className="transition hover:text-[#171a16]" href="#features">
              機能
            </a>
            <a className="transition hover:text-[#171a16]" href="#status">
              状態
            </a>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              USDC決済リンク
            </p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-[#11140f] sm:text-6xl lg:text-7xl">
              円で登録して、USDCで支払える決済リンク。
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#4d5548]">
              STREAKは、オンライン商品やデジタルコンテンツ向けのUSDC決済リンクを作成するための管理ツールです。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#171a16] px-6 text-sm font-semibold text-white transition hover:bg-[#2c3129]"
                href="/admin/login"
              >
                管理画面へ
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#c3c7b9] px-6 text-sm font-semibold text-[#171a16] transition hover:border-[#171a16]"
                href="https://github.com/youyij357-droid/streak"
              >
                GitHub
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
                  現在の状態
                </p>
                <h2 className="mt-2 text-2xl font-semibold">MVP検証中</h2>
              </div>
              <span className="rounded-full bg-[#dff2df] px-3 py-1 text-xs font-semibold text-[#176b32]">
                稼働中
              </span>
            </div>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">価格登録</dt>
                <dd className="text-right font-medium">円建て</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">決済通貨</dt>
                <dd className="text-right font-medium">USDC</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">対応ネットワーク</dt>
                <dd className="text-right font-medium">Polygon / Amoy</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">資金管理</dt>
                <dd className="text-right font-medium">非カストディ</dd>
              </div>
            </dl>
          </section>
        </div>

        <section id="flow" className="border-t border-[#d7d9ce] py-12">
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

        <footer className="flex flex-col gap-3 border-t border-[#d7d9ce] py-6 text-sm text-[#65705f] sm:flex-row sm:items-center sm:justify-between">
          <p>STREAK 非カストディ型USDC決済リンク</p>
          <nav className="flex flex-wrap gap-4">
            <Link className="underline" href="/legal/terms">
              利用規約
            </Link>
            <Link className="underline" href="/legal/privacy">
              プライバシーポリシー
            </Link>
            <Link className="underline" href="/legal/commercial">
              特定商取引法に基づく表記
            </Link>
            <Link className="underline" href="/legal/usdc-risk">
              USDCリスク説明
            </Link>
          </nav>
        </footer>
      </section>
    </main>
  );
}

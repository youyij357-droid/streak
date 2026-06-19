import Link from "next/link";

export const metadata = {
  title: "Admin Login | STREAK",
};

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
        <div>
          <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
            STREAK
          </Link>
          <p className="mt-12 font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
            Admin access
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            管理者ログインの入口を準備しました。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#4d5548]">
            Supabaseの新規プロジェクト作成が復旧したら、この画面にEmail/Password認証を接続します。現時点では送信を止め、接続前の状態が分かるようにしています。
          </p>
        </div>

        <section className="border border-[#d7d9ce] bg-white p-6 shadow-[0_24px_80px_rgba(23,26,22,0.08)]">
          <div className="border-b border-[#e5e7dd] pb-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#65705f]">
              Status
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Supabase connection pending</h2>
          </div>

          <form className="mt-6 grid gap-5" action="/admin">
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                className="h-12 border border-[#c3c7b9] bg-[#fbfcf7] px-4 text-base outline-none transition focus:border-[#171a16]"
                name="email"
                placeholder="admin@example.com"
                type="email"
                disabled
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-12 border border-[#c3c7b9] bg-[#fbfcf7] px-4 text-base outline-none transition focus:border-[#171a16]"
                name="password"
                placeholder="Supabase接続後に有効化"
                type="password"
                disabled
              />
            </label>
            <button
              className="h-12 cursor-not-allowed rounded-md bg-[#cfd5c7] px-5 text-sm font-semibold text-[#596052]"
              disabled
              type="button"
            >
              Supabase接続後に有効化
            </button>
          </form>

          <div className="mt-6 grid gap-3 border-t border-[#e5e7dd] pt-5 text-sm text-[#4d5548]">
            <p>次に必要なもの: Supabase URL、Anon Key、Service Role Key。</p>
            <Link className="font-semibold text-[#171a16] underline" href="/admin">
              管理ダッシュボードの準備状況を見る
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

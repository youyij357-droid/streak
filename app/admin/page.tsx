import Link from "next/link";

const milestones = [
  {
    label: "Account stack",
    status: "done",
    detail: "Google, GitHub, and Vercel are rebuilt under the new account.",
  },
  {
    label: "Production deploy",
    status: "done",
    detail: "The public STREAK shell is live on Vercel.",
  },
  {
    label: "Supabase project",
    status: "waiting",
    detail: "Project creation is blocked until Supabase service recovery.",
  },
  {
    label: "Admin auth",
    status: "next",
    detail: "Email/Password login will connect after Supabase keys are ready.",
  },
];

const nextTasks = [
  "Create Supabase project and record the project URL in the tracker.",
  "Add production environment variables in Vercel.",
  "Enable Supabase Email/Password auth.",
  "Replace this readiness dashboard with authenticated admin pages.",
];

export const metadata = {
  title: "Admin Dashboard | STREAK",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#171a16]">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-4 border-b border-[#d7d9ce] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link className="text-xl font-semibold tracking-[0.18em]" href="/">
              STREAK
            </Link>
            <p className="mt-2 text-sm text-[#65705f]">Admin readiness dashboard</p>
          </div>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#c3c7b9] px-5 text-sm font-semibold text-[#171a16] transition hover:border-[#171a16]"
            href="/admin/login"
          >
            Login setup
          </Link>
        </header>

        <section className="grid gap-6 py-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              Current phase
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Supabase接続前に進められる準備は完了状態です。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              この画面は、認証が入る前の管理者用準備ページです。Supabase復旧後にログイン保護を追加し、加盟店・商品・注文・決済リンクの実データ画面へ置き換えます。
            </p>
          </div>

          <section className="border border-[#d7d9ce] bg-white p-6">
            <h2 className="text-lg font-semibold">Environment checklist</h2>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Production URL</dt>
                <dd className="text-right font-medium">Ready</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">GitHub deploy</dt>
                <dd className="text-right font-medium">Ready</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#edf0e8] pb-3">
                <dt className="text-[#65705f]">Supabase env</dt>
                <dd className="text-right font-medium">Waiting</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">Auth guard</dt>
                <dd className="text-right font-medium">Next</dd>
              </div>
            </dl>
          </section>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {milestones.map((item) => (
            <article key={item.label} className="border border-[#d7d9ce] bg-white p-5">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#65705f]">
                {item.status}
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.label}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4d5548]">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 py-10 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold">Next implementation queue</h2>
            <p className="mt-3 text-sm leading-6 text-[#4d5548]">
              Supabase復旧後にそのまま進める順番です。いまは秘密鍵をコードに入れず、Vercel環境変数へ入れる前提にしています。
            </p>
          </div>
          <ol className="grid gap-3">
            {nextTasks.map((task, index) => (
              <li key={task} className="flex gap-4 border border-[#d7d9ce] bg-white p-4">
                <span className="font-mono text-xs text-[#65705f]">0{index + 1}</span>
                <span className="text-sm font-medium leading-6">{task}</span>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAdmin } from "./login/actions";

const milestones = [
  {
    label: "Account stack",
    status: "done",
    detail: "Google, GitHub, Vercel, and Supabase are now on the new stack.",
  },
  {
    label: "Production deploy",
    status: "done",
    detail: "The public STREAK shell is live on Vercel.",
  },
  {
    label: "Supabase project",
    status: "ready",
    detail: "The codebase is prepared for Supabase Auth and database setup.",
  },
  {
    label: "Admin auth",
    status: "env",
    detail: "Add Supabase env values and create the first admin user.",
  },
];

const nextTasks = [
  "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel.",
  "Run the database schema SQL in the Supabase SQL Editor.",
  "Create the first admin user in Supabase Authentication.",
  "Confirm /admin/login signs in and redirects to /admin.",
];

export const metadata = {
  title: "Admin Dashboard | STREAK",
};

export default async function AdminPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const claims = supabase
    ? await supabase.auth.getClaims()
    : { data: { claims: null } };
  const isSignedIn = Boolean(claims.data?.claims);

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
          {isSignedIn ? (
            <form action={signOutAdmin}>
              <button className="inline-flex h-11 items-center justify-center rounded-md border border-[#c3c7b9] px-5 text-sm font-semibold text-[#171a16] transition hover:border-[#171a16]">
                Sign out
              </button>
            </form>
          ) : (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-md border border-[#c3c7b9] px-5 text-sm font-semibold text-[#171a16] transition hover:border-[#171a16]"
              href="/admin/login"
            >
              Login setup
            </Link>
          )}
        </header>

        <section className="grid gap-6 py-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
              Current phase
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Supabase connection work can now begin.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#4d5548]">
              The app now has the SSR client, auth proxy, login action, and
              readiness screens needed for Supabase. The remaining step is to
              add the project values to Vercel and run the database schema.
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
                <dd className="text-right font-medium">
                  {configured ? "Configured" : "Waiting"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#65705f]">Auth session</dt>
                <dd className="text-right font-medium">
                  {isSignedIn ? "Signed in" : "Not signed in"}
                </dd>
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
              Keep secrets out of the repository. Add them only to Vercel
              Environment Variables and your local `.env.local`.
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

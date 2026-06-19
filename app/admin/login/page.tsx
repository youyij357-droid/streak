import Link from "next/link";
import { signInAdmin } from "./actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Admin Login | STREAK",
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "supabase-env-missing": "Supabase environment variables are not set yet.",
  "missing-credentials": "Enter both email and password.",
  "invalid-login": "Email or password is incorrect.",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const errorMessage = params.error ? errorMessages[params.error] : null;

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
            Supabase admin login is ready to connect.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#4d5548]">
            Add the Supabase URL and publishable key in Vercel, then create the
            first admin user in Supabase Auth. This page will sign in with
            Email/Password and route the session to the admin area.
          </p>
        </div>

        <section className="border border-[#d7d9ce] bg-white p-6 shadow-[0_24px_80px_rgba(23,26,22,0.08)]">
          <div className="border-b border-[#e5e7dd] pb-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#65705f]">
              Status
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {configured ? "Email login enabled" : "Supabase env pending"}
            </h2>
          </div>

          {errorMessage ? (
            <p className="mt-5 border border-[#e7b8a7] bg-[#fff4ef] p-3 text-sm font-medium text-[#8c2f16]">
              {errorMessage}
            </p>
          ) : null}

          <form action={signInAdmin} className="mt-6 grid gap-5">
            <input name="next" type="hidden" value={params.next ?? "/admin"} />
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                className="h-12 border border-[#c3c7b9] bg-[#fbfcf7] px-4 text-base outline-none transition focus:border-[#171a16]"
                name="email"
                placeholder="admin@example.com"
                type="email"
                disabled={!configured}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                className="h-12 border border-[#c3c7b9] bg-[#fbfcf7] px-4 text-base outline-none transition focus:border-[#171a16]"
                name="password"
                placeholder="Password"
                type="password"
                disabled={!configured}
                required
              />
            </label>
            <button
              className={
                configured
                  ? "h-12 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white transition hover:bg-[#2c3129]"
                  : "h-12 cursor-not-allowed rounded-md bg-[#cfd5c7] px-5 text-sm font-semibold text-[#596052]"
              }
              disabled={!configured}
              type="submit"
            >
              {configured ? "Sign in" : "Set Supabase env first"}
            </button>
          </form>

          <div className="mt-6 grid gap-3 border-t border-[#e5e7dd] pt-5 text-sm text-[#4d5548]">
            <p>
              Required env: NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
            </p>
            <Link className="font-semibold text-[#171a16] underline" href="/admin">
              View admin readiness dashboard
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { label: '概要', href: '/dashboard' },
  { label: '商品', href: '/dashboard/products' },
  { label: '注文', href: '/dashboard/orders' },
  { label: '決済履歴', href: '/dashboard/payments' },
  { label: '設定', href: '/dashboard/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <button
        type="button"
        onClick={() => setIsSidebarOpen((current) => !current)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-slate-200 bg-white p-2 lg:hidden"
        aria-label="メニュー"
      >
        <span className="block h-0.5 w-6 bg-slate-950" />
        <span className="mt-1.5 block h-0.5 w-6 bg-slate-950" />
        <span className="mt-1.5 block h-0.5 w-6 bg-slate-950" />
      </button>

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white p-6 transition-transform lg:static lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Link href="/" className="mb-10 text-xl font-semibold tracking-[0.18em]">
            STREAK
          </Link>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
          >
            ログアウト
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-5 py-10 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

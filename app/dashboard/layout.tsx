'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [crossmintConfigured, setCrossmintConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const shopId = localStorage.getItem('streak-shop-id');
    if (!shopId) return;

    const supabase = createClient();
    supabase
      .from('shops')
      .select('crossmint_api_key')
      .eq('id', shopId)
      .single()
      .then(({ data }) => {
        setCrossmintConfigured(/^(ck|sk)/.test(data?.crossmint_api_key ?? ''));
      });
  }, []);

  const navItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Products', href: '/dashboard/products' },
    { label: 'Sales', href: '/dashboard/sales' },
    { label: 'Payment Setup', href: '/dashboard/payment-setup', isPayment: true },
    { label: 'Settings', href: '/dashboard/settings' },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('streak-wallet');
    localStorage.removeItem('streak-shop-id');
    document.cookie = 'streak-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
        >
          <span className="block w-6 h-0.5 bg-black mb-1.5" />
          <span className="block w-6 h-0.5 bg-black mb-1.5" />
          <span className="block w-6 h-0.5 bg-black" />
        </button>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white border-r border-gray-200 flex flex-col p-6 fixed lg:relative h-full z-40 transition-transform lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="mb-12">
            <a href="/">
              <Image
                src="/images/logo.png"
                alt="STREAK Logo"
                width={120}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </a>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const showBadge = item.isPayment && crossmintConfigured === false;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.isPayment && (
                      <CreditCard className="w-4 h-4 shrink-0" />
                    )}
                    {item.label}
                  </span>
                  {showBadge && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      !
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-900 font-medium hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 lg:p-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

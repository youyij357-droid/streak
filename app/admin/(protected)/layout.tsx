import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { computeAdminSessionToken } from '@/lib/admin/auth';
import LogoutButton from './LogoutButton';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin-session');

  if (!session?.value || session.value !== computeAdminSessionToken()) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-gray-900">Streak Admin</span>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-900 text-white text-[10px] font-semibold uppercase tracking-wider">
              Internal
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

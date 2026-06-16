import Providers from '@/app/providers';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-white">{children}</div>
    </Providers>
  );
}

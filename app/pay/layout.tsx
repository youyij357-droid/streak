import Providers from '@/app/providers';

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

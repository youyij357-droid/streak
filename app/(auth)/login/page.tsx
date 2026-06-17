import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === 'signup' ? 'signup' : 'login';

  return <LoginForm initialMode={initialMode} />;
}

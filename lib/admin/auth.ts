import { createHash } from 'crypto';

export function computeAdminSessionToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? '';
  return createHash('sha256').update(`admin:${password}:streak-v1`).digest('hex');
}

export function validateAdminCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/(?:^|;\s*)admin-session=([^;]+)/);
  const value = match?.[1];
  if (!value) return false;
  return value === computeAdminSessionToken();
}

import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function getSessionSecret() {
  const secret =
    process.env.STREAK_SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.ADMIN_PASSWORD;

  if (!secret) {
    throw new Error('Missing STREAK_SESSION_SECRET');
  }

  return secret;
}

function signShopId(shopId: string) {
  return createHmac('sha256', getSessionSecret()).update(shopId).digest('base64url');
}

export function createShopSessionValue(shopId: string) {
  return `${shopId}.${signShopId(shopId)}`;
}

export function verifyShopSessionValue(value: string | undefined | null) {
  if (!value) return null;

  const [shopId, signature, ...rest] = value.split('.');
  if (!shopId || !signature || rest.length > 0) return null;

  const expected = signShopId(shopId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return null;

  return timingSafeEqual(signatureBuffer, expectedBuffer) ? shopId : null;
}

export { SESSION_MAX_AGE_SECONDS };

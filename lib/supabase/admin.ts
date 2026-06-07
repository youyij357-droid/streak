import { createClient } from '@supabase/supabase-js';

// service_role_key を使った管理者クライアント（サーバーサイド専用）
// RLS をバイパスするため、クライアント側で使用厳禁
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

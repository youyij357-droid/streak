import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('store_name, contact_name, phone, country, business_description, website_url, wallet_address, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!merchant) {
    redirect('/dashboard/onboarding');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">設定</h1>
        <p className="mt-2 text-sm text-slate-600">加盟店情報と受取ウォレットを確認します。</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid gap-5 md:grid-cols-2">
          <Info label="店舗名" value={merchant.store_name} />
          <Info label="担当者名" value={merchant.contact_name} />
          <Info label="電話番号" value={merchant.phone} />
          <Info label="国" value={merchant.country} />
          <Info label="状態" value={merchant.status} />
          <Info label="Webサイト" value={merchant.website_url ?? '-'} />
          <Info label="事業内容" value={merchant.business_description} wide />
          <Info label="受取ウォレット" value={merchant.wallet_address} wide mono />
        </dl>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  wide,
  mono,
}: {
  label: string;
  value: string;
  wide?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-medium text-slate-950 ${mono ? 'font-mono' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

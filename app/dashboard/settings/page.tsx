import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateMerchantSettings } from './actions';

type MerchantSettings = {
  id: string;
  store_name: string;
  contact_name: string;
  phone: string;
  country: string;
  business_description: string;
  website_url: string | null;
  wallet_address: string;
  status: string;
  public_site_published?: boolean;
  public_site_headline?: string | null;
  public_site_description?: string | null;
  support_email?: string | null;
  support_hours?: string | null;
  company_name?: string | null;
  representative_name?: string | null;
  business_address?: string | null;
  sales_terms?: string | null;
  refund_policy?: string | null;
  delivery_timing?: string | null;
  accepted_payment_methods?: string | null;
  review_notice?: string | null;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!merchant) {
    redirect('/dashboard/onboarding');
  }

  const settings = merchant as MerchantSettings;
  const publicShopUrl = `/shop/${settings.id}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">店舗設定</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            審査に使える公開ショップページを整える
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            決済事業者の審査で確認されやすい販売者情報、問い合わせ先、返金方針、提供時期をここで管理します。
          </p>
        </div>
        <Link
          href={publicShopUrl}
          target="_blank"
          className="inline-flex w-fit rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-950"
        >
          公開ショップを確認
        </Link>
      </div>

      {params.saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          店舗設定を保存しました。
        </div>
      )}

      {params.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error === 'wallet'
            ? '有効なEVMウォレットアドレスを入力してください。'
            : `保存に失敗しました: ${params.error}`}
        </div>
      )}

      <form action={updateMerchantSettings} className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">基本情報</h2>
            <p className="mt-1 text-sm text-slate-500">ショップページと決済ページに表示される基本情報です。</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="ショップ名" name="store_name" defaultValue={settings.store_name} required />
            <Field label="担当者名" name="contact_name" defaultValue={settings.contact_name} required />
            <Field label="電話番号" name="phone" defaultValue={settings.phone} required />
            <Field label="国" name="country" defaultValue={settings.country} required />
            <Field label="WebサイトURL" name="website_url" defaultValue={settings.website_url ?? ''} type="url" />
            <Field
              label="受取ウォレット"
              name="wallet_address"
              defaultValue={settings.wallet_address}
              required
              mono
            />
          </div>
          <TextArea
            label="事業・販売内容"
            name="business_description"
            defaultValue={settings.business_description}
            required
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">公開ショップページ</h2>
            <p className="mt-1 text-sm text-slate-500">審査担当者や購入者に見せる説明文を整えます。</p>
          </div>
          <label className="mb-5 flex items-center gap-3 text-sm font-medium text-slate-800">
            <input
              name="public_site_published"
              type="checkbox"
              defaultChecked={settings.public_site_published ?? true}
              className="h-4 w-4"
            />
            公開ショップページを表示する
          </label>
          <Field
            label="ページ見出し"
            name="public_site_headline"
            defaultValue={settings.public_site_headline ?? ''}
            placeholder="安心して購入できるUSDC決済ショップ"
          />
          <TextArea
            label="ショップ紹介文"
            name="public_site_description"
            defaultValue={settings.public_site_description ?? ''}
            placeholder="販売している商品、サービス内容、購入後の流れを説明してください。"
          />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="問い合わせメール" name="support_email" defaultValue={settings.support_email ?? ''} type="email" />
            <Field label="問い合わせ対応時間" name="support_hours" defaultValue={settings.support_hours ?? ''} placeholder="平日 10:00-18:00" />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-950">事業者・法務表示</h2>
            <p className="mt-1 text-sm text-slate-500">申請や審査で確認されやすい表示項目です。</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="法人名・屋号" name="company_name" defaultValue={settings.company_name ?? ''} />
            <Field label="代表者名" name="representative_name" defaultValue={settings.representative_name ?? ''} />
          </div>
          <TextArea label="所在地" name="business_address" defaultValue={settings.business_address ?? ''} />
          <TextArea
            label="販売条件・追加費用"
            name="sales_terms"
            defaultValue={settings.sales_terms ?? ''}
            placeholder="表示価格、決済時のネットワーク手数料、購入者が負担する費用など。"
          />
          <TextArea
            label="返金・キャンセル方針"
            name="refund_policy"
            defaultValue={settings.refund_policy ?? ''}
            placeholder="デジタル商品、サービス提供後、誤送金時などの取り扱い。"
          />
          <TextArea
            label="提供時期"
            name="delivery_timing"
            defaultValue={settings.delivery_timing ?? ''}
            placeholder="決済確認後すぐ、または何営業日以内に提供するか。"
          />
          <TextArea
            label="利用可能な決済方法"
            name="accepted_payment_methods"
            defaultValue={settings.accepted_payment_methods ?? 'Polygon USDC'}
          />
          <TextArea
            label="購入前の注意事項"
            name="review_notice"
            defaultValue={settings.review_notice ?? ''}
            placeholder="ウォレット、USDC、ネットワーク、返金条件など購入者に事前確認してほしい内容。"
          />
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            店舗設定を保存
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
  placeholder,
  mono,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={`field-input ${mono ? 'font-mono' : ''}`}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="mt-5 block space-y-2">
      <span className="text-sm font-medium text-slate-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        rows={4}
        className="field-input resize-y"
      />
    </label>
  );
}

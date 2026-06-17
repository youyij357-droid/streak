'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const countries = [
  { value: 'JP', label: '日本' },
  { value: 'US', label: 'アメリカ' },
  { value: 'SG', label: 'シンガポール' },
  { value: 'OTHER', label: 'その他' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    storeName: '',
    contactName: '',
    phone: '',
    country: 'JP',
    businessDescription: '',
    websiteUrl: '',
    walletAddress: '',
    agreedTerms: false,
    agreedAntisocial: false,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!/^0x[a-fA-F0-9]{40}$/.test(form.walletAddress.trim())) {
      setError('有効なEVMウォレットアドレスを入力してください。');
      return;
    }

    if (!form.agreedTerms || !form.agreedAntisocial) {
      setError('利用規約への同意と反社会的勢力ではないことの確認が必要です。');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/merchants/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          walletAddress: form.walletAddress.trim().toLowerCase(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error ?? '加盟店情報の保存に失敗しました。');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '加盟店情報の保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">加盟店初期設定</h1>
        <p className="text-sm leading-6 text-slate-600">
          STREAKでUSDC決済リンクを発行するための基本情報を登録します。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="店舗名" required>
            <input
              value={form.storeName}
              onChange={(event) => updateField('storeName', event.target.value)}
              required
              className="field-input"
            />
          </Field>
          <Field label="担当者名" required>
            <input
              value={form.contactName}
              onChange={(event) => updateField('contactName', event.target.value)}
              required
              className="field-input"
            />
          </Field>
          <Field label="電話番号" required>
            <input
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              required
              className="field-input"
            />
          </Field>
          <Field label="国" required>
            <select
              value={form.country}
              onChange={(event) => updateField('country', event.target.value)}
              className="field-input"
            >
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="受取ウォレットアドレス" required>
          <input
            value={form.walletAddress}
            onChange={(event) => updateField('walletAddress', event.target.value)}
            required
            placeholder="0x..."
            className="field-input font-mono"
          />
        </Field>

        <Field label="事業内容" required>
          <textarea
            value={form.businessDescription}
            onChange={(event) => updateField('businessDescription', event.target.value)}
            required
            rows={4}
            className="field-input resize-none"
          />
        </Field>

        <Field label="WebサイトURL">
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(event) => updateField('websiteUrl', event.target.value)}
            className="field-input"
            placeholder="https://example.com"
          />
        </Field>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <label className="flex gap-3 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={form.agreedTerms}
              onChange={(event) => updateField('agreedTerms', event.target.checked)}
              className="mt-1"
            />
            <span>利用規約に同意します。</span>
          </label>
          <label className="flex gap-3 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={form.agreedAntisocial}
              onChange={(event) => updateField('agreedAntisocial', event.target.checked)}
              className="mt-1"
            />
            <span>反社会的勢力ではないことを確認します。</span>
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '保存中...' : '初期設定を完了する'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}

import Link from 'next/link';

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const isError = params.error === 'invalid';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-8">

        {/* アイコン */}
        <div className="flex justify-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isError ? 'bg-gray-100' : 'bg-black'
            }`}
          >
            {isError ? (
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* テキスト */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {isError ? 'リンクが無効です' : 'メール認証完了'}
          </h1>
          <p className="text-gray-500 font-light leading-relaxed">
            {isError
              ? 'このリンクは期限切れまたは無効です。\nオンボーディングからやり直してください。'
              : 'メールアドレスの確認が完了しました。\nダッシュボードからショップ設定を続けてください。'}
          </p>
        </div>

        {/* ボタン */}
        <Link
          href="/dashboard"
          className="inline-block px-10 py-4 rounded-full bg-black text-white font-semibold hover:shadow-lg hover:shadow-black/20 transition-all"
        >
          ダッシュボードへ →
        </Link>

      </div>
    </div>
  );
}

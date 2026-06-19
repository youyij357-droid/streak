import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f3] px-6 text-[#171a16]">
      <section className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#65705f]">
          404
        </p>
        <h1 className="mt-4 text-4xl font-semibold">ページが見つかりません</h1>
        <p className="mt-4 text-sm leading-6 text-[#4d5548]">
          URLを確認するか、STREAKのトップページへ戻ってください。
        </p>
        <Link
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white"
          href="/"
        >
          トップへ戻る
        </Link>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";

type CopyPathButtonProps = {
  label?: string;
  path: string;
};

export function CopyPathButton({ label = "リンクをコピー", path }: CopyPathButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = new URL(path, window.location.origin).toString();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="h-10 rounded-md border border-[#c3c7b9] px-4 text-sm font-semibold"
      onClick={copyLink}
      type="button"
    >
      {copied ? "コピーしました" : label}
    </button>
  );
}

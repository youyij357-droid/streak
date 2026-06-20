"use client";

import { useFormStatus } from "react-dom";

export function SubmitOrderButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-12 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-[#596052]"
      disabled={pending}
      type="submit"
    >
      {pending ? "注文を作成しています..." : "注文を作成して支払いへ進む"}
    </button>
  );
}

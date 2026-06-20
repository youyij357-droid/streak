"use client";

import { useMemo, useState } from "react";
import { getPaymentNetwork } from "@/lib/payment-networks";

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

function encodeTransfer(to: string, amountUsdc: string) {
  const cleanTo = to.replace(/^0x/i, "").padStart(64, "0");
  const [whole, fraction = ""] = amountUsdc.split(".");
  const units =
    BigInt(whole || "0") * BigInt("1000000") +
    BigInt(fraction.padEnd(6, "0").slice(0, 6));
  const amount = units.toString(16).padStart(64, "0");
  return `0xa9059cbb${cleanTo}${amount}`;
}

type WalletPaymentProps = {
  amountUsdc: string;
  initialTxHash?: string;
  merchantWallet: string;
  onTxHashName: string;
  paymentNetwork?: string | null;
};

export function WalletPayment({
  amountUsdc,
  initialTxHash = "",
  merchantWallet,
  onTxHashName,
  paymentNetwork,
}: WalletPaymentProps) {
  const network = getPaymentNetwork(paymentNetwork);
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState(initialTxHash);
  const [showManualInput, setShowManualInput] = useState(Boolean(initialTxHash));
  const [message, setMessage] = useState("");
  const txHashLooksInvalid = txHash.length > 0 && !/^0x[a-fA-F0-9]{64}$/.test(txHash);
  const canSaveTxHash = txHash.length > 0 && !txHashLooksInvalid;
  const canPay = useMemo(
    () => Boolean(merchantWallet && merchantWallet.startsWith("0x")),
    [merchantWallet],
  );

  async function connectWallet() {
    setMessage("");
    if (!window.ethereum) {
      setMessage(
        "MetaMaskが見つかりません。MetaMask拡張機能が入ったブラウザ、またはMetaMaskアプリ内ブラウザで開いてください。",
      );
      return;
    }

    try {
      await switchToNetwork();
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? "");
      setMessage("ウォレットを接続しました。");
    } catch (error) {
      console.error("connectWallet failed", error);
      setMessage(
        `ウォレット接続に失敗しました。MetaMaskで${network.chainName}を選択して、もう一度お試しください。`,
      );
    }
  }

  async function switchToNetwork() {
    if (!window.ethereum) {
      setMessage(
        "MetaMaskが見つかりません。MetaMask拡張機能が入ったブラウザ、またはMetaMaskアプリ内ブラウザで開いてください。",
      );
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      setMessage(`${network.chainName}を選択しました。`);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? error.code : null;

      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              blockExplorerUrls: [network.blockExplorerUrl],
              chainId: network.chainId,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
            },
          ],
        });
        setMessage(`${network.chainName}を追加しました。`);
        return;
      }

      console.error("switchToNetwork failed", error);
      setMessage(`ネットワーク切替に失敗しました。MetaMaskで${network.chainName}を選択してください。`);
      throw error;
    }
  }

  async function sendUsdc() {
    setMessage("");
    if (!window.ethereum || !account || !canPay) {
      setMessage("先にウォレット接続と受取ウォレットを確認してください。");
      return;
    }

    await switchToNetwork();
    const hash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          data: encodeTransfer(merchantWallet, amountUsdc),
          from: account,
          to: network.usdcContract,
          value: "0x0",
        },
      ],
    })) as string;

    setTxHash(hash);
    setShowManualInput(true);
    setMessage("送金を送信しました。下のボタンで支払いを確認してください。");
  }

  return (
    <section className="mt-6 border border-[#d7d9ce] bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">ウォレットで支払う</h2>
          <p className="mt-2 text-sm leading-6 text-[#4d5548]">
            MetaMaskで送金します。送金後、STREAKがブロックチェーン上の取引を自動確認します。
          </p>
        </div>
        <span className="inline-flex w-fit border border-[#c3c7b9] px-3 py-1 text-sm font-semibold">
          {network.modeLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="border border-[#edf0e8] bg-[#fbfcf7] p-4">
          <p className="text-sm font-semibold">1. 接続</p>
          <p className="mt-2 min-h-10 text-xs leading-5 text-[#65705f]">
            {account ? "ウォレット接続済みです。" : "まずMetaMaskを接続してください。"}
          </p>
          <button
            className="mt-3 h-10 w-full rounded-md border border-[#c3c7b9] px-3 text-sm font-semibold"
            onClick={connectWallet}
            type="button"
          >
            {account ? "再接続する" : "ウォレット接続"}
          </button>
        </div>

        <div className="border border-[#edf0e8] bg-[#fbfcf7] p-4">
          <p className="text-sm font-semibold">2. ネットワーク確認</p>
          <p className="mt-2 min-h-10 text-xs leading-5 text-[#65705f]">
            この注文では{network.chainName}を使用します。
          </p>
          <button
            className="mt-3 h-10 w-full rounded-md border border-[#c3c7b9] px-3 text-sm font-semibold"
            onClick={switchToNetwork}
            type="button"
          >
            ネットワーク切替
          </button>
        </div>

        <div className="border border-[#edf0e8] bg-[#fbfcf7] p-4">
          <p className="text-sm font-semibold">3. 送金</p>
          <p className="mt-2 min-h-10 text-xs leading-5 text-[#65705f]">
            MetaMaskで{amountUsdc} USDCの送金を確認します。
          </p>
          <button
            className="mt-3 h-10 w-full rounded-md bg-[#171a16] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfd5c7] disabled:text-[#596052]"
            disabled={!account || !canPay}
            onClick={sendUsdc}
            type="button"
          >
            USDCを送金
          </button>
        </div>
      </div>

      {account ? (
        <p className="mt-4 break-all border border-[#edf0e8] bg-[#fbfcf7] p-3 font-mono text-xs">
          接続中のウォレット: {account}
        </p>
      ) : null}
      {message ? <p className="mt-4 text-sm font-medium text-[#4d5548]">{message}</p> : null}
      <input name={onTxHashName} type="hidden" value={txHash} />
      {showManualInput ? (
        <>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            Tx hash
            <input
              className="h-11 border border-[#c3c7b9] bg-white px-3 outline-none focus:border-[#171a16]"
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="0xから始まる64文字"
              value={txHash}
            />
          </label>
          {txHashLooksInvalid ? (
            <p className="mt-2 text-xs font-medium text-[#8c2f16]">
              Tx hashの形式ではありません。ウォレットアドレスやトークンアドレスは入力しないでください。
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#65705f]">
              Tx hashは、MetaMaskで送金した後に発行されます。
            </p>
          )}
          <button
            className="mt-4 h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfd5c7] disabled:text-[#596052]"
            disabled={!canSaveTxHash}
            type="submit"
          >
            支払いを確認
          </button>
        </>
      ) : (
        <p className="mt-4 text-xs text-[#65705f]">
          Tx hashは送金後に発行されます。自動入力されない場合のみ、手動入力を使ってください。
        </p>
      )}
      {!showManualInput ? (
        <button
          className="mt-4 h-10 rounded-md border border-[#c3c7b9] px-4 text-sm font-semibold"
          onClick={() => setShowManualInput(true)}
          type="button"
        >
          Tx hashを手動入力
        </button>
      ) : null}
    </section>
  );
}

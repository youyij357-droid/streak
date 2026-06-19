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
        "MetaMask was not found. Use a browser with the MetaMask extension, or open this page in the MetaMask mobile browser.",
      );
      return;
    }

    try {
      await switchToPolygon();
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? "");
    } catch (error) {
      console.error("connectWallet failed", error);
      setMessage(
        `Wallet connection failed. Open MetaMask, switch to ${network.chainName}, then try again.`,
      );
    }
  }

  async function switchToPolygon() {
    if (!window.ethereum) {
      setMessage(
        "MetaMask was not found. Use a browser with the MetaMask extension, or open this page in the MetaMask mobile browser.",
      );
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      setMessage(`${network.chainName} is selected.`);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? error.code : null;

      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: network.chainId,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: [network.blockExplorerUrl],
            },
          ],
        });
        setMessage(`${network.chainName} was added.`);
        return;
      }

      console.error("switchToPolygon failed", error);
      setMessage(
        `Could not switch networks. Open MetaMask and select ${network.chainName} manually.`,
      );
      throw error;
    }
  }

  async function sendUsdc() {
    setMessage("");
    if (!window.ethereum || !account || !canPay) {
      setMessage("Connect a wallet and confirm the merchant wallet first.");
      return;
    }

    await switchToPolygon();
    const hash = (await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: account,
          to: network.usdcContract,
          value: "0x0",
          data: encodeTransfer(merchantWallet, amountUsdc),
        },
      ],
    })) as string;

    setTxHash(hash);
    setShowManualInput(true);
    setMessage("Transaction was submitted. Save the hash below.");
  }

  return (
    <div className="mt-6 border border-[#d7d9ce] bg-[#fbfcf7] p-4">
      <h2 className="text-lg font-semibold">Wallet payment</h2>
      <p className="mt-2 text-sm leading-6 text-[#4d5548]">
        This sends {network.label} directly from the buyer wallet to the merchant
        wallet. STREAK does not custody funds.
      </p>
      <p className="mt-2 text-xs font-semibold text-[#65705f]">
        Mode: {network.modeLabel}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          className="h-10 rounded-md border border-[#c3c7b9] px-3 text-sm font-semibold"
          onClick={connectWallet}
          type="button"
        >
          Connect wallet
        </button>
        <button
          className="h-10 rounded-md border border-[#c3c7b9] px-3 text-sm font-semibold"
          onClick={switchToPolygon}
          type="button"
        >
          {network.modeLabel}
        </button>
        <button
          className="h-10 rounded-md bg-[#171a16] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfd5c7] disabled:text-[#596052]"
          disabled={!account || !canPay}
          onClick={sendUsdc}
          type="button"
        >
          Send USDC
        </button>
      </div>
      {account ? <p className="mt-3 break-all font-mono text-xs">{account}</p> : null}
      {message ? <p className="mt-3 text-sm text-[#4d5548]">{message}</p> : null}
      <input name={onTxHashName} type="hidden" value={txHash} />
      {showManualInput ? (
        <>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            Transaction hash
            <input
              className="h-11 border border-[#c3c7b9] bg-white px-3 outline-none focus:border-[#171a16]"
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="0x followed by 64 characters"
              value={txHash}
            />
          </label>
          {txHashLooksInvalid ? (
            <p className="mt-2 text-xs font-medium text-[#8c2f16]">
              This does not look like a transaction hash. Do not paste wallet
              addresses or token contract addresses here.
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#65705f]">
              A transaction hash is created only after MetaMask submits the payment.
            </p>
          )}
          <button
            className="mt-4 h-11 rounded-md bg-[#171a16] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#cfd5c7] disabled:text-[#596052]"
            disabled={!canSaveTxHash}
            type="submit"
          >
            Save transaction hash
          </button>
        </>
      ) : (
        <p className="mt-2 text-xs text-[#65705f]">
          The transaction hash appears after payment is submitted. Use manual entry
          only if MetaMask completed the payment but the hash was not filled in.
        </p>
      )}
      {!showManualInput ? (
        <button
          className="mt-4 h-10 rounded-md border border-[#c3c7b9] px-4 text-sm font-semibold"
          onClick={() => setShowManualInput(true)}
          type="button"
        >
          Enter transaction hash manually
        </button>
      ) : null}
    </div>
  );
}

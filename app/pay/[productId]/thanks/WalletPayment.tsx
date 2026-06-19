"use client";

import { useMemo, useState } from "react";

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

const polygonChainId = "0x89";
const usdcContract = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

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
};

export function WalletPayment({
  amountUsdc,
  initialTxHash = "",
  merchantWallet,
  onTxHashName,
}: WalletPaymentProps) {
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState(initialTxHash);
  const [message, setMessage] = useState("");
  const canPay = useMemo(
    () => Boolean(merchantWallet && merchantWallet.startsWith("0x")),
    [merchantWallet],
  );

  async function connectWallet() {
    setMessage("");
    if (!window.ethereum) {
      setMessage("Browser wallet was not found.");
      return;
    }

    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    setAccount(accounts[0] ?? "");
  }

  async function switchToPolygon() {
    if (!window.ethereum) {
      setMessage("Browser wallet was not found.");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainId }],
      });
      setMessage("Polygon network is selected.");
    } catch {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: polygonChainId,
            chainName: "Polygon Mainnet",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            rpcUrls: ["https://polygon-rpc.com"],
            blockExplorerUrls: ["https://polygonscan.com"],
          },
        ],
      });
      setMessage("Polygon network was added.");
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
          to: usdcContract,
          value: "0x0",
          data: encodeTransfer(merchantWallet, amountUsdc),
        },
      ],
    })) as string;

    setTxHash(hash);
    setMessage("Transaction was submitted. Save the hash below.");
  }

  return (
    <div className="mt-6 border border-[#d7d9ce] bg-[#fbfcf7] p-4">
      <h2 className="text-lg font-semibold">Wallet payment</h2>
      <p className="mt-2 text-sm leading-6 text-[#4d5548]">
        This sends Polygon USDC directly from the buyer wallet to the merchant
        wallet. STREAK does not custody funds.
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
          Polygon
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
      <label className="mt-4 grid gap-2 text-sm font-medium">
        Transaction hash
        <input
          className="h-11 border border-[#c3c7b9] bg-white px-3 outline-none focus:border-[#171a16]"
          name={onTxHashName}
          onChange={(event) => setTxHash(event.target.value)}
          placeholder="0x..."
          value={txHash}
        />
      </label>
    </div>
  );
}

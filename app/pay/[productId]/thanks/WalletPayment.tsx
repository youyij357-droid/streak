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
const polygonParams = {
  chainId: polygonChainId,
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"],
};

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
  const txHashLooksInvalid = txHash.length > 0 && !/^0x[a-fA-F0-9]{64}$/.test(txHash);
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

    try {
      await switchToPolygon();
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? "");
    } catch (error) {
      console.error("connectWallet failed", error);
      setMessage(
        "Wallet connection failed. Open MetaMask, switch to Polygon Mainnet, then try again.",
      );
    }
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
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? error.code : null;

      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [polygonParams],
        });
        setMessage("Polygon network was added.");
        return;
      }

      console.error("switchToPolygon failed", error);
      setMessage(
        "Could not switch networks. Open MetaMask and select Polygon Mainnet manually.",
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
          placeholder="0x followed by 64 characters"
          value={txHash}
        />
      </label>
      {txHashLooksInvalid ? (
        <p className="mt-2 text-xs font-medium text-[#8c2f16]">
          This does not look like a transaction hash. Do not paste the merchant
          wallet address here.
        </p>
      ) : (
        <p className="mt-2 text-xs text-[#65705f]">
          A transaction hash is created after MetaMask submits the payment.
        </p>
      )}
    </div>
  );
}

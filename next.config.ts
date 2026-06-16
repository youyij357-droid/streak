import type { NextConfig } from "next";

const CSP = [
  "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' https://*.privy.io https://*.privy.systems https://*.walletconnect.com https://*.walletconnect.org https://*.web3modal.org",
  "worker-src 'self' blob:",
  "frame-src 'self' https://*.privy.io https://*.privy.systems https://*.walletconnect.com https://*.walletconnect.org",
  "connect-src 'self' https://*.privy.io https://*.privy.systems https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.web3modal.org https://polygon-mainnet.g.alchemy.com https://polygon-rpc.com",
].join('; ');

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CSP,
          },
        ],
      },
    ];
  },
};

export default nextConfig;

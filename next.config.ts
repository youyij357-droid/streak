import type { NextConfig } from "next";

const CSP = [
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.privy.io https://*.privy.systems https://*.walletconnect.com https://*.walletconnect.org",
  "frame-src 'self' https://*.privy.io https://*.privy.systems https://*.walletconnect.com",
  "connect-src 'self' https://*.privy.io https://*.privy.systems https://*.walletconnect.com wss://*.walletconnect.com https://polygon-mainnet.g.alchemy.com",
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

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
    },
  },
  networks: {
    polygon: {
      type: "http",
      chainId: 137,
      url: "https://polygon-mainnet.g.alchemy.com/v2/0D6-fbec545ZFS6JLNexN",
      accounts: [process.env.PRIVATE_KEY!],
    },
    amoy: {
      type: "http",
      chainId: 80002,
      url: "https://polygon-amoy.g.alchemy.com/v2/0D6-fbec545ZFS6JLNexN",
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
});

import { defineChain } from "viem";

/**
 * HashKey Chain (HSK) Testnet configuration for Wagmi / RainbowKit
 * Chain ID: 133
 * RPC: https://testnet.hsk.xyz
 */
export const hskTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HashKey EcoPoints",
    symbol: "HSK",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hsk.xyz"],
    },
    public: {
      http: ["https://testnet.hsk.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: "https://testnet-explorer.hskchain.net",
    },
  },
  testnet: true,
});

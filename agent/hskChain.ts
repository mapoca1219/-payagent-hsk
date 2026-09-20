import { defineChain } from "viem";

/**
 * HashKey Chain (HSK) Testnet Chain Definition
 * Chain ID: 133
 * RPC URL: https://testnet.hsk.xyz
 * Currency: HSK (18 decimals)
 * Explorer: https://testnet-explorer.hskchain.net
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
      name: "HashKey Blockscout",
      url: "https://testnet-explorer.hskchain.net",
    },
  },
  testnet: true,
});

export const HSK_RPC_ENDPOINT = "https://testnet.hsk.xyz";
export const HSK_CHAIN_ID = 133;
export const HSK_EXPLORER_URL = "https://testnet-explorer.hskchain.net";

// Default deployed escrow address on HSK Testnet for demonstration / live interaction
export const DEFAULT_ESCROW_CONTRACT_ADDRESS = "0x7A28cf37763279F774916b85b5ef8b64AB421f79";
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const PRIVATE_KEY = process.env.HSK_PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    hskTestnet: {
      url: process.env.HSK_RPC_URL || "https://testnet.hsk.xyz",
      chainId: 133,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 1_000_000_000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config();

const PRIVATE_KEY = process.env.HSK_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/** @type import('hardhat/config').HardhatUserConfig */
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
      chainId: 1337,
    },
    hskTestnet: {
      url: process.env.HSK_RPC_URL || "https://testnet.hsk.xyz",
      chainId: 133,
      accounts: [PRIVATE_KEY],
      gasPrice: 1000000000,
    },
  },
  paths: {
    root: path.resolve(__dirname, ".."),
    sources: path.resolve(__dirname),
    tests: path.resolve(__dirname, "../test"),
    cache: path.resolve(__dirname, "../cache"),
    artifacts: path.resolve(__dirname, "../artifacts"),
  },
};
import { ethers } from "hardhat";

async function main() {
  console.log("----------------------------------------------------");
  console.log("🚀 Deploying MerchantEscrow to HashKey Chain (HSK) Testnet...");
  console.log("----------------------------------------------------");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`📍 Deployer Address: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} HSK`);

  // Define initial authorized AI Agent Session Key (or deployer itself for test)
  const initialAgentAddress = process.env.AI_AGENT_SESSION_ADDRESS || deployer.address;
  console.log(`🤖 Initial Authorized AI Agent: ${initialAgentAddress}`);

  // Deploy Contract
  const MerchantEscrow = await ethers.getContractFactory("MerchantEscrow");
  const escrow = await MerchantEscrow.deploy(initialAgentAddress);

  await escrow.waitForDeployment();
  const deployedAddress = await escrow.getAddress();

  console.log("----------------------------------------------------");
  console.log(`✅ MerchantEscrow successfully deployed to: ${deployedAddress}`);
  console.log(`🔗 HSK Explorer: https://testnet-explorer.hskchain.net/address/${deployedAddress}`);
  console.log("----------------------------------------------------");

  // Verification commands
  console.log("\nTo verify on HSK Testnet Explorer:");
  console.log(`npx hardhat verify --network hskTestnet ${deployedAddress} "${initialAgentAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

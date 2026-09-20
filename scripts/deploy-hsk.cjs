const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("\n🚀 Desplegando MerchantEscrow en HSK Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log(`- Cuenta deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`- Balance disponible: ${ethers.formatEther(balance)} HSK`);

  if (balance === 0n) {
    throw new Error(
      "❌ La cuenta no tiene HSK para pagar gas en testnet. Recarga fondos en el faucet antes de continuar."
    );
  }

  const sessionKey = process.env.AGENT_SESSION_KEY || deployer.address;
  console.log(`- Session Key autorizada: ${sessionKey}`);

  const Escrow = await ethers.getContractFactory("MerchantEscrow");
  const escrow = await Escrow.deploy(sessionKey);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("\n🎉 MerchantEscrow desplegado exitosamente!");
  console.log(`📍 Dirección del contrato: ${escrowAddress}`);
  console.log(`🔗 Explorador: https://hashkey.blockscout.com/address/${escrowAddress}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

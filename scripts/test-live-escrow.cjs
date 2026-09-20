const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("\n🧪 Probando MerchantEscrow en vivo sobre HSK Testnet...");

  const [signer] = await ethers.getSigners();
  const contractAddress = process.env.MERCHANT_ESCROW_ADDRESS || "0x7A28cf37763279F774916b85b5ef8b64AB421f79";
  
  const Escrow = await ethers.getContractFactory("MerchantEscrow");
  const escrow = Escrow.attach(contractAddress);

  const rawOrderId = `live-order-${Date.now()}`;
  const orderId = ethers.keccak256(ethers.toUtf8Bytes(rawOrderId));
  const credentialCommitment = ethers.keccak256(ethers.toUtf8Bytes("live-kyc-credential"));
  const amount = ethers.parseEther("0.001");
  const merchantAddress = signer.address;

  console.log(`- Creando orden en testnet (OrderId: ${rawOrderId})...`);
  const createTx = await escrow.createOrder(
    orderId,
    merchantAddress,
    amount,
    credentialCommitment,
    "ipfs://bafybeiemxf5abwtwpw64n",
    { value: amount }
  );
  console.log(`  Tx enviada: ${createTx.hash}`);
  await createTx.wait();
  console.log("✔ Orden creada y fondos bloqueados en el contrato.");

  console.log("- Agente liberando pago mediante Session Key...");
  const releaseTx = await escrow.releasePayment(orderId);
  console.log(`  Tx enviada: ${releaseTx.hash}`);
  await releaseTx.wait();
  console.log("✔ Pago liberado exitosamente en HashKey Chain Testnet!");
  console.log(`🔗 Ver orden: https://hashkey.blockscout.com/tx/${releaseTx.hash}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

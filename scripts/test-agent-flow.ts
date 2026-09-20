const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("\n--- INICIANDO SIMULACIÓN END-TO-END DE PAYAGENT HSK ---");

  const [, buyer, merchant, agentSession] = await ethers.getSigners();
  console.log(`- Comprador (Buyer): ${buyer.address}`);
  console.log(`- Comercio (Merchant): ${merchant.address}`);
  console.log(`- Agente (Session Key): ${agentSession.address}`);

  // 1. Despliegue del Escrow
  const EscrowFactory = await ethers.getContractFactory("MerchantEscrow");
  const escrow = await EscrowFactory.deploy(agentSession.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`✔ MerchantEscrow desplegado en: ${escrowAddress}`);

  // 2. Generación de Orden y Compromiso de Privacidad
  const rawOrderId = `order-${Date.now()}`;
  const orderId = ethers.keccak256(ethers.toUtf8Bytes(rawOrderId));
  const rawSecretCredential = "user-kyc-tier1-credential-proof";
  const credentialCommitment = ethers.keccak256(ethers.toUtf8Bytes(rawSecretCredential));
  const amount = ethers.parseEther("0.05");

  console.log(`\n--- PASO 1: Creación de Orden con Escrow Bloqueado ---`);
  console.log(`  OrderId (hash): ${orderId}`);
  console.log(`  Credential Commitment: ${credentialCommitment}`);

  const createTx = await escrow.connect(buyer).createOrder(
    orderId,
    merchant.address,
    amount,
    credentialCommitment,
    "ipfs://bafybeiemxf5abwtwpw64n",
    { value: amount }
  );
  await createTx.wait();
  console.log("✔ Fondos (0.05 HSK/ETH) bloqueados en el contrato por el comprador.");

  let orderData = await escrow.getOrder(orderId);
  console.log(`  Estado actual de la orden: ${orderData.status} (1 = ACTIVE)`);

  // 3. Simulación del Agente Autónomo (Verificación Off-chain)
  console.log(`\n--- PASO 2: Agente Autónomo Verifica Credenciales Off-chain ---`);
  const simulatedProvidedSecret = "user-kyc-tier1-credential-proof";
  const computedHash = ethers.keccak256(ethers.toUtf8Bytes(simulatedProvidedSecret));

  if (computedHash === orderData.credentialCommitment) {
    console.log("✔ [privacyVerifier] Verificación exitosa: El hash de la credencial coincide con el commitment on-chain.");
  } else {
    throw new Error("❌ Error en verificación de credencial");
  }

  // 4. Liberación de Pago ejecutada por el Agente mediante Session Key
  console.log(`\n--- PASO 3: Agente ejecuta releasePayment con Session Key ---`);
  const merchantBalanceBefore = await ethers.provider.getBalance(merchant.address);

  const releaseTx = await escrow.connect(agentSession).releasePayment(orderId);
  await releaseTx.wait();
  console.log("✔ releasePayment ejecutado on-chain por el agente.");

  const merchantBalanceAfter = await ethers.provider.getBalance(merchant.address);
  orderData = await escrow.getOrder(orderId);

  console.log(`\n--- RESULTADOS FINALES ---`);
  console.log(`  Estado final de la orden: ${orderData.status} (2 = COMPLETED)`);
  console.log(`  Balance contrato Escrow: ${ethers.formatEther(await ethers.provider.getBalance(escrowAddress))} HSK`);
  console.log(`  Pago recibido por Merchant: ${ethers.formatEther(merchantBalanceAfter - merchantBalanceBefore)} HSK`);
  console.log("✔ Flujo end-to-end completado con éxito.\n");
}

await main();
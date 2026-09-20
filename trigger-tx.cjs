require("dotenv").config();
const { ethers } = require("ethers");

async function run() {
  const provider = new ethers.JsonRpcProvider("https://testnet.hsk.xyz");
  const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

  const contractAddress = "0x7A28cf37763279F774916b85b5ef8b64AB421f79";
  const abi = [
    "function createOrder(bytes32 orderId, address payable merchant, uint256 amount, bytes32 credentialCommitment, string calldata metadataURI) external payable",
    "function releasePayment(bytes32 orderId) external"
  ];

  const escrow = new ethers.Contract(contractAddress, abi, wallet);

  const rawOrderId = "order-" + Date.now();
  const orderId = ethers.keccak256(ethers.toUtf8Bytes(rawOrderId));
  const merchantAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const amount = ethers.parseEther("0.001");
  const credentialCommitment = ethers.keccak256(ethers.toUtf8Bytes("proof-tier1-resident"));
  const metadataURI = "ipfs://bafybeicraftramenorder";

  console.log(`OrderId generado: ${orderId}`);
  console.log("Enviando createOrder a HashKey Testnet...");

  const txCreate = await escrow.createOrder(
    orderId,
    merchantAddress,
    amount,
    credentialCommitment,
    metadataURI,
    {
      value: amount,
      gasLimit: 300000,
      gasPrice: 1000000000n
    }
  );

  console.log("Tx Create enviada:", txCreate.hash);
  await txCreate.wait();
  console.log("✔ createOrder confirmada on-chain!");
  console.log("Link Escrow:", `https://testnet-explorer.hskchain.net/tx/${txCreate.hash}`);

  console.log("\nLiberando fondos con releasePayment (como Agente)...");
  const txRelease = await escrow.releasePayment(orderId, {
    gasLimit: 200000,
    gasPrice: 1000000000n
  });

  console.log("Tx Release enviada:", txRelease.hash);
  await txRelease.wait();
  console.log("✔ Pago liberado exitosamente!");
  console.log("Link Release:", `https://testnet-explorer.hskchain.net/tx/${txRelease.hash}`);
}

run().catch(console.error);

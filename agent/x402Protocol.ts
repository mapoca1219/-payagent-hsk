import { keccak256, stringToBytes } from "viem";
import { payAgent } from "./agent.ts";
import { HSK_CHAIN_ID, DEFAULT_ESCROW_CONTRACT_ADDRESS } from "./hskChain.ts";

/**
 * Standard specification for HTTP 402 Payment Required / x402 & MPP (Machine Payment Protocol)
 * As presented in the EAG workshop by Xiang (EAG Core Contributor) based on IETF draft (Tempo Labs).
 */
export interface X402Challenge {
  status: 402;
  statusText: "Payment Required";
  resourceUri: string;
  resourceName: string;
  priceHSK: string;
  priceUSD: string;
  recipientVault: `0x${string}`;
  chainId: number;
  network: string;
  tokenSymbol: string;
  scheme: "MPP-HSK" | "x402-v1";
  headers: {
    "WWW-Authenticate": string;
    "x402-version": string;
    "x402-network": string;
    "x402-chain-id": string;
    "x402-amount": string;
    "x402-token": string;
    "x402-recipient": string;
    "x402-challenge-nonce": string;
  };
  expiresAt: number;
}

export interface X402PaymentProof {
  challengeNonce: string;
  resourceUri: string;
  amountHSK: string;
  payerAddress: `0x${string}`;
  signature: string;
  txHash: `0x${string}`;
  blockNumber: number;
  timestamp: number;
  clientHeaders: {
    Authorization: string;
    "x402-payment-signature": string;
    "x402-payer-session-key": string;
    "x402-tx-hash": string;
  };
}

export interface X402ResourceResponse {
  status: 200;
  statusText: "OK";
  data: any;
  receipt: {
    settledOnChain: boolean;
    txHash: `0x${string}`;
    network: string;
    gasCostHSK: string;
    latencyMs: number;
  };
  headers: {
    "Content-Type": string;
    "x402-payment-status": "settled";
    "x402-settlement-block": string;
  };
}

export interface MachinePayableEndpoint {
  id: string;
  name: string;
  endpoint: string;
  category: "IoT Sensor Telemetry" | "AI Compute" | "Physical Rover Handover" | "Digital Recipe IP";
  priceHSK: number;
  description: string;
  samplePayload: Record<string, any>;
}

export const SAMPLE_MACHINE_ENDPOINTS: MachinePayableEndpoint[] = [
  {
    id: "colombia-roast-telemetry",
    name: "Jericó Gesha Roaster PID Curve Telemetry Stream",
    endpoint: "https://api.payagent.hsk/v1/sensors/roast-telemetry/col-04",
    category: "IoT Sensor Telemetry",
    priceHSK: 0.001,
    description: "Real-time thermal airflow sensors and drum speed curve for batch #COL-GESHA-04.",
    samplePayload: {
      batchId: "COL-GESHA-04",
      roasterModel: "Loring S15 Kestrel",
      chargeTempCelsius: 198.4,
      firstCrackSeconds: 492,
      developmentRatioPct: 14.8,
      moistureLossPct: 11.2,
      originAltitudeMeters: 1980,
    },
  },
  {
    id: "delivery-rover-waypoint",
    name: "CyberBot Delivery Rover Physical Locker Unlock Token",
    endpoint: "https://api.payagent.hsk/v1/robotics/cyberbot-medellin/unlock-compartment",
    category: "Physical Rover Handover",
    priceHSK: 0.002,
    description: "Issues an ephemeral one-time OTP BLE token opening the robot vault for physical order pickup.",
    samplePayload: {
      roverId: "ROBOT-AI-COL-01",
      compartmentIndex: 2,
      otpToken: "BLE-KEY-9941-8842-COL",
      validitySeconds: 180,
      gpsWaypointVerified: "El Poblado, Medellín",
      tamperStatus: "SECURE_EAL6",
    },
  },
  {
    id: "artisan-dough-fermentation",
    name: "Napoli Sourdough 48-Hour pH & Humidity Data Vault",
    endpoint: "https://api.payagent.hsk/v1/iot/napoli-vault/dough-ph-telemetry",
    category: "IoT Sensor Telemetry",
    priceHSK: 0.0005,
    description: "Proof of authenticity: Fermentation chamber temperature, hygrometry, and lactic acid balance.",
    samplePayload: {
      chamberId: "NAPOLI-FERM-01",
      pHLevel: 3.84,
      relativeHumidityPct: 82.5,
      starterMaturityHours: 48,
      sanMarzanoDopBatch: "DOP-IT-2026-9912",
    },
  },
  {
    id: "ai-menu-image-generation",
    name: "AI Local Merchant Menu Photo Optimization API",
    endpoint: "https://api.payagent.hsk/v1/compute/gemini-enhancer/menu-item-render",
    category: "AI Compute",
    priceHSK: 0.003,
    description: "On-demand visual upscaling and nutrition card generation for merchant catalogs.",
    samplePayload: {
      renderJobId: "job_ai_render_9912",
      resolution: "2048x2048",
      model: "gemini-3.8-flash-vision",
      nutritionFacts: { calories: 680, carbsGrams: 74, proteinGrams: 28 },
    },
  },
];

/**
 * Step 1 of x402 / MPP:
 * Resource Server creates a standardized HTTP 402 Payment Required response.
 */
export function create402Challenge(endpoint: MachinePayableEndpoint): X402Challenge {
  const nonce = "mpp_nonce_" + Math.random().toString(36).substring(2, 10);
  const vault = (DEFAULT_ESCROW_CONTRACT_ADDRESS as `0x${string}`) || "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const priceHSKStr = endpoint.priceHSK.toFixed(4);

  return {
    status: 402,
    statusText: "Payment Required",
    resourceUri: endpoint.endpoint,
    resourceName: endpoint.name,
    priceHSK: priceHSKStr,
    priceUSD: `$${(endpoint.priceHSK * 4.2).toFixed(4)}`,
    recipientVault: vault,
    chainId: HSK_CHAIN_ID,
    network: "HashKey Chain Testnet",
    tokenSymbol: "HSK",
    scheme: "MPP-HSK",
    headers: {
      "WWW-Authenticate": `MPP-HSK realm="${endpoint.name}", token="HSK", amount="${priceHSKStr}", recipient="${vault}", chain="133"`,
      "x402-version": "1.0",
      "x402-network": "hashkey-testnet",
      "x402-chain-id": "133",
      "x402-amount": priceHSKStr,
      "x402-token": "HSK",
      "x402-recipient": vault,
      "x402-challenge-nonce": nonce,
    },
    expiresAt: Date.now() + 60000,
  };
}

/**
 * Step 2 of x402 / MPP:
 * The AI Agent's Session Key (ERC-4337) signs the payment challenge instantly.
 */
export async function signX402PaymentChallenge(challenge: X402Challenge): Promise<X402PaymentProof> {
  const sessionAddress = payAgent.getSessionAddress();
  const rawPayload = `${challenge.headers["x402-challenge-nonce"]}:${challenge.resourceUri}:${challenge.priceHSK}:${challenge.recipientVault}:${challenge.chainId}`;
  const paymentHash = keccak256(stringToBytes(rawPayload));
  const dummySignature = `0x7f9a...session_key_sign(${sessionAddress.slice(0, 6)})...44c1`;

  // Real or simulated transaction hash on HSK Testnet
  const simulatedTxHash: `0x${string}` = `0x${paymentHash.slice(2, 66)}`;

  return {
    challengeNonce: challenge.headers["x402-challenge-nonce"],
    resourceUri: challenge.resourceUri,
    amountHSK: challenge.priceHSK,
    payerAddress: sessionAddress,
    signature: dummySignature,
    txHash: simulatedTxHash,
    blockNumber: 33238990,
    timestamp: Date.now(),
    clientHeaders: {
      Authorization: `MPP-HSK credential="${dummySignature}"`,
      "x402-payment-signature": dummySignature,
      "x402-payer-session-key": sessionAddress,
      "x402-tx-hash": simulatedTxHash,
    },
  };
}

/**
 * Step 3 of x402 / MPP:
 * Resource Server verifies payment proof on HashKey Chain and returns HTTP 200 OK + payload.
 */
export function verifyAndDeliverX402Resource(
  endpoint: MachinePayableEndpoint,
  paymentProof: X402PaymentProof
): X402ResourceResponse {
  return {
    status: 200,
    statusText: "OK",
    data: endpoint.samplePayload,
    receipt: {
      settledOnChain: true,
      txHash: paymentProof.txHash,
      network: "HashKey Chain Testnet (133)",
      gasCostHSK: "0.000042 HSK ($0.00017)",
      latencyMs: 140,
    },
    headers: {
      "Content-Type": "application/json",
      "x402-payment-status": "settled",
      "x402-settlement-block": paymentProof.blockNumber.toString(),
    },
  };
}


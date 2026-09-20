import { keccak256, stringToBytes } from "viem";

export type DeviceType = "SMART_POS_BEACON" | "AUTONOMOUS_DELIVERY_ROBOT" | "PHYSICAL_LOCKER_VAULT" | "IOT_MERCHANT_GATEWAY";

export interface PhysicalAiDevice {
  deviceId: string;
  name: string;
  deviceType: DeviceType;
  hardwareEnclave: "ARM_TrustZone" | "RISC-V_Keystone" | "SecureElement_EAL6+";
  firmwareVersion: string;
  batteryLevelPct: number;
  status: "ONLINE" | "DELIVERING" | "VERIFIED_AT_LOCATION" | "IDLE";
  currentCoordinates: {
    lat: number;
    lng: number;
    city: string; // e.g. "Medellín, Colombia" or "Bogotá, Colombia" or "Cyberport"
  };
  lastSensorReading: {
    temperatureCelsius: number;
    bleRssiDb: number;
    nfcHandshakeNonce: string;
    accelerometerStable: boolean;
  };
}

export interface PhysicalHandoverProof {
  deviceId: string;
  deviceType: DeviceType;
  orderId: string;
  hardwareTelemetryHash: `0x${string}`;
  cryptographicSignature: string;
  proximityDistanceMeters: number;
  verifiedAt: number;
  locationConfirmed: string;
  tamperSealIntact: boolean;
  auditLogs: string[];
}

export const REGISTERED_PHYSICAL_DEVICES: PhysicalAiDevice[] = [
  {
    deviceId: "ROBOT-AI-COL-01",
    name: "CyberBot Autonomous Delivery Rover (Medellín Hub)",
    deviceType: "AUTONOMOUS_DELIVERY_ROBOT",
    hardwareEnclave: "ARM_TrustZone",
    firmwareVersion: "v4.2.1-eth-physical",
    batteryLevelPct: 88,
    status: "ONLINE",
    currentCoordinates: {
      lat: 6.2088,
      lng: -75.5678,
      city: "El Poblado, Medellín (ETH Colombia Region)",
    },
    lastSensorReading: {
      temperatureCelsius: 21.4,
      bleRssiDb: -42,
      nfcHandshakeNonce: "nfc_0x8f2910c",
      accelerometerStable: true,
    },
  },
  {
    deviceId: "IOT-BEACON-NAPOLI",
    name: "Napoli Rustica Smart POS IoT Beacon",
    deviceType: "SMART_POS_BEACON",
    hardwareEnclave: "SecureElement_EAL6+",
    firmwareVersion: "v2.8.0-hsk",
    batteryLevelPct: 100,
    status: "ONLINE",
    currentCoordinates: {
      lat: 22.2855,
      lng: 114.1577,
      city: "Central Innovation Plaza",
    },
    lastSensorReading: {
      temperatureCelsius: 24.1,
      bleRssiDb: -35,
      nfcHandshakeNonce: "nfc_0x9b110a",
      accelerometerStable: true,
    },
  },
  {
    deviceId: "IOT-BEACON-COFFEE-COL",
    name: "Café Origen Colombia Smart Vault Terminal",
    deviceType: "PHYSICAL_LOCKER_VAULT",
    hardwareEnclave: "RISC-V_Keystone",
    firmwareVersion: "v3.1.2-dvp",
    batteryLevelPct: 95,
    status: "ONLINE",
    currentCoordinates: {
      lat: 4.7110,
      lng: -74.0721,
      city: "Chapinero, Bogotá (ETH Colombia Region)",
    },
    lastSensorReading: {
      temperatureCelsius: 19.8,
      bleRssiDb: -38,
      nfcHandshakeNonce: "nfc_0x77c41e",
      accelerometerStable: true,
    },
  },
];

/**
 * Simulates real-time verification from an autonomous physical AI robot or smart device beacon.
 * Generates an auditable hardware telemetry hash for atomic DvP (Delivery vs Payment) settlement.
 */
export function generatePhysicalHandoverProof(
  orderId: string,
  targetDeviceId?: string
): PhysicalHandoverProof {
  const device =
    REGISTERED_PHYSICAL_DEVICES.find((d) => d.deviceId === targetDeviceId) ||
    REGISTERED_PHYSICAL_DEVICES[0];

  const timestamp = Date.now();
  const rawTelemetry = `${device.deviceId}:${orderId}:${device.currentCoordinates.lat},${device.currentCoordinates.lng}:${device.lastSensorReading.nfcHandshakeNonce}:${timestamp}`;
  const hardwareTelemetryHash = keccak256(stringToBytes(rawTelemetry));

  const auditLogs = [
    `[Physical AI Beacon] Contacting hardware enclave (${device.hardwareEnclave}) on ${device.name}...`,
    `[Proximity] BLE RSSI: ${device.lastSensorReading.bleRssiDb} dB (Proximity: ~0.8m confirmed)`,
    `[NFC Handshake] Mutual authenticated nonce: ${device.lastSensorReading.nfcHandshakeNonce}`,
    `[Anti-Tamper] Temperature: ${device.lastSensorReading.temperatureCelsius}°C, Accelerometer: Verified stable`,
    `[Cryptographic Telemetry] Produced atomic handover proof: ${hardwareTelemetryHash.slice(0, 16)}...`,
  ];

  return {
    deviceId: device.deviceId,
    deviceType: device.deviceType,
    orderId,
    hardwareTelemetryHash,
    cryptographicSignature: `0xee89...${device.deviceId.slice(-4)}...77a1`,
    proximityDistanceMeters: 0.8,
    verifiedAt: timestamp,
    locationConfirmed: device.currentCoordinates.city,
    tamperSealIntact: true,
    auditLogs,
  };
}


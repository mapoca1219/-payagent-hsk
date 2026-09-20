import type { UserCredential, VerificationResult, CommercialPrivacyZKProof } from "../agent/privacyVerifier.ts";
import type { PhysicalHandoverProof } from "../agent/physicalAiDevice.ts";
import type { ComplianceAuditResult, KybStatus } from "../agent/complianceEngine.ts";

export type OrderStatus = "ESCROWED" | "VERIFYING_CREDENTIAL" | "RELEASED_ON_HSK" | "REFUNDED";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceHSK: number;
  emoji: string;
  category: "food" | "drink" | "dessert";
  rwaBatchId?: number; // Linked RWA inventory batch
}

export interface RwaInventoryBatch {
  assetId: number;
  name: string;
  assetType: "SpecialtyCoffeeMicroLot" | "ArtisanInventoryBatch" | "CommercialReceivable";
  valuationHSK: number;
  batchQuantity: number;
  originLocation: string;
  batchHash: `0x${string}`;
  status: "ACTIVE" | "LOCKED_DVP" | "SETTLED";
}

export interface Merchant {
  id: string;
  name: string;
  tagline: string;
  category: string;
  address: `0x${string}`;
  balanceHSK: number;
  location: string;
  avatarEmoji: string;
  kybStatus: KybStatus;
  amlRiskRating: "LOW" | "MODERATE" | "HIGH";
  rwaBatches: RwaInventoryBatch[];
  menu: MenuItem[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPriceHSK: number;
}

export interface OrderRecord {
  id: string;
  orderHash: `0x${string}`;
  merchantId: string;
  merchantName: string;
  merchantAddress: `0x${string}`;
  customerAddress: `0x${string}`;
  items: OrderItem[];
  totalHSK: number;
  status: OrderStatus;
  credential: UserCredential;
  verificationResult?: VerificationResult;
  complianceAudit?: ComplianceAuditResult;
  commercialPrivacyProof?: CommercialPrivacyZKProof;
  physicalTelemetryProof?: PhysicalHandoverProof;
  rwaAssetId?: number;
  dvpSettled?: boolean;
  txHash?: `0x${string}`;
  blockNumber?: number;
  gasUsed?: string;
  createdAt: number;
  completedAt?: number;
  logs: string[];
  notes?: string;
}

export interface SessionKeyInfo {
  address: `0x${string}`;
  balanceHSK: string;
  dailyAllowanceRemainingHSK: number;
  sessionExpiryMinutes: number;
  accountAbstractionEnabled: boolean;
  paymasterSponsor: boolean;
}

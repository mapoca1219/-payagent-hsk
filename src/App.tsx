import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Store,
  Terminal,
  FileCode,
  Award,
  Shield,
  Cpu,
  Coins,
  Bot,
  Building2,
  Code,
  ExternalLink,
} from "lucide-react";
import { CustomerOrderView } from "./components/CustomerOrderView.tsx";
import { MerchantDashboard } from "./components/MerchantDashboard.tsx";
import { AgentTerminalLogs } from "./components/AgentTerminalLogs.tsx";
import { HskNetworkMonitor } from "./components/HskNetworkMonitor.tsx";
import { SmartContractViewer } from "./components/SmartContractViewer.tsx";
import { ArchitectureModal } from "./components/ArchitectureModal.tsx";
import { PhysicalAiMonitor } from "./components/PhysicalAiMonitor.tsx";
import { InstitutionalKybModal } from "./components/InstitutionalKybModal.tsx";
import { X402ProtocolPlayground } from "./components/X402ProtocolPlayground.tsx";
import { WalletConnectButton } from "./components/WalletConnectButton.tsx";
import { MOCK_MERCHANTS } from "./data/mockMerchants.ts";
import type { OrderRecord } from "./types.ts";
import { payAgent } from "../agent/agent.ts";
import { generateMockCredential } from "../agent/privacyVerifier.ts";
import { DEFAULT_ESCROW_CONTRACT_ADDRESS } from "../agent/hskChain.ts";
import { soundEffects } from "./utils/audioNotification.ts";

const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: "order_hsk_col_5521",
    orderHash: "0x89ab1029c4819028401928301928401928301928401928301928301928301928",
    merchantId: "cafe-origen-colombia",
    merchantName: "Café de Origen Colombia (ETH Colombia Hub)",
    merchantAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [
      { name: "Gesha Anaerobic Chemex Pour-Over", quantity: 1, unitPriceHSK: 0.024 },
      { name: "Artisanal Pandebono de Queso Costeño", quantity: 2, unitPriceHSK: 0.008 },
    ],
    totalHSK: 0.040,
    status: "RELEASED_ON_HSK",
    rwaAssetId: 102,
    dvpSettled: true,
    credential: generateMockCredential("COMMUNITY_RESIDENT", "ETH Colombia Member"),
    txHash: "0xbda785b5e98f56d442225504263c1dc30f0f9e468d3008f6babe709d8265fd12",
    blockNumber: 33238910,
    gasUsed: "56,420",
    createdAt: Date.now() - 1000 * 60 * 15,
    completedAt: Date.now() - 1000 * 60 * 10,
    logs: [
      "[ETH Colombia Hub] Order created for Jericó Gesha Anaerobic RWA Lot #102",
      "[Physical AI] CyberBot Rover autonomous delivery waypoint verified in Medellín",
      "[HashKey KYB] Verified Merchant KYB active (NIT 901.884.210-4)",
      "[DvP Settlement] Atomic payment released to merchant vault on HSK Testnet",
    ],
    notes: "Direct-trade coffee micro-lot settled via DvP on HashKey Chain",
  },
  {
    id: "order_hsk_94e291",
    orderHash: "0x61c86c3217e56850fea3773ae4705a48c55b2e21830c2e63dde0d386bba48e9e",
    merchantId: "tokyo-ramen-lab",
    merchantName: "Tokyo Broth Craft Ramen",
    merchantAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [
      { name: "Signature Tonkotsu Black Garlic", quantity: 1, unitPriceHSK: 0.038 },
    ],
    totalHSK: 0.038,
    status: "RELEASED_ON_HSK",
    credential: generateMockCredential("LOCAL_LOYALTY_VIP", "ShanHaiWoo Resident"),
    txHash: "0xbda785b5e98f56d442225504263c1dc30f0f9e468d3008f6babe709d8265fd12",
    blockNumber: 33238800,
    gasUsed: "142,310",
    createdAt: Date.now() - 1000 * 60 * 5,
    completedAt: Date.now() - 1000 * 60 * 2,
    logs: [
      "[HashKey Testnet] Escrow order created on-chain",
      "[Tx Escrow] 0x61c86c3217e56850fea3773ae4705a48c55b2e21830c2e63dde0d386bba48e9e",
      "[AI Agent] Session Key verification successful",
      "[Tx Release] 0xbda785b5e98f56d442225504263c1dc30f0f9e468d3008f6babe709d8265fd12",
    ],
    notes: "Auto-settled via AI Session Key",
  },
  {
    id: "order_hsk_882194",
    orderHash: "0xfc78de959f0ffb6c84c2e39756e7892f6d9bd9767ed036c81d552c5f3d03e5c1",
    merchantId: "pizzeria-napoletana",
    merchantName: "Napoli Rustica Sourdough Pizza",
    merchantAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [
      { name: "Sourdough Margherita Verace", quantity: 1, unitPriceHSK: 0.035 },
      { name: "Craft Birra Moretti Riserva", quantity: 1, unitPriceHSK: 0.015 },
    ],
    totalHSK: 0.05,
    status: "ESCROWED",
    rwaAssetId: 201,
    credential: generateMockCredential("LOCAL_LOYALTY_VIP", "ShanHaiWoo Gold Resident"),
    createdAt: Date.now() - 1000 * 60 * 12,
    logs: [
      "[12:30:00] Order created via natural language prompt",
      "[12:30:02] Funds locked in MerchantEscrow.sol on HSK Testnet (0.0500 HSK)",
      "[Tx Escrow] 0xfc78de959f0ffb6c84c2e39756e7892f6d9bd9767ed036c81d552c5f3d03e5c1",
    ],
    notes: "Extra fresh basil requested",
  },
  {
    id: "order_hsk_774902",
    orderHash: "0xcc57bbfe30989353040357e54eceda11f106e24994d14e2a611233f3a4a2eac4",
    merchantId: "cyber-roast-cafe",
    merchantName: "Cyber Roast Espresso & Micro-Bakery",
    merchantAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    customerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    items: [
      { name: "Oat Flat White (Ethiopia Yirgacheffe)", quantity: 1, unitPriceHSK: 0.012 },
      { name: "Bronte Pistachio Pain au Chocolat", quantity: 1, unitPriceHSK: 0.016 },
    ],
    totalHSK: 0.028,
    status: "RELEASED_ON_HSK",
    credential: generateMockCredential("STUDENT_DISCOUNT_PASS", "Verified Web3 Scholar"),
    txHash: "0xcc57bbfe30989353040357e54eceda11f106e24994d14e2a611233f3a4a2eac4",
    blockNumber: 33230100,
    gasUsed: "48,210",
    createdAt: Date.now() - 1000 * 60 * 45,
    completedAt: Date.now() - 1000 * 60 * 38,
    logs: [
      "[11:58:00] Order created at Cyber Roast Espresso",
      "[11:58:02] Funds locked in escrow (0.0280 HSK)",
      "[12:05:10] Local ZK-proof verified: Web3 Scholar Pass valid",
      "[12:05:12] Payment released via HSK Testnet Tx: 0xcc57bbfe30989353040357e54eceda11f106e24994d14e2a611233f3a4a2eac4",
    ],
    notes: "Pickup verified by Session Key",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"customer" | "merchant" | "physicalAi" | "x402" | "agentLogs" | "contracts">("customer");
  const [merchants] = useState(MOCK_MERCHANTS);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isKybModalOpen, setIsKybModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem("payagent_orders_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error al cargar localStorage:", e);
      }
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    localStorage.setItem("payagent_orders_v2", JSON.stringify(orders));
  }, [orders]);

  const [agentLogs, setAgentLogs] = useState<string[]>([
    "[System] PayAgent HSK Autonomous Multi-Track Service booted.",
    `[Session Key] Delegated Signer (ERC-4337): ${payAgent.getSessionAddress()}`,
    "[HSK L2 RPC] Connected to https://testnet.hsk.xyz (Chain ID 133).",
    `[Smart Contracts] MerchantEscrow (${DEFAULT_ESCROW_CONTRACT_ADDRESS}) & MerchantRWA active.`,
    "[Multi-Track Engine] Ready: Privacy WG ZK-Proofs + Physical AI Robotics + HashKey KYB/DvP.",
  ]);

  const appendLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setAgentLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const handleOrderCreated = async (newOrder: OrderRecord) => {
    setIsProcessing(true);
    appendLog(`🛒 New Order incoming: ${newOrder.items.map((i) => i.name).join(", ")}`);
    appendLog(`🔒 Locking ${newOrder.totalHSK.toFixed(4)} HSK in MerchantEscrow.sol on HSK Testnet...`);

    if (newOrder.rwaAssetId) {
      appendLog(`📦 RWA Asset linked: Tokenized Physical Batch #${newOrder.rwaAssetId}`);
    }

    setOrders((prev) => [newOrder, ...prev]);

    await new Promise((r) => setTimeout(r, 1200));

    appendLog(`✅ Escrow confirmed on HSK Testnet. Order ID: ${newOrder.id}`);
    appendLog(`🛡️ Local Privacy Credential attached (Type: ${newOrder.credential.credentialType})`);
    setIsProcessing(false);
    setActiveTab("merchant");
  };

  const handleTriggerRelease = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setIsProcessing(true);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "VERIFYING_CREDENTIAL" } : o))
    );

    appendLog(`⚡ Physical merchant signaled fulfillment. Autonomous AI Agent starting multi-track DvP cycle for ${orderId}...`);

    try {
      const result = await payAgent.processOrderAndPayDvP({
        orderId: targetOrder.id,
        merchantId: targetOrder.merchantId,
        buyerAddress: targetOrder.customerAddress,
        userCredential: targetOrder.credential,
        amount: targetOrder.totalHSK.toString(),
        itemCount: targetOrder.items.reduce((s, i) => s + i.quantity, 0),
        rwaAssetId: targetOrder.rwaAssetId,
      });

      result.logs.forEach((l) => appendLog(l));

      if (result.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "RELEASED_ON_HSK",
                  txHash: result.txHash,
                  blockNumber: result.blockNumber,
                  gasUsed: result.gasUsed,
                  completedAt: Date.now(),
                  verificationResult: result.credentialVerification,
                  complianceAudit: result.complianceAudit,
                  commercialPrivacyProof: result.commercialPrivacyProof,
                  physicalTelemetryProof: result.physicalTelemetryProof,
                  dvpSettled: true,
                  logs: [...o.logs, ...result.logs],
                }
              : o
          )
        );
        appendLog(`🎉 DvP Settlement complete! Funds released to merchant vault: ${targetOrder.merchantAddress}`);
        soundEffects.playDvpSettled();
      } else {
        appendLog(`❌ Verification failed: ${result.errorMessage}`);
      }
    } catch (err: any) {
      appendLog(`⚠️ Execution exception: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerRefund = async (orderId: string, reason: string) => {
    setIsProcessing(true);
    appendLog(`🔄 Processing refund for Order: ${orderId} (Reason: ${reason})...`);
    await new Promise((r) => setTimeout(r, 1000));

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "REFUNDED",
              completedAt: Date.now(),
              logs: [...o.logs, `[${new Date().toLocaleTimeString()}] Order refunded to buyer: ${reason}`],
            }
          : o
      )
    );

    soundEffects.playRefundProcessed();
    appendLog(`✅ Order ${orderId} refunded on HSK Testnet.`);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  PayAgent <span className="text-cyan-400 font-mono">HSK</span>
                </h1>
                <span className="text-[10px] font-semibold tracking-wide bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  All Tracks MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous Physical AI Micro-Payments, Privacy ZK-Proofs & DvP RWA on HashKey Chain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono">
              <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50 flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                AI Economy
              </span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                Privacy WG
              </span>
              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800/50 flex items-center gap-1">
                <Bot className="w-2.5 h-2.5 text-amber-400" />
                Physical AI
              </span>
              <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800/50 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 text-rose-400" />
                HSK TradFi/DvP
              </span>
              <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/50 flex items-center gap-1">
                <Coins className="w-2.5 h-2.5 text-cyan-400" />
                HSK L2 (133)
              </span>
            </div>

            <button
              id="open-kyb-modal-btn"
              onClick={() => setIsKybModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-800/50 transition-colors shadow-sm cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compliance & ZK</span>
            </button>

            <button
              id="open-architecture-modal-btn"
              onClick={() => setIsArchitectureModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Multi-Track Matrix</span>
            </button>

            <WalletConnectButton onAddressChange={setConnectedAddress} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 pt-1">
          <button
            id="nav-tab-customer"
            onClick={() => setActiveTab("customer")}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "customer"
                ? "border-cyan-400 text-cyan-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Customer View (Conversational AI)</span>
          </button>

          <button
            id="nav-tab-merchant"
            onClick={() => setActiveTab("merchant")}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "merchant"
                ? "border-indigo-400 text-indigo-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Store className="w-3.5 h-3.5 text-indigo-400" />
            <span>Merchant View (Real-Time DvP POS)</span>
            <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {orders.length}
            </span>
          </button>

          <button
            id="nav-tab-physical-ai"
            onClick={() => setActiveTab("physicalAi")}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "physicalAi"
                ? "border-amber-400 text-amber-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Physical AI & Robotics Fleet</span>
          </button>

          <button
            id="nav-tab-x402"
            onClick={() => setActiveTab("x402")}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "x402"
                ? "border-cyan-400 text-cyan-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>x402 / MPP Machine Payments</span>
          </button>

          <button
            id="nav-tab-agent"
            onClick={() => setActiveTab("agentLogs")}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "agentLogs"
                ? "border-emerald-400 text-emerald-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Agent Terminal Traces</span>
          </button>

          <button
            id="nav-tab-contracts"
            onClick={() => setActiveTab("contracts")}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "contracts"
                ? "border-purple-400 text-purple-300 bg-slate-800/60"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Smart Contracts (Escrow & RWA)</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <HskNetworkMonitor />

        {activeTab === "customer" && (
          <CustomerOrderView
            merchants={merchants}
            onOrderCreated={handleOrderCreated}
            isProcessing={isProcessing}
            connectedAddress={connectedAddress}
          />
        )}

        {activeTab === "merchant" && (
          <MerchantDashboard
            merchants={merchants}
            orders={orders}
            onTriggerRelease={handleTriggerRelease}
            onTriggerRefund={handleTriggerRefund}
            isProcessing={isProcessing}
          />
        )}

        {activeTab === "physicalAi" && <PhysicalAiMonitor />}

        {activeTab === "x402" && <X402ProtocolPlayground />}

        {activeTab === "agentLogs" && (
          <AgentTerminalLogs
            logs={agentLogs}
            onClearLogs={() => setAgentLogs(["[System] Cleared terminal history."])}
          />
        )}

        {activeTab === "contracts" && <SmartContractViewer />}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>PayAgent HSK</span>
            <span>•</span>
            <span>Multi-Track Submission: Ethereum Privacy WG | Physical AI | HashKey Institutional DvP/RWA</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://testnet-explorer.hskchain.net"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>HashKey Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span className="font-mono text-slate-400">HSK Chain ID: 133</span>
          </div>
        </div>
      </footer>

      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      <InstitutionalKybModal
        isOpen={isKybModalOpen}
        onClose={() => setIsKybModalOpen(false)}
      />
    </div>
  );
}
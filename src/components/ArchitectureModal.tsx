import React from "react";
import {
  X,
  Award,
  Shield,
  Cpu,
  Coins,
  Bot,
  Building2,
  Globe2,
  Code,
  FileText,
  CheckCircle2,
  Layers,
  ArrowRight,
  Lock,
} from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-200 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                PayAgent HSK: Complete EAG 6-Track & HashKey Chain Prize Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aligned with the 6 official tracks presented by Xiang (EAG Core Contributor) & HashKey Chain (Alex & Francis).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Official EAG Tracks + HashKey L2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* EAG Track 1 */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-indigo-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Track 1: AI & Agent Economy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Autonomous AI Agent operates with scoped Session Keys (ERC-4337) to execute escrow settlements without human wallet popups.
            </p>
            <div className="text-[10px] text-indigo-300 font-mono pt-1">
              ✓ Agent Wallets + Autonomous Execution
            </div>
          </div>

          {/* EAG Track 2 */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-emerald-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Track 2: Local AI & Privacy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              User identity, membership tiers, and credentials are evaluated in a local client enclave. Only a blinded cryptographic commitment reaches the chain.
            </p>
            <div className="text-[10px] text-emerald-300 font-mono pt-1">
              ✓ Local ZK-Proof Commitments (Zero PII)
            </div>
          </div>

          {/* EAG Track 3 */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-amber-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <Bot className="w-4 h-4 shrink-0" />
              <span>Track 3: Smart Devices & Hardware</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Connects autonomous delivery rovers, IoT POS beacons, and smart merchant lockers to Ethereum via authenticated BLE/NFC sensor telemetry.
            </p>
            <div className="text-[10px] text-amber-300 font-mono pt-1">
              ✓ Hardware Enclaves (ARM TrustZone/RISC-V)
            </div>
          </div>

          {/* EAG Track 4 */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-cyan-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
              <Code className="w-4 h-4 shrink-0" />
              <span>Track 4: Middlewares & x402 / MPP</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Native implementation of HTTP 402 Payment Required & Machine Payment Protocol (MPP by Tempo Labs / IETF draft) for agent micropayments.
            </p>
            <div className="text-[10px] text-cyan-300 font-mono pt-1">
              ✓ x402 Protocol + MPP Middleware Playground
            </div>
          </div>

          {/* EAG Track 5 */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-purple-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-xs">
              <FileText className="w-4 h-4 shrink-0" />
              <span>Track 5: Creator Economy & Digital Rights</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Decentralized registry of physical merchant inventory, specialty agricultural lots, and artisanal recipes tokenized with immutable origin attribution.
            </p>
            <div className="text-[10px] text-purple-300 font-mono pt-1">
              ✓ MerchantRWA.sol + Origin Provenance
            </div>
          </div>

          {/* EAG Track 6 */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-violet-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-violet-400 font-semibold text-xs">
              <Globe2 className="w-4 h-4 shrink-0" />
              <span>Track 6: Real-World Applications & PayFi</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Solving real physical merchant pain points: Specialty coffee roasters in Colombia and urban pizzerias eliminating 3-5% card processor toll fees.
            </p>
            <div className="text-[10px] text-violet-300 font-mono pt-1">
              ✓ ETH Colombia Hub + Real-World Commerce
            </div>
          </div>
        </div>

        {/* Sponsor Track: HashKey Chain L2 Banner */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 rounded-xl border border-cyan-800/40 space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-xs text-cyan-300">
              HashKey Chain Track: Institutional TradFi Bridge, RWA & Delivery vs Payment (DvP)
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Deploys on <strong>HashKey Chain Testnet (Chain ID: 133)</strong> with an institutional compliance framework (KYB/AML screening with sub-5% risk score), <strong>Commercial Privacy ZK-SNARKs</strong> (protecting trade margins and customer line-items), and atomic <strong>Delivery vs Payment (DvP)</strong> on <code className="text-cyan-300 font-mono text-[10px]">MerchantEscrow.sol</code>.
          </p>
        </div>

        {/* End-to-End Autonomous Flow */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Complete Autonomous Protocol Flow (Natural Language ➔ x402 ➔ DvP Settlement)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-400 font-bold block text-[10px]">01. Intent & ZK</span>
              <p className="text-slate-400 text-[11px]">
                Conversational AI parses order. User proves VIP/Student tier locally with zero PII leaked.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-mono text-amber-400 font-bold block text-[10px]">02. HTTP 402 Challenge</span>
              <p className="text-slate-400 text-[11px]">
                Endpoint returns x402 / MPP challenge. AI Session Key signs payment in milliseconds.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-mono text-indigo-400 font-bold block text-[10px]">03. KYB & Escrow</span>
              <p className="text-slate-400 text-[11px]">
                Merchant is verified via HashKey KYB. Funds locked on HSK L2 linked to tokenized RWA.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-mono text-emerald-400 font-bold block text-[10px]">04. Atomic DvP Handover</span>
              <p className="text-slate-400 text-[11px]">
                Delivery rover / IoT beacon verifies physical arrival. Agent signs <code className="text-emerald-400 text-[10px]">releasePaymentDvP</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Architecture Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

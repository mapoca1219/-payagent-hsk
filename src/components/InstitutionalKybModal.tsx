import React from "react";
import { X, Building2, ShieldCheck, Lock, Award, FileText, CheckCircle2, AlertTriangle, Coins } from "lucide-react";
import { VERIFIED_MERCHANT_KYB } from "../../agent/complianceEngine.ts";
import { MOCK_MERCHANTS } from "../data/mockMerchants.ts";

interface InstitutionalKybModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstitutionalKybModal: React.FC<InstitutionalKybModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 text-slate-200 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                HashKey Institutional Compliance & Commercial Privacy ZK Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Built for HashKey Chain Institutional Track & TradFi ↔ Web3 Compliant Bridge
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Pillars Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-cyan-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>1. Institutional KYB & AML</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every merchant has an auditable Know-Your-Business profile with tax hashes, OFAC watchlist clearing, and sub-5% AML risk score.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-indigo-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
              <Lock className="w-4 h-4" />
              <span>2. Commercial Privacy ZK-SNARK</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Protects institutional trade secrets: Wholesale margins & item baskets remain encrypted while solvency is proven on-chain.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-emerald-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Coins className="w-4 h-4" />
              <span>3. RWA Tokenization & DvP</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Specialty physical inventory (Colombian coffee micro-lots, artisan batches) tokenized as RWAs and settled via Delivery vs Payment.
            </p>
          </div>
        </div>

        {/* Verified Merchant Profiles Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verified Merchant KYB & AML Registry (HashKey L2 Compliant Engine)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Regulatory Grade KYC/KYB
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(VERIFIED_MERCHANT_KYB).map(([id, kyb]) => {
              const merchant = MOCK_MERCHANTS.find((m) => m.id === id);
              return (
                <div key={id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{merchant?.avatarEmoji || "🏪"}</span>
                        <h4 className="text-xs font-bold text-slate-200">{kyb.legalEntityName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{kyb.jurisdiction}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      KYB Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800/70 pt-2 font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Reg. Number</span>
                      <span className="text-slate-300">{kyb.businessRegistrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">AML Score</span>
                      <span className="text-emerald-400 font-bold">{kyb.amlRiskScore} / 100 (Clean)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Tax ID Hash</span>
                      <span className="text-slate-400">{kyb.taxIdentificationHash.slice(0, 14)}...</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Sanctions OFAC/UN</span>
                      <span className="text-emerald-400">PASSED</span>
                    </div>
                  </div>

                  {merchant && merchant.rwaBatches.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Active RWA Inventory:</span>
                      <span className="text-amber-400 font-semibold font-mono">
                        {merchant.rwaBatches.length} Verified Batch(es)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Commercial Privacy ZK Diagram / Proof Mechanism */}
        <div className="p-4 bg-slate-950 rounded-xl border border-indigo-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Zero-Knowledge Commercial Confidentiality Architecture</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            In compliance with HashKey Chain’s institutional mandate, institutional merchants and funds cannot expose trade margins, supply partner prices, or customer purchase itemization to the public mempool. PayAgent generates a cryptographic <code className="text-indigo-300 font-mono text-[10px]">Groth16 ZK-SNARK</code> proof affirming that solvency, tax withholding, and AML thresholds are met without revealing raw commercial data.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            Close Compliance Inspector
          </button>
        </div>
      </div>
    </div>
  );
};


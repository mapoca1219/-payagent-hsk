import React, { useState } from "react";
import {
  Store,
  DollarSign,
  Clock,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
  Zap,
  Filter,
  ArrowUpRight,
  Bot,
  Building2,
  Lock,
  Coins,
} from "lucide-react";
import type { Merchant, OrderRecord } from "../types.ts";
import { HSK_EXPLORER_URL } from "../../agent/hskChain.ts";

interface MerchantDashboardProps {
  merchants: Merchant[];
  orders: OrderRecord[];
  onTriggerRelease: (orderId: string) => void;
  onTriggerRefund: (orderId: string, reason: string) => void;
  isProcessing: boolean;
}

const TESTNET_EXPLORER_FALLBACK = "https://testnet-explorer.hskchain.net";

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  merchants,
  orders,
  onTriggerRelease,
  onTriggerRefund,
  isProcessing,
}) => {
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const explorerBaseUrl = HSK_EXPLORER_URL || TESTNET_EXPLORER_FALLBACK;

  const filteredOrders = orders.filter((o) => {
    if (selectedMerchantFilter !== "ALL" && o.merchantId !== selectedMerchantFilter) return false;
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    return true;
  });

  const totalSettledHSK = orders
    .filter((o) => o.status === "RELEASED_ON_HSK")
    .reduce((sum, o) => sum + o.totalHSK, 0);

  const totalInEscrowHSK = orders
    .filter((o) => o.status === "ESCROWED" || o.status === "VERIFYING_CREDENTIAL")
    .reduce((sum, o) => sum + o.totalHSK, 0);

  const totalOrdersCount = orders.length;

  return (
    <div id="merchant-dashboard" className="space-y-6">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Settled DvP Payments (HSK)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {totalSettledHSK.toFixed(4)} HSK
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Directly paid to merchant on-chain vaults</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Locked in Escrow (DvP Pending)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {totalInEscrowHSK.toFixed(4)} HSK
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Held securely in MerchantEscrow.sol</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Orders & RWA Batches</span>
            <Store className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {totalOrdersCount} Orders
          </div>
          <p className="text-[11px] text-slate-500 mt-1">HashKey Institutional KYB & DvP Active</p>
        </div>
      </div>

      {/* Filter and Controls Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter By Merchant:</span>
          <select
            id="merchant-select-filter"
            value={selectedMerchantFilter}
            onChange={(e) => setSelectedMerchantFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Merchants ({merchants.length})</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">Status:</span>
          {["ALL", "ESCROWED", "RELEASED_ON_HSK", "REFUNDED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "ALL" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Live Order Feed (Multi-Track DvP & Escrow Arbiter)</span>
          <span>Showing {filteredOrders.length} order(s)</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Store className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No orders match the selected filters.</p>
            <p className="text-xs text-slate-600 mt-1">
              Switch to Customer View to place an artisan sourdough, ramen or specialty Colombian coffee order!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredOrders.map((order) => {
              const isEscrowed = order.status === "ESCROWED";
              const isVerifying = order.status === "VERIFYING_CREDENTIAL";
              const isReleased = order.status === "RELEASED_ON_HSK";
              const isRefunded = order.status === "REFUNDED";

              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id}`}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{order.merchantName}</span>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {order.id}
                        </span>
                        {order.rwaAssetId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            RWA Batch #{order.rwaAssetId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Merchant Vault: {order.merchantAddress.slice(0, 8)}...{order.merchantAddress.slice(-6)}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isEscrowed && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50">
                          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>Locked in Escrow (HSK DvP)</span>
                        </span>
                      )}
                      {isVerifying && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-spin" />
                          {' '}AI Verifying Proofs & Telemetry
                        </span>
                      )}
                      {isReleased && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          DvP Released on HSK
                        </span>
                      )}
                      {isRefunded && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/50">
                          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                          Refunded to Buyer
                        </span>
                      )}

                      <span className="text-sm font-bold font-mono text-emerald-400 ml-1">
                        {order.totalHSK.toFixed(4)} HSK
                      </span>
                    </div>
                  </div>

                  {/* Multi-Track Verification Badges & Proofs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
                    {/* Column 1: Order Items */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Physical Items</span>
                      <div className="space-y-1">
                        {order.items.map((it) => (
                          <div key={`${order.id}-${it.name}`} className="flex justify-between text-slate-300 text-[11px]">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-mono text-slate-400">
                              {(it.unitPriceHSK * it.quantity).toFixed(4)} HSK
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Privacy Credential */}
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-indigo-300 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          Privacy Credential
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">ZK Passed</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Tier: <strong className="text-indigo-200 font-medium">{order.credential.claims.tier}</strong>
                      </p>
                      <p className="text-slate-500 font-mono text-[10px] truncate" title={order.credential.subjectCommitment}>
                        {`Commitment: ${order.credential.subjectCommitment.slice(0, 16)}...`}
                      </p>
                    </div>

                    {/* Column 3: Physical AI / Compliance Audit */}
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/60 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-cyan-300 font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          HashKey KYB / AML
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">Clean Pass</span>
                      </div>
                      {order.physicalTelemetryProof ? (
                        <div className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Bot className="w-3 h-3 text-amber-400" />
                          <span className="truncate">Device: {order.physicalTelemetryProof.deviceId}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">
                          Physical IoT Beacon Ready for DvP Handover
                        </div>
                      )}
                      <p className="text-emerald-400 text-[10px] font-mono">
                        Commercial ZK-SNARK: Solvency Proven
                      </p>
                    </div>
                  </div>

                  {/* On-Chain Receipt / Proof if released */}
                  {order.txHash && (
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-300 font-mono text-[11px]">
                          HSK DvP Tx: {order.txHash.slice(0, 10)}...{order.txHash.slice(-8)}
                        </span>
                        {Boolean(order.blockNumber) && (
                          <span className="text-slate-400 text-[11px]">{`Block #${order.blockNumber}`}</span>
                        )}
                        {order.dvpSettled && (
                          <span className="text-cyan-300 text-[10px] font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                            DvP Atomic Handover Confirmed
                          </span>
                        )}
                      </div>

                      <a
                        href={`${explorerBaseUrl}/tx/${order.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-medium"
                      >
                        <span>View on HSK Explorer</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Created: {new Date(order.createdAt).toLocaleTimeString()}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEscrowed && (
                        <>
                          <button
                            id={`refund-btn-${order.id}`}
                            onClick={() => onTriggerRefund(order.id, "Merchant cancelled order")}
                            disabled={isProcessing}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          >
                            Refund Buyer
                          </button>
                          <button
                            id={`release-btn-${order.id}`}
                            onClick={() => onTriggerRelease(order.id)}
                            disabled={isProcessing}
                            className="text-xs px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verify Physical Handover & Release DvP Payment</span>
                          </button>
                        </>
                      )}
                      {isReleased && (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          DvP Settled & Transferred to Merchant Vault
                        </span>
                      )}
                      {isRefunded && (
                        <span className="text-xs text-rose-400 font-medium">
                          Order refunded to buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

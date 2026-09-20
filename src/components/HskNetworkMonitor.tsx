import React, { useEffect, useState } from "react";
import { Activity, ShieldCheck, Zap, ExternalLink, RefreshCw, Cpu } from "lucide-react";
import { payAgent } from "../../agent/agent.ts";
import { HSK_EXPLORER_URL, HSK_CHAIN_ID, DEFAULT_ESCROW_CONTRACT_ADDRESS } from "../../agent/hskChain.ts";

const TESTNET_EXPLORER_FALLBACK = "https://testnet-explorer.hskchain.net";

export const HskNetworkMonitor: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    connected: boolean;
    chain: string;
    blockNumber: number;
    gasPriceGwei: string;
    sessionAgentBalanceHSK: string;
    rpcUrl: string;
  }>({
    connected: true,
    chain: "HashKey Chain Testnet (133)",
    blockNumber: 4892110,
    gasPriceGwei: "1.00",
    sessionAgentBalanceHSK: "0.25",
    rpcUrl: "https://testnet.hsk.xyz",
  });

  const [loading, setLoading] = useState(false);
  const sessionAddress = payAgent.getSessionAddress();
  const explorerBaseUrl = HSK_EXPLORER_URL || TESTNET_EXPLORER_FALLBACK;

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const status = await payAgent.getNetworkStatus();
      setNetworkInfo(status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="hsk-network-monitor-card" className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${networkInfo.connected ? "bg-emerald-400 opacity-75" : "bg-amber-400 opacity-75"}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${networkInfo.connected ? "bg-emerald-500" : "bg-amber-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-100">HashKey Chain (HSK) Testnet</span>
              <span className="bg-emerald-950 text-emerald-300 text-[11px] px-1.5 py-0.5 rounded font-mono border border-emerald-800/50">
                {`Chain ID: ${HSK_CHAIN_ID}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate max-w-xs md:max-w-md">
              {networkInfo.rpcUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-hsk-status-btn"
            onClick={fetchStatus}
            disabled={loading}
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh RPC Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync RPC</span>
          </button>
          <a
            id="open-hsk-explorer-link"
            href={`${explorerBaseUrl}/address/${DEFAULT_ESCROW_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/40 transition-colors"
          >
            <span>Contract Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Block Height</span>
          </div>
          <div className="text-base font-mono font-semibold text-slate-100 mt-0.5">
            {`#${networkInfo.blockNumber.toLocaleString()}`}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Base Gas Price</span>
          </div>
          <div className="text-base font-mono font-semibold text-amber-300 mt-0.5">
            {`${networkInfo.gasPriceGwei} Gwei`}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>Agent Session Key</span>
          </div>
          <div className="text-xs font-mono font-medium text-slate-300 mt-1 truncate" title={sessionAddress}>
            {`${sessionAddress.slice(0, 6)}...${sessionAddress.slice(-4)}`}
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Paymaster Sponsor</span>
          </div>
          <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>ERC-4337 Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

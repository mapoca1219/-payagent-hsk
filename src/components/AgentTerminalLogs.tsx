import React, { useState } from "react";
import { Terminal, Shield, CheckCircle2, Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { HSK_EXPLORER_URL } from "../../agent/hskChain.ts";

interface AgentTerminalLogsProps {
  logs: string[];
  onClearLogs?: () => void;
}

export const AgentTerminalLogs: React.FC<AgentTerminalLogsProps> = ({ logs, onClearLogs }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="agent-terminal-logs" className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs shadow-inner">
      {/* Terminal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="font-semibold text-slate-200 ml-1 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            AI Agent Runtime Traces (Local Privacy Engine & HSK L2 Execution)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Live Agent Session: Active</span>
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear Terminal Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Output Body */}
      <div className="mt-3 max-h-72 overflow-y-auto space-y-1.5 pr-1 text-slate-300 select-text">
        {logs.length === 0 ? (
          <div className="text-slate-600 py-6 text-center italic">
            AI Agent listening for escrow orders and local privacy proofs...
          </div>
        ) : (
          logs.map((log, idx) => {
            const isSuccess = log.includes("✅") || log.includes("🎉") || log.includes("💎");
            const isWarning = log.includes("⚠️") || log.includes("ℹ️");
            const isError = log.includes("❌") || log.includes("Error");
            const isHighlight = log.includes("⚡") || log.includes("🛡️") || log.includes("⛓️");

            return (
              <div
                key={idx}
                className={`group flex items-start justify-between gap-2 p-1 rounded transition-colors hover:bg-slate-900/80 ${
                  isSuccess
                    ? "text-emerald-300"
                    : isError
                    ? "text-rose-400"
                    : isWarning
                    ? "text-amber-300"
                    : isHighlight
                    ? "text-cyan-300 font-semibold"
                    : "text-slate-300"
                }`}
              >
                <div className="break-all leading-relaxed flex-1">
                  {log}
                </div>

                <button
                  onClick={() => handleCopy(log, idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-opacity shrink-0"
                  title="Copy log line"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span>Local ZK-Commitments never expose raw credit cards or user PII to merchant</span>
        </div>
        <div className="text-slate-400">
          Target: <span className="font-mono text-cyan-400">HSK Chain ID 133</span>
        </div>
      </div>
    </div>
  );
};

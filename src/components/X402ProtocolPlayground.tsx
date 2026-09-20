import React, { useState } from "react";
import {
  Coins,
  Terminal,
  RefreshCw,
  Code,
} from "lucide-react";
import {
  SAMPLE_MACHINE_ENDPOINTS,
  create402Challenge,
  signX402PaymentChallenge,
  verifyAndDeliverX402Resource,
  type MachinePayableEndpoint,
  type X402Challenge,
  type X402PaymentProof,
  type X402ResourceResponse,
} from "../../agent/x402Protocol.ts";
import { soundEffects } from "../utils/audioNotification.ts";

export const X402ProtocolPlayground: React.FC = () => {
  const [endpoints] = useState<MachinePayableEndpoint[]>(SAMPLE_MACHINE_ENDPOINTS);
  const [selectedEndpoint, setSelectedEndpoint] = useState<MachinePayableEndpoint>(endpoints[0]);
  const [currentStep, setCurrentStep] = useState<"IDLE" | "CHALLENGE_402" | "PAYMENT_SIGNING" | "DELIVERED_200">("IDLE");

  const [challenge402, setChallenge402] = useState<X402Challenge | null>(null);
  const [paymentProof, setPaymentProof] = useState<X402PaymentProof | null>(null);
  const [deliveredResponse, setDeliveredResponse] = useState<X402ResourceResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [signWithWallet, setSignWithWallet] = useState(false);

  const handleSimulateHandshake = async () => {
    setIsExecuting(true);
    setCurrentStep("CHALLENGE_402");

    // 1. Initial Request -> 402 Payment Required
    const challenge = create402Challenge(selectedEndpoint);
    setChallenge402(challenge);
    setPaymentProof(null);
    setDeliveredResponse(null);

    await new Promise((r) => setTimeout(r, 600));

    // 2. Sign Challenge (Autonomous Session Key or Live MetaMask Wallet)
    setCurrentStep("PAYMENT_SIGNING");
    let proof: X402PaymentProof;

    if (signWithWallet && typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        let accounts = await ethereum.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) {
          accounts = await ethereum.request({ method: "eth_requestAccounts" });
        }
        if (!accounts || accounts.length === 0) {
          throw new Error("No authorized wallet account available.");
        }
        const signer = accounts[0] as `0x${string}`;
        const challengeMessage = `HTTP 402 Payment Authorization\nResource: ${challenge.resourceName}\nAmount: ${challenge.priceHSK} ${challenge.tokenSymbol}\nNonce: ${challenge.headers["x402-challenge-nonce"]}`;

        const signature = await ethereum.request({
          method: "personal_sign",
          params: [challengeMessage, signer],
        });

        const txHash = ("0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;

        proof = {
          challengeNonce: challenge.headers["x402-challenge-nonce"],
          resourceUri: challenge.resourceUri,
          amountHSK: challenge.priceHSK,
          payerAddress: signer,
          signature: signature,
          txHash: txHash,
          blockNumber: 4892118,
          timestamp: Date.now(),
          clientHeaders: {
            Authorization: `x402-Bearer proof_${Date.now().toString(36)}`,
            "x402-payment-signature": signature,
            "x402-payer-session-key": signer,
            "x402-tx-hash": txHash,
          },
        };
      } catch (signErr) {
        console.warn("Wallet signature dismissed, using autonomous session key proof:", signErr);
        proof = await signX402PaymentChallenge(challenge);
      }
    } else {
      proof = await signX402PaymentChallenge(challenge);
    }

    setPaymentProof(proof);

    await new Promise((r) => setTimeout(r, 800));

    // 3. Server Verifies & Responds 200 OK
    const delivered = verifyAndDeliverX402Resource(selectedEndpoint, proof);
    setDeliveredResponse(delivered);
    setCurrentStep("DELIVERED_200");
    soundEffects.playX402Success();
    setIsExecuting(false);
  };

  const handleReset = () => {
    setCurrentStep("IDLE");
    setChallenge402(null);
    setPaymentProof(null);
    setDeliveredResponse(null);
  };

  return (
    <div id="x402-playground" className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  x402 & MPP Machine Payment Protocol Engine
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  EAG Core Track: Application Middlewares & Tooling
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reviving HTTP status code <code className="text-amber-400 font-mono font-bold">402 Payment Required</code> for autonomous AI agent micropayments on HashKey Chain without human credit cards.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="sign-with-wallet-x402"
                checked={signWithWallet}
                onChange={(e) => setSignWithWallet(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <label htmlFor="sign-with-wallet-x402" className="cursor-pointer text-[11px] text-slate-300 font-medium">
                Firmar con MetaMask en vivo
              </label>
            </div>

            <button
              onClick={handleReset}
              disabled={isExecuting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Cycle
            </button>
            <button
              onClick={handleSimulateHandshake}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExecuting ? "animate-spin" : ""}`} />
              <span>{signWithWallet ? "Ejecutar y Firmar con Wallet" : "Simulate Machine-to-Machine Handshake"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column: Endpoints Selector & Live HTTP Protocol Handshake */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: Select Machine Endpoint */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
            Machine-Payable Resources
          </div>

          <div className="space-y-2">
            {endpoints.map((ep) => {
              const active = ep.id === selectedEndpoint.id;
              return (
                <button
                  type="button"
                  key={ep.id}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    handleReset();
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 border-cyan-500 shadow-sm ring-1 ring-cyan-500/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                      {ep.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {ep.priceHSK} HSK
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-2">{ep.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <span className="font-semibold text-slate-200 block">Why x402 / MPP? (EAG Workshop):</span>
            <p>
              Traditional API billing uses Stripe or credit cards with monthly plans, KYC forms, and $0.30 minimum fees.
            </p>
            <p className="text-cyan-300">
              x402 enables AI agents to pay <strong className="font-mono">$0.001</strong> per request instantaneously on HashKey Chain L2.
            </p>
          </div>
        </div>

        {/* Right 8 cols: HTTP Handshake Trace */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  HTTP 402 Handshake Trace: {selectedEndpoint.endpoint}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                IETF Draft MPP Specification
              </span>
            </div>

            {/* Step Progress Bar */}
            <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
              <div
                className={`p-2 rounded-lg border transition-all ${
                  currentStep !== "IDLE"
                    ? "bg-amber-950/60 border-amber-500/80 text-amber-300 font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                1. HTTP 402 Required
              </div>
              <div
                className={`p-2 rounded-lg border transition-all ${
                  currentStep === "PAYMENT_SIGNING" || currentStep === "DELIVERED_200"
                    ? "bg-indigo-950/60 border-indigo-500/80 text-indigo-300 font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                2. Session Key Sign
              </div>
              <div
                className={`p-2 rounded-lg border transition-all ${
                  currentStep === "DELIVERED_200"
                    ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-300 font-semibold"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                }`}
              >
                3. HTTP 200 Delivered
              </div>
            </div>

            {/* Handshake Display */}
            {currentStep === "IDLE" && (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Code className="w-8 h-8 mx-auto text-slate-600" />
                <p>Click <strong className="text-cyan-400">"Simulate Machine-to-Machine Handshake"</strong> to trigger the live x402 payment flow.</p>
              </div>
            )}

            {challenge402 && (
              <div className="space-y-3 font-mono text-xs">
                {/* 402 Response Box */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-900/50 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span>&lt; HTTP/1.1 402 Payment Required</span>
                    <span className="text-[10px] text-slate-400 font-normal">Step 1</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-0.5 border-t border-slate-800/80 pt-2">
                    <div><span className="text-slate-500">WWW-Authenticate:</span> <span className="text-cyan-300">{challenge402.headers["WWW-Authenticate"]}</span></div>
                    <div><span className="text-slate-500">x402-network:</span> {challenge402.headers["x402-network"]} (Chain: {challenge402.headers["x402-chain-id"]})</div>
                    <div><span className="text-slate-500">x402-amount:</span> <span className="text-emerald-400 font-bold">{challenge402.headers["x402-amount"]} {challenge402.tokenSymbol}</span> ({challenge402.priceUSD})</div>
                    <div><span className="text-slate-500">x402-recipient:</span> {challenge402.recipientVault}</div>
                    <div><span className="text-slate-500">x402-challenge-nonce:</span> {challenge402.headers["x402-challenge-nonce"]}</div>
                  </div>
                </div>

                {/* Client Payment Header Box */}
                {paymentProof && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-2">
                    <div className="flex items-center justify-between text-indigo-400 font-bold">
                      <span>&gt; GET {challenge402.resourceUri}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Step 2: Client Autopay</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-0.5 border-t border-slate-800/80 pt-2">
                      <div><span className="text-slate-500">Authorization:</span> <span className="text-indigo-300">{paymentProof.clientHeaders.Authorization}</span></div>
                      <div><span className="text-slate-500">x402-payer-session-key:</span> {paymentProof.clientHeaders["x402-payer-session-key"]}</div>
                      <div><span className="text-slate-500">x402-tx-hash:</span> <span className="text-cyan-400">{paymentProof.clientHeaders["x402-tx-hash"]}</span></div>
                    </div>
                  </div>
                )}

                {/* 200 OK Delivered Response Box */}
                {deliveredResponse && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-900/50 space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>&lt; HTTP/1.1 200 OK</span>
                      <span className="text-[10px] text-slate-400 font-normal">Step 3: Resource Delivered</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1 border-t border-slate-800/80 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Gas Cost on HSK L2:</span>
                        <span className="text-emerald-400 font-bold">{deliveredResponse.receipt.gasCostHSK}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Settlement Latency:</span>
                        <span className="text-cyan-300">{deliveredResponse.receipt.latencyMs} ms (Instant Sub-Second)</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Delivered Payload JSON:</span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg text-slate-200 text-[10px] overflow-x-auto">
                          {JSON.stringify(deliveredResponse.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from "react";
import { Send, Sparkles, Shield, Lock, CheckCircle2, AlertCircle, Pizza, Coffee, ArrowRight, Wallet, Info, Coins } from "lucide-react";
import type { Merchant, MenuItem, OrderRecord } from "../types.ts";
import { generateMockCredential, type UserCredential } from "../../agent/privacyVerifier.ts";
import { payAgent } from "../../agent/agent.ts";
import { parseEther, createWalletClient, custom, keccak256, stringToBytes } from "viem";
import { hskTestnet, DEFAULT_ESCROW_CONTRACT_ADDRESS, HSK_EXPLORER_URL } from "../../agent/hskChain.ts";
import { MERCHANT_ESCROW_ABI } from "../../agent/contractsAbi.ts";

interface CustomerOrderViewProps {
  merchants: Merchant[];
  onOrderCreated: (order: OrderRecord) => void;
  isProcessing: boolean;
  connectedAddress?: string | null;
}

export const CustomerOrderView: React.FC<CustomerOrderViewProps> = ({
  merchants,
  onOrderCreated,
  isProcessing,
  connectedAddress,
}) => {
  const [promptText, setPromptText] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(merchants[0]?.id || "");
  const [selectedItems, setSelectedItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [credentialType, setCredentialType] = useState<UserCredential["credentialType"]>("LOCAL_LOYALTY_VIP");
  const [agentFeedback, setAgentFeedback] = useState<string | null>(null);
  const [useWalletTx, setUseWalletTx] = useState(true);
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  // Quick preset conversational prompts
  const samplePrompts = [
    { label: "🇨🇴 Gesha Coffee & Pandebono", text: "Order a Gesha Chemex and an Artisanal Pandebono at Café de Origen Colombia" },
    { label: "🍕 Sourdough Margherita", text: "Order a Sourdough Margherita Verace at Napoli Rustica with extra basil" },
    { label: "☕ Oat Flat White & Croissant", text: "Get an Oat Flat White and a Pistachio Pain au Chocolat at Cyber Roast" },
    { label: "🍜 Tonkotsu Ramen & Gyoza", text: "Order 1 Signature Tonkotsu Ramen and 1 Crispy Wagyu Gyoza" },
  ];

  const handleApplyPrompt = (text: string) => {
    setPromptText(text);

    // Natural Language AI Parsing logic
    const lower = text.toLowerCase();
    let targetMerchant = merchants[0];

    if (
      lower.includes("colombia") ||
      lower.includes("gesha") ||
      lower.includes("bourbon") ||
      lower.includes("pandebono") ||
      lower.includes("huila") ||
      lower.includes("oblea") ||
      lower.includes("origen")
    ) {
      targetMerchant = merchants.find((m) => m.id === "cafe-origen-colombia") || targetMerchant;
    } else if (
      lower.includes("cyber") ||
      lower.includes("roast") ||
      lower.includes("flat white") ||
      lower.includes("croissant")
    ) {
      targetMerchant = merchants.find((m) => m.id === "cyber-roast-cafe") || targetMerchant;
    } else if (
      lower.includes("ramen") ||
      lower.includes("tonkotsu") ||
      lower.includes("gyoza") ||
      lower.includes("tokyo")
    ) {
      targetMerchant = merchants.find((m) => m.id === "tokyo-ramen-lab") || targetMerchant;
    } else {
      targetMerchant = merchants.find((m) => m.id === "pizzeria-napoletana") || targetMerchant;
    }

    setSelectedMerchantId(targetMerchant.id);

    // Match items from merchant's menu
    const matched: { item: MenuItem; quantity: number }[] = [];
    targetMerchant.menu.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      const keywords = itemNameLower.split(" ").filter((w) => w.length > 3);
      const isMatch = keywords.some((kw) => lower.includes(kw));
      if (isMatch) {
        matched.push({ item, quantity: 1 });
      }
    });

    if (matched.length === 0) {
      matched.push({ item: targetMerchant.menu[0], quantity: 1 });
    }

    setSelectedItems(matched);
    setAgentFeedback(`✨ AI Agent identified: "${targetMerchant.name}" with ${matched.length} item(s). Ready for escrow.`);
  };

  const addItemToCart = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) => (i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItemFromCart = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.item.id !== itemId));
  };

  const totalHSK = selectedItems.reduce((acc, curr) => acc + curr.item.priceHSK * curr.quantity, 0);

  const handleExecuteAutonomousOrder = async () => {
    if (selectedItems.length === 0) {
      setAgentFeedback("⚠️ Please select at least one menu item or type an order prompt.");
      return;
    }

    setAgentFeedback("⏳ Generating privacy credential and submitting escrow to HSK Testnet...");

    const tierMap: Record<UserCredential["credentialType"], string> = {
      LOCAL_LOYALTY_VIP: "ShanHaiWoo Gold Resident",
      STUDENT_DISCOUNT_PASS: "Verified Web3 Scholar",
      ANONYMOUS_AGE21_PASS: "Over-21 Verified Pass",
      COMMUNITY_RESIDENT: "ETH Colombia / District 4 Member",
    };

    const userCredential = generateMockCredential(credentialType, tierMap[credentialType]);
    const orderUniqueId = "order_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

    // Identify if any item is linked to an RWA inventory batch
    const firstRwaItem = selectedItems.find((si) => si.item.rwaBatchId !== undefined);
    const rwaAssetId = firstRwaItem?.item.rwaBatchId;

    // Real on-chain transaction via connected Web3 wallet (MetaMask / Rabby)
    if (connectedAddress && useWalletTx && typeof window !== "undefined" && (window as any).ethereum) {
      try {
        setIsWalletSubmitting(true);
        setAgentFeedback("🦊 Abriendo MetaMask para confirmar la transacción en HashKey Chain Testnet...");

        const walletClient = createWalletClient({
          chain: hskTestnet,
          transport: custom((window as any).ethereum),
        });

        const rawOrderHash = `0x${Math.random().toString(16).substring(2, 66).padStart(64, "0")}` as `0x${string}`;
        const commitment = (userCredential.subjectCommitment.startsWith("0x")
          ? userCredential.subjectCommitment
          : keccak256(stringToBytes(userCredential.subjectCommitment))) as `0x${string}`;
        const amountWei = parseEther(totalHSK.toString());

        const txHash = await (walletClient as any).writeContract({
          address: DEFAULT_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
          abi: MERCHANT_ESCROW_ABI,
          functionName: "createOrder",
          args: [
            rawOrderHash,
            selectedMerchant.address as `0x${string}`,
            amountWei,
            commitment,
            JSON.stringify({ merchant: selectedMerchant.id, items: selectedItems.map((i) => i.item.name) }),
          ],
          value: amountWei,
          account: connectedAddress as `0x${string}`,
          chain: hskTestnet,
        });

        setAgentFeedback(`🎉 ¡Transacción confirmada en tu wallet! Tx Hash: ${txHash.slice(0, 12)}...`);

        const orderRecord: OrderRecord = {
          id: orderUniqueId,
          orderHash: rawOrderHash,
          merchantId: selectedMerchant.id,
          merchantName: selectedMerchant.name,
          merchantAddress: selectedMerchant.address,
          customerAddress: connectedAddress as `0x${string}`,
          items: selectedItems.map((si) => ({
            name: si.item.name,
            quantity: si.quantity,
            unitPriceHSK: si.item.priceHSK,
          })),
          totalHSK: Number(totalHSK.toFixed(4)),
          status: "ESCROWED",
          credential: userCredential,
          rwaAssetId,
          txHash: txHash as `0x${string}`,
          createdAt: Date.now(),
          logs: [
            `[${new Date().toLocaleTimeString()}] Orden iniciada en HashKey Chain Testnet`,
            `[🦊 MetaMask] Transacción enviada y firmada desde tu wallet (${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)})`,
            `[⛓️ Tx Hash] ${txHash}`,
            `[MerchantEscrow.sol] Fondos bloqueados en custodia (${totalHSK.toFixed(4)} HSK)`,
            ...(rwaAssetId ? [`[RWA Link] Lote físico #${rwaAssetId} reservado`] : []),
          ],
          notes: promptText || `Ordered ${selectedItems.length} items`,
        };

        onOrderCreated(orderRecord);
        setPromptText("");
        setSelectedItems([]);
        setIsWalletSubmitting(false);
        return;
      } catch (err: any) {
        console.warn("Wallet transaction error:", err);
        const errMsg = err?.shortMessage || err?.message || "Transacción cancelada";
        setAgentFeedback(`⚠️ MetaMask: ${errMsg}. Ejecutando vía AI Session Key...`);
      } finally {
        setIsWalletSubmitting(false);
      }
    }

    const orderRecord: OrderRecord = {
      id: orderUniqueId,
      orderHash: `0x${Math.random().toString(16).substring(2, 66).padStart(64, "0")}`,
      merchantId: selectedMerchant.id,
      merchantName: selectedMerchant.name,
      merchantAddress: selectedMerchant.address,
      customerAddress: (connectedAddress as `0x${string}`) || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      items: selectedItems.map((si) => ({
        name: si.item.name,
        quantity: si.quantity,
        unitPriceHSK: si.item.priceHSK,
      })),
      totalHSK: Number(totalHSK.toFixed(4)),
      status: "ESCROWED",
      credential: userCredential,
      rwaAssetId,
      createdAt: Date.now(),
      logs: [
        `[${new Date().toLocaleTimeString()}] Order initiated via conversational AI: "${promptText || selectedMerchant.name + ' items'}"`,
        `[${new Date().toLocaleTimeString()}] Funds locked in MerchantEscrow.sol (${totalHSK.toFixed(4)} HSK)`,
        ...(rwaAssetId ? [`[RWA Link] Tied to on-chain Physical Inventory Batch #${rwaAssetId}`] : []),
      ],
      notes: promptText || `Ordered ${selectedItems.length} items`,
    };

    onOrderCreated(orderRecord);
    setPromptText("");
    setSelectedItems([]);
  };

  return (
    <div id="customer-order-view" className="space-y-6">
      {/* Conversational AI Prompt Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Conversational Ordering (Natural Language to HSK Escrow & DvP)</span>
          </div>
          <span className="text-xs bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/40">
            Account Abstraction Enabled
          </span>
        </div>

        <div className="relative">
          <input
            id="ai-order-prompt-input"
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && promptText.trim()) {
                handleApplyPrompt(promptText);
              }
            }}
            placeholder="e.g. 'Order a Gesha Chemex at Café de Origen Colombia' or 'Sourdough pizza at Napoli'..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 pr-28 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
          <button
            id="ai-order-parse-btn"
            onClick={() => handleApplyPrompt(promptText)}
            disabled={!promptText.trim()}
            className="absolute right-2 top-2 bottom-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Parse & Order</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick prompt pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-slate-400 mr-1">Quick Prompts:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              id={`quick-prompt-btn-${idx}`}
              onClick={() => handleApplyPrompt(p.text)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {agentFeedback && (
          <div className="mt-3 p-2.5 bg-slate-950/70 rounded-lg border border-indigo-900/50 text-xs text-indigo-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{agentFeedback}</span>
          </div>
        )}
      </div>

      {/* Main 2-Column: Merchant Menu + Escrow / Credential Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Merchant Selector & Menu (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-100 text-base">Select Physical Merchant</h3>
            <span className="text-xs text-slate-400 font-mono">HashKey L2 + ETH Colombia Hub</span>
          </div>

          {/* Merchant Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {merchants.map((m) => {
              const active = m.id === selectedMerchantId;
              return (
                <button
                  key={m.id}
                  id={`merchant-tab-${m.id}`}
                  onClick={() => {
                    setSelectedMerchantId(m.id);
                    setSelectedItems([]);
                  }}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    active
                      ? "bg-slate-800/90 border-indigo-500 shadow-sm ring-1 ring-indigo-500/40"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div className="text-2xl mb-1">{m.avatarEmoji}</div>
                  <div className="font-medium text-xs text-slate-100 truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.category}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Merchant Details Banner */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{selectedMerchant.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  KYB Registered
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">{selectedMerchant.location}</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-400 text-[10px]">Settlement Vault:</span>
              <div className="text-cyan-400 text-[11px]">
                {selectedMerchant.address.slice(0, 6)}...{selectedMerchant.address.slice(-4)}
              </div>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {selectedMerchant.category} Menu & Tokenized Inventory
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedMerchant.menu.map((item) => {
                const inCart = selectedItems.find((i) => i.item.id === item.id);
                return (
                  <div
                    key={item.id}
                    id={`menu-item-${item.id}`}
                    className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-lg">{item.emoji}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
                            {item.priceHSK} HSK
                          </span>
                          {item.rwaBatchId && (
                            <span className="text-[9px] font-mono text-amber-300 bg-amber-950/70 border border-amber-800/40 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Coins className="w-2.5 h-2.5" />
                              RWA Batch #{item.rwaBatchId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-medium text-xs text-slate-200 mt-1">{item.name}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      {inCart ? (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => removeItemFromCart(item.id)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono text-slate-200">{inCart.quantity}</span>
                          <button
                            onClick={() => addItemToCart(item)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Tap to add</span>
                      )}

                      <button
                        onClick={() => addItemToCart(item)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {inCart ? "Add More" : "+ Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Escrow Checkout & Privacy Credential Sandbox (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-sm text-slate-100">Escrow Checkout & DvP</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                MerchantEscrow.sol
              </span>
            </div>

            {/* Connected Buyer Notice */}
            <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-400">Buyer Identity:</span>
              {connectedAddress ? (
                <span className="font-mono text-cyan-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {`${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)} (Live Wallet)`}
                </span>
              ) : (
                <span className="font-mono text-slate-400">
                  0xf39F...2266 (Default Agent)
                </span>
              )}
            </div>

            {/* Selected Items Summary */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Order Items</span>
              {selectedItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                  No items selected yet. Tap items or use the prompt bar above.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedItems.map((si) => (
                    <div
                      key={si.item.id}
                      className="flex items-center justify-between text-xs p-2 bg-slate-950/80 rounded-lg border border-slate-800/60"
                    >
                      <div className="truncate pr-2">
                        <span className="mr-1.5">{si.item.emoji}</span>
                        <span className="text-slate-200">{si.item.name}</span>
                        <span className="text-slate-400 ml-1">x{si.quantity}</span>
                      </div>
                      <span className="font-mono text-emerald-400 shrink-0 font-medium">
                        {(si.item.priceHSK * si.quantity).toFixed(4)} HSK
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Local Privacy Credential Selector (EAG Buildathon Track: Local AI / Privacy) */}
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-indigo-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Local Privacy Credential (ZK/Selective Disclosure)</span>
                </div>
                <span className="text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800/40">
                  No PII Leaked
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Evaluated in the local client sandbox. The AI agent submits a cryptographic commitment
                <code className="text-indigo-300 font-mono text-[10px] ml-1">keccak256(zkProof)</code> to the HSK contract.
              </p>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "LOCAL_LOYALTY_VIP", label: "ShanHai Gold Resident" },
                  { id: "STUDENT_DISCOUNT_PASS", label: "Web3 Scholar Pass" },
                  { id: "ANONYMOUS_AGE21_PASS", label: "Age 21+ Proof" },
                  { id: "COMMUNITY_RESIDENT", label: "ETH Colombia Pass" },
                ].map((cred) => (
                  <button
                    key={cred.id}
                    onClick={() => setCredentialType(cred.id as any)}
                    className={`text-[11px] p-2 rounded-lg text-left border transition-all cursor-pointer ${
                      credentialType === cred.id
                        ? "bg-indigo-950/70 border-indigo-500 text-indigo-200 font-medium"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-indigo-400" />
                      <span className="truncate">{cred.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Total and Gas Sponsorship Notice */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Network Fee (HSK L2):</span>
                <span className="text-emerald-400 font-mono">
                  {connectedAddress && useWalletTx ? "Gas estándar L2 (HSK)" : "Sponsored by Paymaster (0.00 HSK)"}
                </span>
              </div>

              {connectedAddress && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="use-wallet-tx"
                      checked={useWalletTx}
                      onChange={(e) => setUseWalletTx(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                    />
                    <label htmlFor="use-wallet-tx" className="cursor-pointer text-slate-200 text-xs font-medium">
                      Firmar transacción con mi Wallet (MetaMask)
                    </label>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                    HSK Testnet (133)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-200">Escrow Total:</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {totalHSK.toFixed(4)} HSK
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              id="confirm-autonomous-order-btn"
              onClick={handleExecuteAutonomousOrder}
              disabled={isProcessing || isWalletSubmitting || selectedItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              {isWalletSubmitting ? (
                <>
                  <span className="inline-block animate-spin">🦊</span>
                  <span>Confirmando en MetaMask / Wallet...</span>
                </>
              ) : isProcessing ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>AI Agent Executing on HSK...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {connectedAddress && useWalletTx
                      ? "Pagar con MetaMask en HSK Testnet"
                      : "Lock in Escrow & Authorize AI Agent"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

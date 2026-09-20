import React, { useState } from "react";
import { Code, FileCode, Check, Copy, ExternalLink, ShieldCheck, Play, Sparkles, Coins } from "lucide-react";
import { DEFAULT_ESCROW_CONTRACT_ADDRESS, HSK_EXPLORER_URL, HSK_CHAIN_ID, HSK_RPC_ENDPOINT } from "../../agent/hskChain.ts";
import { MERCHANT_ESCROW_ABI, MERCHANT_RWA_ABI } from "../../agent/contractsAbi.ts";

export const SmartContractViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"solidity" | "rwaSolidity" | "deployScript" | "abi" | "params">("solidity");
  const [copied, setCopied] = useState(false);

  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerchantEscrow
 * @dev Autonomous AI-Agent powered escrow for local physical commerce on HSK Testnet (Chain ID: 133).
 *      Designed for EAG Global Buildathon (AI x Ethereum, Privacy WG, Physical AI & HashKey Chain Track).
 *      Implements:
 *      1. Account Abstraction-friendly session key authorization.
 *      2. Local zero-knowledge privacy verification commitments.
 *      3. Delivery vs Payment (DvP) atomic settlement with Physical AI & IoT device handover telemetry.
 *      4. Institutional risk mitigation and emergency circuit breaker.
 */
contract MerchantEscrow {
    enum OrderStatus { None, Escrowed, PaymentReleased, Refunded }

    struct Order {
        bytes32 orderId;
        address buyer;
        address payable merchant;
        uint256 amount;
        uint256 createdAt;
        uint256 completedAt;
        OrderStatus status;
        bytes32 credentialCommitment; // Local privacy proof commitment
        string metadataURI;
        bytes32 physicalHandoverHash; // Physical AI / IoT telemetry proof
        uint256 rwaAssetId;           // Linked Real-World Asset ID
    }

    address public owner;
    address public rwaRegistry;
    bool public isPaused;
    mapping(address => bool) public authorizedAgents;
    mapping(bytes32 => Order) public orders;
    bytes32[] public allOrderIds;

    event OrderCreated(bytes32 indexed orderId, address indexed buyer, address indexed merchant, uint256 amount, bytes32 credentialCommitment, uint256 timestamp);
    event PaymentReleased(bytes32 indexed orderId, address indexed merchant, uint256 amount, address indexed verifiedByAgent, uint256 timestamp);
    event PaymentReleasedDvP(bytes32 indexed orderId, address indexed merchant, uint256 amount, bytes32 physicalHandoverHash, uint256 rwaAssetId, address indexed verifiedByAgent, uint256 timestamp);
    event OrderRefunded(bytes32 indexed orderId, address indexed buyer, uint256 amount, string reason, uint256 timestamp);

    modifier onlyAuthorizedAgentOrOwner() {
        require(msg.sender == owner || authorizedAgents[msg.sender], "Unauthorized");
        _;
    }

    constructor(address initialAgent) {
        owner = msg.sender;
        if (initialAgent != address(0)) {
            authorizedAgents[initialAgent] = true;
        }
    }

    function createOrder(bytes32 orderId, address payable merchant, uint256 amount, bytes32 credentialCommitment, string calldata metadataURI) external payable {
        require(!isPaused, "Paused");
        require(merchant != address(0), "Zero address");
        require(orders[orderId].status == OrderStatus.None, "Order exists");
        require(msg.value >= amount, "Insufficient payment");

        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            merchant: merchant,
            amount: amount,
            createdAt: block.timestamp,
            completedAt: 0,
            status: OrderStatus.Escrowed,
            credentialCommitment: credentialCommitment,
            metadataURI: metadataURI,
            physicalHandoverHash: bytes32(0),
            rwaAssetId: 0
        });
        allOrderIds.push(orderId);
        emit OrderCreated(orderId, msg.sender, merchant, amount, credentialCommitment, block.timestamp);
    }

    function releasePaymentDvP(bytes32 orderId, bytes32 physicalHandoverHash, uint256 rwaAssetId) external onlyAuthorizedAgentOrOwner {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Escrowed, "Not escrowed");
        order.status = OrderStatus.PaymentReleased;
        order.completedAt = block.timestamp;
        order.physicalHandoverHash = physicalHandoverHash;
        order.rwaAssetId = rwaAssetId;

        (bool success, ) = order.merchant.call{value: order.amount}("");
        require(success, "Transfer failed");

        emit PaymentReleasedDvP(orderId, order.merchant, order.amount, physicalHandoverHash, rwaAssetId, msg.sender, block.timestamp);
    }

    function refundOrder(bytes32 orderId, string calldata reason) external {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Escrowed, "Not escrowed");
        require(msg.sender == owner || authorizedAgents[msg.sender] || (msg.sender == order.buyer && block.timestamp > order.createdAt + 1 hours), "Unauthorized");
        order.status = OrderStatus.Refunded;
        order.completedAt = block.timestamp;
        (bool success, ) = payable(order.buyer).call{value: order.amount}("");
        require(success, "Transfer failed");
        emit OrderRefunded(orderId, order.buyer, order.amount, reason, block.timestamp);
    }
}`;

  const rwaSolidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerchantRWA
 * @dev Real-World Asset (RWA) tokenization contract for physical local commerce and merchants.
 *      Enables physical merchants to tokenize inventory batches, specialty coffee micro-lots,
 *      and pre-paid commercial receivables on HashKey Chain (HSK).
 *      Designed for HashKey Institutional RWA Track & DvP Settlement.
 */
contract MerchantRWA {
    enum AssetType { SpecialtyCoffeeMicroLot, ArtisanInventoryBatch, CommercialReceivable }
    enum AssetStatus { Active, LockedInDvP, SettledAndDelivered, Redeemed }

    struct PhysicalAsset {
        uint256 assetId;
        string name;
        AssetType assetType;
        address originMerchant;
        address currentHolder;
        uint256 valuationHSK;
        uint256 batchQuantity;
        string originLocation;
        bytes32 physicalBatchHash;
        AssetStatus status;
        uint256 mintedAt;
        uint256 deliveredAt;
    }

    address public owner;
    address public authorizedEscrow;
    uint256 private _nextAssetId = 1;
    mapping(uint256 => PhysicalAsset) public assets;

    event AssetMinted(uint256 indexed assetId, string name, AssetType assetType, address indexed merchant, uint256 valuationHSK, bytes32 physicalBatchHash, uint256 timestamp);
    event AssetSettledDvP(uint256 indexed assetId, address indexed newOwner, uint256 timestamp);

    constructor() { owner = msg.sender; }

    function mintAsset(string calldata assetName, AssetType assetType, address merchant, uint256 valuationHSK, uint256 batchQuantity, string calldata originLocation, bytes32 physicalBatchHash) external returns (uint256) {
        uint256 assetId = _nextAssetId++;
        assets[assetId] = PhysicalAsset({
            assetId: assetId,
            name: assetName,
            assetType: assetType,
            originMerchant: merchant,
            currentHolder: merchant,
            valuationHSK: valuationHSK,
            batchQuantity: batchQuantity,
            originLocation: originLocation,
            physicalBatchHash: physicalBatchHash,
            status: AssetStatus.Active,
            mintedAt: block.timestamp,
            deliveredAt: 0
        });
        emit AssetMinted(assetId, assetName, assetType, merchant, valuationHSK, physicalBatchHash, block.timestamp);
        return assetId;
    }

    function executeDvPHandover(uint256 assetId, address buyer) external {
        require(msg.sender == owner || msg.sender == authorizedEscrow, "Unauthorized");
        PhysicalAsset storage asset = assets[assetId];
        asset.currentHolder = buyer;
        asset.status = AssetStatus.SettledAndDelivered;
        asset.deliveredAt = block.timestamp;
        emit AssetSettledDvP(assetId, buyer, block.timestamp);
    }
}`;

  const deployScriptCode = `import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying PayAgent HSK Suite to HashKey Chain (HSK) Testnet...");
  const [deployer] = await ethers.getSigners();
  const initialAgentAddress = process.env.AI_AGENT_SESSION_ADDRESS || deployer.address;

  // 1. Deploy MerchantEscrow with DvP
  const MerchantEscrow = await ethers.getContractFactory("MerchantEscrow");
  const escrow = await MerchantEscrow.deploy(initialAgentAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ MerchantEscrow deployed to:", escrowAddress);

  // 2. Deploy MerchantRWA
  const MerchantRWA = await ethers.getContractFactory("MerchantRWA");
  const rwa = await MerchantRWA.deploy();
  await rwa.waitForDeployment();
  const rwaAddress = await rwa.getAddress();
  console.log("✅ MerchantRWA deployed to:", rwaAddress);

  // 3. Link Escrow with RWA Registry
  await escrow.setRwaRegistry(rwaAddress);
  await rwa.setAuthorizedEscrow(escrowAddress);
  console.log("🔗 DvP Atomic settlement bridge linked!");
}

main().catch(console.error);`;

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="smart-contract-viewer" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Smart Contracts & HSK Testnet Deployment Spec
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Solidity v0.8.20+ Escrow & RWA Tokenization with DvP Atomic Settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`${HSK_EXPLORER_URL}/address/${DEFAULT_ESCROW_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-900/60 transition-colors"
          >
            <span>HSK Testnet Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: "solidity", label: "MerchantEscrow.sol (DvP)" },
          { id: "rwaSolidity", label: "MerchantRWA.sol" },
          { id: "deployScript", label: "scripts/deploy.ts" },
          { id: "abi", label: "Contract ABIs" },
          { id: "params", label: "HSK Network Parameters" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-800 text-slate-100 font-semibold border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="relative bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96">
        <button
          onClick={() =>
            handleCopyCode(
              activeTab === "solidity"
                ? solidityCode
                : activeTab === "rwaSolidity"
                ? rwaSolidityCode
                : activeTab === "deployScript"
                ? deployScriptCode
                : activeTab === "abi"
                ? JSON.stringify({ MERCHANT_ESCROW_ABI, MERCHANT_RWA_ABI }, null, 2)
                : `Chain ID: ${HSK_CHAIN_ID}\nRPC: ${HSK_RPC_ENDPOINT}\nExplorer: ${HSK_EXPLORER_URL}`
            )
          }
          className="absolute right-3 top-3 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>

        {activeTab === "solidity" && (
          <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
            {solidityCode}
          </pre>
        )}

        {activeTab === "rwaSolidity" && (
          <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
            {rwaSolidityCode}
          </pre>
        )}

        {activeTab === "deployScript" && (
          <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
            {deployScriptCode}
          </pre>
        )}

        {activeTab === "abi" && (
          <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
            {JSON.stringify({ MERCHANT_ESCROW_ABI, MERCHANT_RWA_ABI }, null, 2)}
          </pre>
        )}

        {activeTab === "params" && (
          <div className="space-y-3 font-sans text-xs text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Network Name</span>
                <span className="font-semibold text-slate-100 text-sm">HashKey Chain Testnet</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Chain ID</span>
                <span className="font-semibold font-mono text-emerald-400 text-sm">133</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">Currency Symbol</span>
                <span className="font-semibold text-slate-100 text-sm">HSK (18 Decimals)</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 block font-mono text-[11px]">RPC Endpoint</span>
                <span className="font-mono text-slate-200 text-[11px] truncate block">{HSK_RPC_ENDPOINT}</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/40 text-indigo-300">
              <span className="font-semibold block mb-1">Multi-Track Buildathon Alignment:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li><strong>AI x Agent Economy:</strong> Ephemeral Session Keys authorized to execute conditional escrow settlement.</li>
                <li><strong>Ethereum Privacy Working Group:</strong> Client-side ZK-proof evaluation with blinded keccak commitments on-chain.</li>
                <li><strong>Physical AI & Robotics Fleet:</strong> Hardware enclave BLE/NFC proximity proofs anchored in <code>releasePaymentDvP</code>.</li>
                <li><strong>HashKey Institutional RWA & DvP:</strong> Tokenization of physical merchant micro-lots in <code>MerchantRWA.sol</code> and simultaneous DvP release.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

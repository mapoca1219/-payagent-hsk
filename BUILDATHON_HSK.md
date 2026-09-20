# PayAgent HSK: Multi-Track Autonomous Financial Operating System

> **EAG Global Buildathon Comprehensive Multi-Track Submission**  
> **Participating Tracks & Target Awards:**  
> 1. 🤖 *AI x Ethereum / Agent Economy Track* (Autonomous Session Keys ERC-4337)  
> 2. 🛡️ *Ethereum Privacy Working Group Track* (Client Enclave ZK-Proofs & Selective Disclosure)  
> 3. 🦾 *Physical AI, Smart Devices & Robotics Fleet Track* (Hardware Enclaves & Proximity Telemetry)  
> 4. ⚡ *HashKey Chain (HSK) L2 Track* (High-Performance Financial Infrastructure, Sub-Cent Gas)  
> 5. 🏛️ *HashKey Institutional TradFi, RWA & DvP Settlement Track* (KYB/AML Engine + Delivery vs Payment)  
> 6. 🇨🇴 *Application Track & Local Community Impact* (ETH Colombia Hub & Direct-Trade Micro-Lots)  
> **Target Award:** ShanHaiWoo Scholarship & Grand Prize  

---

## 🌟 Executive Summary & Multi-Track Value Proposition

**PayAgent HSK** is an autonomous AI agent architecture connecting the physical world, traditional institutions, and decentralized finance on **HashKey Chain (HSK) Testnet (Chain ID: 133)**.

By synthesizing the vision of the hackathon organizers:
1. **Ethereum Privacy Working Group & Local Enclaves:** Eliminates all personal identity leakages (PII) using zero-knowledge credentials (`keccak256(zkProof)`). Users prove membership or age eligibility without revealing sensitive information to merchants or public mempools.
2. **Physical AI, Smart Devices & Robotics:** Bridges autonomous delivery rovers, IoT POS beacons, and smart physical lockers directly to Ethereum & HSK. Escrow release requires cryptographic hardware proximity and sensor telemetry (`ARM TrustZone / RISC-V Keystone`).
3. **HashKey Institutional TradFi, Compliance & DvP:** Implements an institutional-grade **KYB (Know Your Business)** and **AML risk rating engine** (OFAC/UN sanctions clearing), **Commercial Privacy ZK-SNARKs** (protecting wholesale margins and trading secrets), and **Delivery vs Payment (DvP)** atomic settlement for tokenized **Real-World Assets (RWA)** like Colombian specialty coffee micro-lots.
4. **x402 & MPP Machine Payment Protocol (EAG Workshop by Xiang):** Native implementation of `HTTP 402 Payment Required` and the IETF draft Machine Payment Protocol (MPP by Tempo Labs), unlocking instant machine-to-machine micro-settlement ($0.001 per call) without human credit cards or monthly subscriptions.
5. **ETH Colombia & Local Commerce Hub:** Empowers physical micro-merchants in Medellín, Bogotá, and global hubs with sub-cent gas payments, removing predatory 3-5% credit card processor fees.

---

## 🏗️ Technical Architecture & Key Modules

```
payagent-hsk/
├── contracts/
│   ├── MerchantEscrow.sol          # Production Escrow with DvP atomic release, RWA link & circuit breaker
│   ├── MerchantRWA.sol             # Real-World Asset (RWA) tokenization contract for physical inventory batches
│   └── hardhat.config.cjs          # Hardhat configuration targeting HSK Testnet (Chain ID 133)
├── agent/
│   ├── agent.ts                    # Autonomous AI Agent orchestrator (processOrderAndPayDvP, Viem client)
│   ├── hskChain.ts                 # Custom Viem chain definition for HashKey Chain Testnet
│   ├── contractsAbi.ts             # Complete ABI definitions for MerchantEscrow & MerchantRWA
│   ├── privacyVerifier.ts          # ZK Verifier: BBS+ credentials + Commercial Privacy ZK-SNARKs
│   ├── physicalAiDevice.ts         # Physical AI, IoT POS Beacon & Autonomous Delivery Rover connector
│   ├── complianceEngine.ts         # Institutional KYB (Know Your Business), KYC & AML risk rating engine
│   └── x402Protocol.ts             # x402 Protocol & Machine Payment Protocol (MPP) HTTP 402 engine
├── src/
│   ├── components/
│   │   ├── CustomerOrderView.tsx   # Conversational AI prompt ordering, RWA badges & ZK escrow
│   │   ├── MerchantDashboard.tsx   # Real-time POS incoming order tickets & DvP fulfillment triggers
│   │   ├── PhysicalAiMonitor.tsx   # Live fleet monitor for IoT Beacons, Delivery Rovers & Telemetry
│   │   ├── InstitutionalKybModal.tsx# Institutional KYB profiles, AML audit trail & Commercial ZK Inspector
│   │   ├── X402ProtocolPlayground.tsx# Live HTTP 402 handshake playground (AI Agent ➔ Machine Server)
│   │   ├── AgentTerminalLogs.tsx   # Live execution logs of cryptographic proofs & HSK RPC calls
│   │   ├── HskNetworkMonitor.tsx   # Live block height, gas price, and RPC monitor
│   │   ├── SmartContractViewer.tsx # Interactive contract inspector (MerchantEscrow + MerchantRWA)
│   │   └── ArchitectureModal.tsx   # Full 6-track buildathon alignment and flow diagram
│   ├── data/
│   │   └── mockMerchants.ts        # Authentic physical merchants (including Café de Origen Colombia)
│   ├── types.ts                    # Global TypeScript interfaces for orders, RWA, compliance & telemetry
│   ├── App.tsx                     # Main interactive application dashboard with multi-track navigation
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Tailwind CSS styling entry
```

---

## 🚀 How to Run & Verify

```bash
# 1. Install dependencies
npm install

# 2. Verify compilation & type checks
npx tsc --noEmit
npm run build

# 3. Start local development server
npm run dev
```
Accessible at `http://localhost:3000`.

import React from "react";
import "../src/index.css";

export interface Metadata {
  title?: string;
  description?: string;
  openGraph?: {
    title?: string;
    description?: string;
  };
}

export const metadata: Metadata = {
  title: "PayAgent HSK | Autonomous AI Micro-Payments & Escrow",
  description: "Autonomous AI agent enabling seamless, privacy-preserving micro-payments for physical local businesses on HSK Testnet leveraging Account Abstraction (ERC-4337).",
  openGraph: {
    title: "PayAgent HSK | Autonomous AI Micro-Payments & Escrow",
    description: "Autonomous AI agent enabling seamless, privacy-preserving micro-payments for physical local businesses on HSK Testnet leveraging Account Abstraction (ERC-4337).",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

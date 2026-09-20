import React, { useState, useEffect } from "react";
import { Wallet, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { HSK_CHAIN_ID, HSK_RPC_ENDPOINT, HSK_EXPLORER_URL } from "../../agent/hskChain.ts";

interface WalletConnectButtonProps {
  onAddressChange?: (address: string | null) => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ onAddressChange }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isHashKeyChain = chainId === HSK_CHAIN_ID;

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            onAddressChange?.(accounts[0]);
            fetchBalance(accounts[0]);
          }
        })
        .catch(console.error);

      ethereum
        .request({ method: "eth_chainId" })
        .then((hexChainId: string) => {
          setChainId(Number.parseInt(hexChainId, 16));
        })
        .catch(console.error);

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onAddressChange?.(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance(null);
          onAddressChange?.(null);
        }
      };

      const handleChainChanged = (hexChainId: string) => {
        setChainId(Number.parseInt(hexChainId, 16));
        ethereum
          .request({ method: "eth_accounts" })
          .then((accs: string[]) => {
            if (accs && accs.length > 0) fetchBalance(accs[0]);
          })
          .catch(() => {});
      };

      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
          ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  const fetchBalance = async (address: string) => {
    try {
      if ((window as any).ethereum) {
        const hexBalance = await (window as any).ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        const wei = BigInt(hexBalance);
        const hsk = (Number(wei) / 1e18).toFixed(4);
        setBalance(hsk);
      }
    } catch (err) {
      console.warn("Could not fetch balance from wallet:", err);
    }
  };

  const connectWallet = async () => {
    setErrorMsg(null);
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setErrorMsg("No Web3 wallet found. Please install MetaMask, Rabby or OKX Wallet.");
      return;
    }

    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        onAddressChange?.(accounts[0]);
        await fetchBalance(accounts[0]);

        const currentChainId = await ethereum.request({ method: "eth_chainId" });
        setChainId(Number.parseInt(currentChainId, 16));
      }
    } catch (err: any) {
      console.error("User denied or error connecting:", err);
      setErrorMsg(err?.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToHashKeyChain = async () => {
    if (!(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;
    const hexChainId = `0x${HSK_CHAIN_ID.toString(16)}`;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: "HashKey Chain Testnet",
                nativeCurrency: {
                  name: "HashKey EcoPoints",
                  symbol: "HSK",
                  decimals: 18,
                },
                rpcUrls: [HSK_RPC_ENDPOINT],
                blockExplorerUrls: [HSK_EXPLORER_URL],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add HashKey Chain:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  if (!account) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="connect-injected-wallet-btn"
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isConnecting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wallet className="w-3.5 h-3.5" />
          )}
          <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
        </button>
        {errorMsg && (
          <span className="text-[10px] text-amber-400 hidden lg:inline" title={errorMsg}>
            {errorMsg.slice(0, 30)}...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
      {!isHashKeyChain ? (
        <button
          onClick={switchToHashKeyChain}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-medium hover:bg-amber-500/30 transition-colors"
          title="Click to switch wallet to HashKey Chain Testnet"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Switch to HSK</span>
        </button>
      ) : (
        <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>HSK Testnet</span>
        </span>
      )}

      {balance !== null && (
        <span className="font-mono text-slate-200 text-[11px] hidden sm:inline font-semibold">
          {balance} HSK
        </span>
      )}

      <a
        href={`${HSK_EXPLORER_URL}/address/${account}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60 transition-colors"
        title="View transactions and address on HashKey Chain Explorer"
      >
        <span>
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
        <ExternalLink className="w-3 h-3 text-cyan-400" />
      </a>
    </div>
  );
};


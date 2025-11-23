// Wallet utilities for Vroomberg dApp
import { ethers, BrowserProvider, Signer } from 'ethers';

export const ARBITRUM_CHAIN_ID = 42161;
export const ARBITRUM_CHAIN_ID_HEX = '0xA4B1';

export interface WalletConnection {
  address: string;
  provider: BrowserProvider;
  signer: Signer;
  chainId: number;
}

export async function connectWallet(): Promise<WalletConnection> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask to continue.');
  }

  const provider = new BrowserProvider(window.ethereum);

  // Request account access - this will return the currently selected account in MetaMask
  const accounts = await provider.send("eth_requestAccounts", []);

  // Use the current MetaMask account
  const signer = await provider.getSigner(accounts[0]);
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  // Check if on Arbitrum
  if (Number(network.chainId) !== ARBITRUM_CHAIN_ID) {
    await switchToArbitrum();
    // Re-fetch after switch
    const newNetwork = await provider.getNetwork();
    return {
      address,
      provider,
      signer,
      chainId: Number(newNetwork.chainId)
    };
  }

  return {
    address,
    provider,
    signer,
    chainId: Number(network.chainId)
  };
}

export async function switchToArbitrum(): Promise<void> {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARBITRUM_CHAIN_ID_HEX }],
    });
  } catch (error: any) {
    // Chain not added, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: ARBITRUM_CHAIN_ID_HEX,
          chainName: 'Arbitrum One',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://arb1.arbitrum.io/rpc'],
          blockExplorerUrls: ['https://arbiscan.io']
        }]
      });
    } else {
      throw error;
    }
  }
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

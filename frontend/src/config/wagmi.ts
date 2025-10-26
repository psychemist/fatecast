import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// Note: We use getDefaultConfig for all standard wallets (MetaMask, Coinbase, WalletConnect, etc.)
// The Farcaster connector is automatically available when running inside Farcaster client
export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Fatecast',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [sepolia],
  ssr: true,
});

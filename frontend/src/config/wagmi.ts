import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

// Override Sepolia's default RPC with Alchemy
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
};

export const config = createConfig({
  chains: [customSepolia],
  connectors: [
    // Farcaster MiniApp connector - auto-connects when in Farcaster
    farcasterMiniApp(),
    // Fallback for regular web browsers
    injected(),
  ],
  transports: {
    [customSepolia.id]: http(rpcUrl),
  },
  ssr: true,
});
